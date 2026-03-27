"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../auth/entities/user.entity");
const agency_entity_1 = require("../agencies/entities/agency.entity");
const types_1 = require("../shared/types");
const plan_limits_service_1 = require("../common/services/plan-limits.service");
let UsersService = UsersService_1 = class UsersService {
    constructor(userRepo, agencyRepo, planLimits) {
        this.userRepo = userRepo;
        this.agencyRepo = agencyRepo;
        this.planLimits = planLimits;
        this.logger = new common_1.Logger(UsersService_1.name);
        this.BCRYPT_ROUNDS = 12;
    }
    async findAll(companyId, filters = {}) {
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
        if (filters.agencyId)
            qb.andWhere('u.agencyId = :agencyId', { agencyId: filters.agencyId });
        if (filters.role)
            qb.andWhere('u.role = :role', { role: filters.role });
        if (filters.isActive !== undefined)
            qb.andWhere('u.isActive = :isActive', { isActive: filters.isActive });
        return qb.getMany();
    }
    async findOne(companyId, id) {
        const user = await this.userRepo.findOne({
            where: { id, companyId },
            relations: ['agency'],
        });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        return user;
    }
    async create(companyId, dto) {
        await this.planLimits.assertCanCreate(companyId, 'users');
        const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
        if (existing)
            throw new common_1.ConflictException(`L'email ${dto.email} est déjà utilisé`);
        if (dto.agencyId) {
            const agency = await this.agencyRepo.findOne({
                where: { id: dto.agencyId, companyId, isActive: true },
            });
            if (!agency)
                throw new common_1.BadRequestException('Agence introuvable ou inactive');
        }
        if (dto.role === types_1.UserRole.AGENT && !dto.agencyId) {
            this.logger.warn(`Création d'un agent sans agence : ${dto.email}`);
        }
        const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
        const user = this.userRepo.create({
            companyId,
            name: dto.name,
            email: dto.email.toLowerCase(),
            password: passwordHash,
            role: dto.role,
            agencyId: dto.agencyId ?? null,
            isActive: true,
        });
        const saved = await this.userRepo.save(user);
        this.logger.log(`Utilisateur créé : ${saved.email} (${saved.role})`);
        return this.findOne(companyId, saved.id);
    }
    async update(companyId, id, dto) {
        const user = await this.userRepo.findOne({ where: { id, companyId } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (dto.agencyId) {
            const agency = await this.agencyRepo.findOne({
                where: { id: dto.agencyId, companyId, isActive: true },
            });
            if (!agency)
                throw new common_1.BadRequestException('Agence introuvable ou inactive');
        }
        await this.userRepo.update({ id, companyId }, {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.role !== undefined && { role: dto.role }),
            ...(dto.agencyId !== undefined && { agencyId: dto.agencyId }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        });
        return this.findOne(companyId, id);
    }
    async resetPassword(companyId, id, dto) {
        const user = await this.userRepo.findOne({ where: { id, companyId } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);
        await this.userRepo.update({ id }, {
            password: passwordHash,
            refreshTokenHash: null,
        });
        this.logger.log(`Mot de passe réinitialisé pour : ${user.email}`);
        return { message: 'Mot de passe réinitialisé avec succès' };
    }
    async changePassword(companyId, id, dto) {
        const user = await this.userRepo.findOne({
            where: { id, companyId },
            select: ['id', 'email', 'password', 'companyId'],
        });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const valid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!valid)
            throw new common_1.ForbiddenException('Mot de passe actuel incorrect');
        const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);
        await this.userRepo.update({ id }, { password: passwordHash, refreshTokenHash: null });
        return { message: 'Mot de passe modifié avec succès' };
    }
    async toggleActive(companyId, id) {
        const user = await this.userRepo.findOne({ where: { id, companyId } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        await this.userRepo.update({ id }, {
            isActive: !user.isActive,
            refreshTokenHash: user.isActive ? null : user.refreshTokenHash,
        });
        this.logger.log(`Utilisateur ${user.isActive ? 'désactivé' : 'activé'} : ${user.email}`);
        return this.findOne(companyId, id);
    }
    async remove(companyId, id, requesterId) {
        if (id === requesterId)
            throw new common_1.BadRequestException('Vous ne pouvez pas supprimer votre propre compte');
        const user = await this.userRepo.findOne({ where: { id, companyId } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        await this.userRepo.remove(user);
        this.logger.log(`Utilisateur supprimé : ${user.email}`);
        return { message: `Utilisateur "${user.name}" supprimé` };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(agency_entity_1.AgencyEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        plan_limits_service_1.PlanLimitsService])
], UsersService);
//# sourceMappingURL=users.service.js.map