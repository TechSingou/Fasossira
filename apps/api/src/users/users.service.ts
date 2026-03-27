import {
    Injectable, NotFoundException, ConflictException,
    BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../auth/entities/user.entity';
import { AgencyEntity } from '../agencies/entities/agency.entity';
import {
    CreateUserDto, UpdateUserDto,
    ResetPasswordDto, ChangePasswordDto,
} from './dto/user.dto';
import { UserRole } from '../shared/types';
import { PlanLimitsService } from '../common/services/plan-limits.service';

// ─── Projection publique (sans password, refreshTokenHash) ────

export type UserPublic = Omit<UserEntity, 'password' | 'refreshTokenHash'>;

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    private readonly BCRYPT_ROUNDS = 12;

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(AgencyEntity)
        private readonly agencyRepo: Repository<AgencyEntity>,
        private readonly planLimits: PlanLimitsService,
    ) { }

    // ─── Lister ────────────────────────────────────────────────

    async findAll(
        companyId: string,
        filters: { agencyId?: string; role?: UserRole; isActive?: boolean } = {},
    ): Promise<UserPublic[]> {
        const qb = this.userRepo
            .createQueryBuilder('u')
            .select([
                'u.id', 'u.name', 'u.email', 'u.role',
                'u.agencyId', 'u.isActive', 'u.createdAt', 'u.updatedAt',
            ])
            .leftJoin('u.agency', 'agency')
            .addSelect(['agency.id', 'agency.name', 'agency.city'])
            .where('u.companyId = :companyId', { companyId })
            .orderBy('u.name', 'ASC');

        if (filters.agencyId) qb.andWhere('u.agencyId = :agencyId', { agencyId: filters.agencyId });
        if (filters.role)     qb.andWhere('u.role = :role', { role: filters.role });
        if (filters.isActive !== undefined) qb.andWhere('u.isActive = :isActive', { isActive: filters.isActive });

        return qb.getMany() as Promise<UserPublic[]>;
    }

    // ─── Détail ────────────────────────────────────────────────

    async findOne(companyId: string, id: string): Promise<UserPublic> {
        const user = await this.userRepo.findOne({
            where: { id, companyId },
            relations: ['agency'],
        });
        if (!user) throw new NotFoundException('Utilisateur introuvable');
        return user as UserPublic;
    }

    // ─── Créer ────────────────────────────────────────────────
    //
    // Règles RBAC :
    //  - Un ADMIN peut créer ADMIN et AGENT dans son tenant
    //  - Un AGENT avec agencyId doit référencer une agence du même tenant
    //  - Email unique global (contrainte DB)

    async create(companyId: string, dto: CreateUserDto): Promise<UserPublic> {
        // ── Vérification quota AVANT toute opération DB ──────────
        await this.planLimits.assertCanCreate(companyId, 'users');

        // Unicité email
        const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
        if (existing) throw new ConflictException(`L'email ${dto.email} est déjà utilisé`);

        // Vérifier l'agence si fournie
        if (dto.agencyId) {
            const agency = await this.agencyRepo.findOne({
                where: { id: dto.agencyId, companyId, isActive: true },
            });
            if (!agency) throw new BadRequestException('Agence introuvable ou inactive');
        }

        // Un AGENT sans agencyId est autorisé (agent volant)
        if (dto.role === UserRole.AGENT && !dto.agencyId) {
            this.logger.warn(`Création d'un agent sans agence : ${dto.email}`);
        }

        const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

        const user = this.userRepo.create({
            companyId,
            name:     dto.name,
            email:    dto.email.toLowerCase(),
            password: passwordHash,
            role:     dto.role,
            agencyId: dto.agencyId ?? null,
            isActive: true,
        });

        const saved = await this.userRepo.save(user);
        this.logger.log(`Utilisateur créé : ${saved.email} (${saved.role})`);
        return this.findOne(companyId, saved.id);
    }

    // ─── Mettre à jour ────────────────────────────────────────

    async update(companyId: string, id: string, dto: UpdateUserDto): Promise<UserPublic> {
        const user = await this.userRepo.findOne({ where: { id, companyId } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        // Vérifier l'agence si fournie
        if (dto.agencyId) {
            const agency = await this.agencyRepo.findOne({
                where: { id: dto.agencyId, companyId, isActive: true },
            });
            if (!agency) throw new BadRequestException('Agence introuvable ou inactive');
        }

        await this.userRepo.update({ id, companyId }, {
            ...(dto.name     !== undefined && { name:     dto.name }),
            ...(dto.role     !== undefined && { role:     dto.role }),
            ...(dto.agencyId !== undefined && { agencyId: dto.agencyId }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        });

        return this.findOne(companyId, id);
    }

    // ─── Reset mot de passe (par ADMIN) ───────────────────────

    async resetPassword(companyId: string, id: string, dto: ResetPasswordDto): Promise<{ message: string }> {
        const user = await this.userRepo.findOne({ where: { id, companyId } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);
        await this.userRepo.update({ id }, {
            password:          passwordHash,
            refreshTokenHash:  null, // Invalide toutes les sessions existantes
        });

        this.logger.log(`Mot de passe réinitialisé pour : ${user.email}`);
        return { message: 'Mot de passe réinitialisé avec succès' };
    }

    // ─── Changer son propre mot de passe ──────────────────────

    async changePassword(
        companyId: string,
        id: string,
        dto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        const user = await this.userRepo.findOne({
            where: { id, companyId },
            select: ['id', 'email', 'password', 'companyId'],
        });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const valid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!valid) throw new ForbiddenException('Mot de passe actuel incorrect');

        const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);
        await this.userRepo.update({ id }, { password: passwordHash, refreshTokenHash: null });

        return { message: 'Mot de passe modifié avec succès' };
    }

    // ─── Activer / Désactiver ────────────────────────────────

    async toggleActive(companyId: string, id: string): Promise<UserPublic> {
        const user = await this.userRepo.findOne({ where: { id, companyId } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        // Invalide les sessions si désactivation
        await this.userRepo.update({ id }, {
            isActive:         !user.isActive,
            refreshTokenHash: user.isActive ? null : user.refreshTokenHash,
        });

        this.logger.log(`Utilisateur ${user.isActive ? 'désactivé' : 'activé'} : ${user.email}`);
        return this.findOne(companyId, id);
    }

    // ─── Supprimer ────────────────────────────────────────────

    async remove(companyId: string, id: string, requesterId: string): Promise<{ message: string }> {
        if (id === requesterId) throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte');

        const user = await this.userRepo.findOne({ where: { id, companyId } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        await this.userRepo.remove(user);
        this.logger.log(`Utilisateur supprimé : ${user.email}`);
        return { message: `Utilisateur "${user.name}" supprimé` };
    }
}
