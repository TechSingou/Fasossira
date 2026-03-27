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
var PlansService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_plan_entity_1 = require("./entities/subscription-plan.entity");
const subscription_entity_1 = require("./entities/subscription.entity");
const types_1 = require("../shared/types");
let PlansService = PlansService_1 = class PlansService {
    constructor(planRepo, subRepo) {
        this.planRepo = planRepo;
        this.subRepo = subRepo;
        this.logger = new common_1.Logger(PlansService_1.name);
    }
    async findAll() {
        return this.planRepo.find({ order: { price: 'ASC' } });
    }
    async findActive() {
        return this.planRepo.find({
            where: { isActive: true },
            order: { price: 'ASC' },
        });
    }
    async findOne(id) {
        const plan = await this.planRepo.findOne({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException(`Plan introuvable : ${id}`);
        return plan;
    }
    async create(dto) {
        const exists = await this.planRepo.findOne({ where: { name: dto.name } });
        if (exists)
            throw new common_1.ConflictException(`Un plan "${dto.name}" existe déjà`);
        const plan = this.planRepo.create({
            name: dto.name,
            price: dto.price,
            maxBuses: dto.maxBuses,
            maxAgencies: dto.maxAgencies,
            maxUsers: dto.maxUsers,
            features: dto.features,
            isActive: dto.isActive ?? true,
        });
        const saved = await this.planRepo.save(plan);
        this.logger.log(`Plan créé : ${saved.name} (${saved.price} FCFA/mois)`);
        return saved;
    }
    async update(id, dto) {
        const plan = await this.findOne(id);
        if (dto.name && dto.name !== plan.name) {
            const conflict = await this.planRepo.findOne({ where: { name: dto.name } });
            if (conflict)
                throw new common_1.ConflictException(`Un plan "${dto.name}" existe déjà`);
        }
        Object.assign(plan, dto);
        return this.planRepo.save(plan);
    }
    async toggleActive(id) {
        const plan = await this.findOne(id);
        plan.isActive = !plan.isActive;
        const saved = await this.planRepo.save(plan);
        this.logger.log(`Plan ${saved.isActive ? 'activé' : 'désactivé'} : ${saved.name}`);
        return saved;
    }
    async getStats() {
        const [plans, activeSubs] = await Promise.all([
            this.planRepo.find({ order: { price: 'ASC' } }),
            this.subRepo.find({
                where: { status: types_1.SubscriptionStatus.ACTIVE },
                relations: ['plan'],
            }),
        ]);
        const mrr = activeSubs.reduce((sum, s) => sum + Number(s.plan?.price ?? 0), 0);
        const byPlan = plans.map((p) => {
            const planSubs = activeSubs.filter((s) => s.planId === p.id);
            return {
                planId: p.id,
                planName: p.name,
                price: Number(p.price),
                count: planSubs.length,
                revenue: planSubs.length * Number(p.price),
            };
        });
        return { mrr, totalActiveSubs: activeSubs.length, byPlan };
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = PlansService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_plan_entity_1.SubscriptionPlanEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_entity_1.SubscriptionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PlansService);
//# sourceMappingURL=plans.service.js.map