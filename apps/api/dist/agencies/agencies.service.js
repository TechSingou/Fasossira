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
var AgenciesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgenciesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const agency_entity_1 = require("./entities/agency.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const plan_limits_service_1 = require("../common/services/plan-limits.service");
let AgenciesService = AgenciesService_1 = class AgenciesService {
    constructor(agencyRepo, userRepo, planLimits) {
        this.agencyRepo = agencyRepo;
        this.userRepo = userRepo;
        this.planLimits = planLimits;
        this.logger = new common_1.Logger(AgenciesService_1.name);
    }
    async findAll(companyId, onlyActive = false) {
        const qb = this.agencyRepo
            .createQueryBuilder('a')
            .where('a.companyId = :companyId', { companyId })
            .orderBy('a.city', 'ASC')
            .addOrderBy('a.name', 'ASC');
        if (onlyActive)
            qb.andWhere('a.isActive = true');
        const agencies = await qb.getMany();
        if (!agencies.length)
            return [];
        const agencyIds = agencies.map((a) => a.id);
        const counts = await this.userRepo
            .createQueryBuilder('u')
            .select('u.agencyId', 'agencyId')
            .addSelect('COUNT(*)', 'total')
            .addSelect('SUM(CASE WHEN u.isActive THEN 1 ELSE 0 END)', 'active')
            .where('u.agencyId IN (:...ids)', { ids: agencyIds })
            .groupBy('u.agencyId')
            .getRawMany();
        const countMap = new Map(counts.map((c) => [c.agencyId, { total: +c.total, active: +c.active }]));
        return agencies.map((a) => ({
            ...a,
            agentCount: countMap.get(a.id)?.total ?? 0,
            activeAgentCount: countMap.get(a.id)?.active ?? 0,
        }));
    }
    async findOne(companyId, id) {
        const agency = await this.agencyRepo.findOne({ where: { id, companyId } });
        if (!agency)
            throw new common_1.NotFoundException('Agence introuvable');
        const countRaw = await this.userRepo
            .createQueryBuilder('u')
            .select('COUNT(*)', 'total')
            .addSelect('SUM(CASE WHEN u.isActive THEN 1 ELSE 0 END)', 'active')
            .where('u.agencyId = :id', { id })
            .getRawOne();
        return {
            ...agency,
            agentCount: +(countRaw?.total ?? 0),
            activeAgentCount: +(countRaw?.active ?? 0),
        };
    }
    async findAgents(companyId, agencyId) {
        await this.findOne(companyId, agencyId);
        return this.userRepo
            .createQueryBuilder('u')
            .select(['u.id', 'u.name', 'u.email', 'u.isActive', 'u.createdAt'])
            .where('u.companyId = :companyId', { companyId })
            .andWhere('u.agencyId = :agencyId', { agencyId })
            .orderBy('u.name', 'ASC')
            .getMany();
    }
    async create(companyId, dto) {
        await this.planLimits.assertCanCreate(companyId, 'agencies');
        const existing = await this.agencyRepo.findOne({
            where: { companyId, name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException(`Une agence "${dto.name}" existe déjà`);
        }
        const agency = this.agencyRepo.create({
            companyId,
            name: dto.name,
            city: dto.city,
            address: dto.address ?? null,
            phone: dto.phone ?? null,
            managerName: dto.managerName ?? null,
        });
        const saved = await this.agencyRepo.save(agency);
        this.logger.log(`Agence créée : ${saved.name} (${saved.city})`);
        return saved;
    }
    async update(companyId, id, dto) {
        const agency = await this.agencyRepo.findOne({ where: { id, companyId } });
        if (!agency)
            throw new common_1.NotFoundException('Agence introuvable');
        if (dto.name && dto.name !== agency.name) {
            const conflict = await this.agencyRepo.findOne({
                where: { companyId, name: dto.name },
            });
            if (conflict)
                throw new common_1.ConflictException(`Une agence "${dto.name}" existe déjà`);
        }
        await this.agencyRepo.update({ id, companyId }, {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.city !== undefined && { city: dto.city }),
            ...(dto.address !== undefined && { address: dto.address }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.managerName !== undefined && { managerName: dto.managerName }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        });
        return this.agencyRepo.findOne({ where: { id, companyId } });
    }
    async remove(companyId, id) {
        const agency = await this.agencyRepo.findOne({ where: { id, companyId } });
        if (!agency)
            throw new common_1.NotFoundException('Agence introuvable');
        const agentCount = await this.userRepo.count({ where: { agencyId: id, companyId } });
        if (agentCount > 0) {
            throw new common_1.ConflictException(`Impossible de supprimer une agence avec ${agentCount} agent(s). Désactivez-la plutôt.`);
        }
        await this.agencyRepo.remove(agency);
        this.logger.log(`Agence supprimée : ${agency.name}`);
        return { message: `Agence "${agency.name}" supprimée` };
    }
};
exports.AgenciesService = AgenciesService;
exports.AgenciesService = AgenciesService = AgenciesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(agency_entity_1.AgencyEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        plan_limits_service_1.PlanLimitsService])
], AgenciesService);
//# sourceMappingURL=agencies.service.js.map