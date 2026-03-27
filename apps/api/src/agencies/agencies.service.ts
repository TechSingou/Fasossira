import {
    Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgencyEntity } from './entities/agency.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { PlanLimitsService } from '../common/services/plan-limits.service';

// ─── Vue allégée d'un agent ───────────────────────────────────

export interface AgentSummary {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
}

// ─── Vue agence avec compteurs ────────────────────────────────

export interface AgencyWithStats extends AgencyEntity {
    agentCount: number;
    activeAgentCount: number;
}

@Injectable()
export class AgenciesService {
    private readonly logger = new Logger(AgenciesService.name);

    constructor(
        @InjectRepository(AgencyEntity)
        private readonly agencyRepo: Repository<AgencyEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly planLimits: PlanLimitsService,
    ) { }

    // ─── Lister avec compteurs agents ─────────────────────────

    async findAll(companyId: string, onlyActive = false): Promise<AgencyWithStats[]> {
        const qb = this.agencyRepo
            .createQueryBuilder('a')
            .where('a.companyId = :companyId', { companyId })
            .orderBy('a.city', 'ASC')
            .addOrderBy('a.name', 'ASC');

        if (onlyActive) qb.andWhere('a.isActive = true');

        const agencies = await qb.getMany();
        if (!agencies.length) return [];

        // Compteurs agents par agence (une seule requête groupée)
        const agencyIds = agencies.map((a) => a.id);
        const counts = await this.userRepo
            .createQueryBuilder('u')
            .select('u.agencyId', 'agencyId')
            .addSelect('COUNT(*)', 'total')
            .addSelect('SUM(CASE WHEN u.isActive THEN 1 ELSE 0 END)', 'active')
            .where('u.agencyId IN (:...ids)', { ids: agencyIds })
            .groupBy('u.agencyId')
            .getRawMany<{ agencyId: string; total: string; active: string }>();

        const countMap = new Map(
            counts.map((c) => [c.agencyId, { total: +c.total, active: +c.active }]),
        );

        return agencies.map((a) => ({
            ...a,
            agentCount:       countMap.get(a.id)?.total  ?? 0,
            activeAgentCount: countMap.get(a.id)?.active ?? 0,
        }));
    }

    // ─── Détail d'une agence ───────────────────────────────────

    async findOne(companyId: string, id: string): Promise<AgencyWithStats> {
        const agency = await this.agencyRepo.findOne({ where: { id, companyId } });
        if (!agency) throw new NotFoundException('Agence introuvable');

        const countRaw = await this.userRepo
            .createQueryBuilder('u')
            .select('COUNT(*)', 'total')
            .addSelect('SUM(CASE WHEN u.isActive THEN 1 ELSE 0 END)', 'active')
            .where('u.agencyId = :id', { id })
            .getRawOne<{ total: string; active: string }>();

        return {
            ...agency,
            agentCount:       +(countRaw?.total  ?? 0),
            activeAgentCount: +(countRaw?.active ?? 0),
        };
    }

    // ─── Agents d'une agence ───────────────────────────────────

    async findAgents(companyId: string, agencyId: string): Promise<AgentSummary[]> {
        await this.findOne(companyId, agencyId); // vérifie l'appartenance tenant
        return this.userRepo
            .createQueryBuilder('u')
            .select(['u.id', 'u.name', 'u.email', 'u.isActive', 'u.createdAt'])
            .where('u.companyId = :companyId', { companyId })
            .andWhere('u.agencyId = :agencyId', { agencyId })
            .orderBy('u.name', 'ASC')
            .getMany();
    }

    // ─── Créer ────────────────────────────────────────────────

    async create(companyId: string, dto: CreateAgencyDto): Promise<AgencyEntity> {
        // ── Vérification quota AVANT toute opération DB ──────────
        await this.planLimits.assertCanCreate(companyId, 'agencies');

        // Vérifier unicité du nom dans le tenant
        const existing = await this.agencyRepo.findOne({
            where: { companyId, name: dto.name },
        });
        if (existing) {
            throw new ConflictException(`Une agence "${dto.name}" existe déjà`);
        }

        const agency = this.agencyRepo.create({
            companyId,
            name: dto.name,
            city: dto.city,
            address:     dto.address     ?? null,
            phone:       dto.phone       ?? null,
            managerName: dto.managerName ?? null,
        });

        const saved = await this.agencyRepo.save(agency);
        this.logger.log(`Agence créée : ${saved.name} (${saved.city})`);
        return saved;
    }

    // ─── Mettre à jour ────────────────────────────────────────

    async update(companyId: string, id: string, dto: UpdateAgencyDto): Promise<AgencyEntity> {
        const agency = await this.agencyRepo.findOne({ where: { id, companyId } });
        if (!agency) throw new NotFoundException('Agence introuvable');

        // Vérifier unicité si le nom change
        if (dto.name && dto.name !== agency.name) {
            const conflict = await this.agencyRepo.findOne({
                where: { companyId, name: dto.name },
            });
            if (conflict) throw new ConflictException(`Une agence "${dto.name}" existe déjà`);
        }

        await this.agencyRepo.update({ id, companyId }, {
            ...(dto.name        !== undefined && { name:        dto.name }),
            ...(dto.city        !== undefined && { city:        dto.city }),
            ...(dto.address     !== undefined && { address:     dto.address }),
            ...(dto.phone       !== undefined && { phone:       dto.phone }),
            ...(dto.managerName !== undefined && { managerName: dto.managerName }),
            ...(dto.isActive    !== undefined && { isActive:    dto.isActive }),
        });

        return this.agencyRepo.findOne({ where: { id, companyId } }) as Promise<AgencyEntity>;
    }

    // ─── Supprimer ────────────────────────────────────────────

    async remove(companyId: string, id: string): Promise<{ message: string }> {
        const agency = await this.agencyRepo.findOne({ where: { id, companyId } });
        if (!agency) throw new NotFoundException('Agence introuvable');

        const agentCount = await this.userRepo.count({ where: { agencyId: id, companyId } });
        if (agentCount > 0) {
            throw new ConflictException(
                `Impossible de supprimer une agence avec ${agentCount} agent(s). Désactivez-la plutôt.`,
            );
        }

        await this.agencyRepo.remove(agency);
        this.logger.log(`Agence supprimée : ${agency.name}`);
        return { message: `Agence "${agency.name}" supprimée` };
    }
}
