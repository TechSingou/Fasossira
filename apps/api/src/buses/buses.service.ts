import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Not, Repository } from 'typeorm';
import { BusEntity, BusStatus } from './entities/bus.entity';
import { CreateBusDto, UpdateBusDto } from './dto/bus.dto';
import { ScheduleEntity, ScheduleStatus } from '../schedules/entities/schedule.entity';
import { PlanLimitsService } from '../common/services/plan-limits.service';

@Injectable()
export class BusesService {
    private readonly logger = new Logger(BusesService.name);

    constructor(
        @InjectRepository(BusEntity)
        private readonly busRepo: Repository<BusEntity>,
        private readonly dataSource: DataSource,
        private readonly planLimits: PlanLimitsService,
    ) { }

    async findAll(companyId: string, statusFilter?: BusStatus) {
        return this.busRepo.find({
            where: { companyId, ...(statusFilter ? { status: statusFilter } : {}) },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(companyId: string, id: string) {
        const bus = await this.busRepo.findOne({ where: { id, companyId } });
        if (!bus) throw new NotFoundException('Bus introuvable');
        return bus;
    }

    // ← nouveau : bus actifs sans conflit horaire pour un créneau donné
    async findAvailable(
        companyId: string,
        departureDateTime: Date,
        arrivalDateTime: Date,
    ): Promise<BusEntity[]> {
        // Récupérer les busIds occupés sur ce créneau
        const busyBusIds = await this.dataSource
            .getRepository(ScheduleEntity)
            .createQueryBuilder('s')
            .select('s.busId')
            .where('s.companyId = :companyId', { companyId })
            .andWhere('s.status != :cancelled', { cancelled: ScheduleStatus.CANCELLED })
            .andWhere('s.departureDateTime < :arrivalDateTime', { arrivalDateTime })
            .andWhere('s.arrivalDateTime > :departureDateTime', { departureDateTime })
            .getRawMany<{ s_busId: string }>();

        const busyIds = busyBusIds.map((r) => r.s_busId);

        // Tous les bus actifs du tenant, en excluant les occupés
        const qb = this.busRepo
            .createQueryBuilder('b')
            .where('b.companyId = :companyId', { companyId })
            .andWhere('b.status = :active', { active: BusStatus.ACTIVE })
            .orderBy('b.plate', 'ASC');

        if (busyIds.length > 0) {
            qb.andWhere('b.id NOT IN (:...busyIds)', { busyIds });
        }

        return qb.getMany();
    }


    async create(companyId: string, dto: CreateBusDto) {
        // ── Vérification quota AVANT toute opération DB ──────────
        await this.planLimits.assertCanCreate(companyId, 'buses');

        // Plaque unique par tenant
        const exists = await this.busRepo.findOne({
            where: { companyId, plate: dto.plate },
        });
        if (exists) {
            throw new ConflictException(`Un bus avec la plaque "${dto.plate}" existe déjà`);
        }

        const bus = this.busRepo.create({ ...dto, companyId });
        const saved = await this.busRepo.save(bus);
        this.logger.log(`Bus créé : ${saved.plate} (${companyId})`);
        return saved;
    }

    async update(companyId: string, id: string, dto: UpdateBusDto) {
        const bus = await this.findOne(companyId, id);

        // Si la plaque change, vérifier l'unicité
        if (dto.plate && dto.plate !== bus.plate) {
            const conflict = await this.busRepo.findOne({
                where: { companyId, plate: dto.plate },
            });
            if (conflict) {
                throw new ConflictException(`Un bus avec la plaque "${dto.plate}" existe déjà`);
            }
        }

        Object.assign(bus, dto);
        return this.busRepo.save(bus);
    }

    async remove(companyId: string, id: string) {
        const bus = await this.findOne(companyId, id);

        // Bloquer la suppression si des voyages futurs utilisent ce bus.
        // La FK onDelete:'RESTRICT' empêcherait déjà le DELETE en base, mais
        // l'erreur TypeORM serait cryptique — on préfère un message métier clair.
        const hasUpcomingSchedules = await this.dataSource
            .getRepository(ScheduleEntity)
            .exists({
                where: {
                    busId: id,
                    status: Not(ScheduleStatus.CANCELLED),
                    departureDateTime: MoreThan(new Date()),
                },
            });

        if (hasUpcomingSchedules) {
            throw new ConflictException(
                `Ce bus est assigné à des voyages futurs. ` +
                `Passez-le en MAINTENANCE ou RETIRED avant de le supprimer.`,
            );
        }

        await this.busRepo.remove(bus);
        return { message: 'Bus supprimé' };
    }
}