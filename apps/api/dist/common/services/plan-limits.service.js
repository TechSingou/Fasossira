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
var PlanLimitsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanLimitsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const subscription_entity_1 = require("../../plans/entities/subscription.entity");
const bus_entity_1 = require("../../buses/entities/bus.entity");
const agency_entity_1 = require("../../agencies/entities/agency.entity");
const user_entity_1 = require("../../auth/entities/user.entity");
const types_1 = require("../../shared/types");
let PlanLimitsService = PlanLimitsService_1 = class PlanLimitsService {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(PlanLimitsService_1.name);
    }
    async assertCanCreate(companyId, resource) {
        const quota = await this.getQuota(companyId, resource);
        if (quota.limitReached) {
            const labels = {
                buses: 'bus',
                agencies: 'agence',
                users: 'utilisateur',
            };
            const label = labels[resource];
            this.logger.warn(`[PlanLimits] Tenant ${companyId} a atteint la limite ${resource}: ` +
                `${quota.current}/${quota.max} (plan: ${quota.planName})`);
            throw new common_1.ForbiddenException({
                code: 'PLAN_LIMIT_REACHED',
                resource,
                current: quota.current,
                max: quota.max,
                planName: quota.planName,
                message: `Limite atteinte : votre plan "${quota.planName}" autorise ` +
                    `${quota.max === -1 ? 'illimité' : quota.max} ${label}(s). ` +
                    `Vous en avez déjà ${quota.current}. ` +
                    `Passez à un plan supérieur pour continuer.`,
            });
        }
    }
    async getTenantQuotas(companyId) {
        const [buses, agencies, users] = await Promise.all([
            this.getQuota(companyId, 'buses'),
            this.getQuota(companyId, 'agencies'),
            this.getQuota(companyId, 'users'),
        ]);
        return { buses, agencies, users };
    }
    async getQuota(companyId, resource) {
        const plan = await this.getActivePlan(companyId);
        const maxMap = {
            buses: plan.maxBuses,
            agencies: plan.maxAgencies,
            users: plan.maxUsers,
        };
        const max = maxMap[resource];
        const isUnlimited = max === -1;
        const current = await this.countResource(companyId, resource);
        return {
            current,
            max,
            remaining: isUnlimited ? -1 : Math.max(0, max - current),
            limitReached: isUnlimited ? false : current >= max,
            planName: plan.name,
        };
    }
    async getActivePlan(companyId) {
        const sub = await this.dataSource
            .getRepository(subscription_entity_1.SubscriptionEntity)
            .findOne({
            where: { companyId, status: types_1.SubscriptionStatus.ACTIVE },
            relations: ['plan'],
            order: { startDate: 'DESC' },
        });
        if (!sub?.plan) {
            this.logger.error(`Tenant ${companyId} n'a pas de plan actif !`);
            throw new common_1.ForbiddenException({
                code: 'NO_ACTIVE_PLAN',
                message: "Votre abonnement est inactif ou expiré. Contactez l'administrateur.",
            });
        }
        return sub.plan;
    }
    async countResource(companyId, resource) {
        switch (resource) {
            case 'buses':
                return this.dataSource
                    .getRepository(bus_entity_1.BusEntity)
                    .count({ where: { companyId } });
            case 'agencies':
                return this.dataSource
                    .getRepository(agency_entity_1.AgencyEntity)
                    .count({ where: { companyId } });
            case 'users':
                return this.dataSource
                    .getRepository(user_entity_1.UserEntity)
                    .count({ where: { companyId } });
        }
    }
};
exports.PlanLimitsService = PlanLimitsService;
exports.PlanLimitsService = PlanLimitsService = PlanLimitsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], PlanLimitsService);
//# sourceMappingURL=plan-limits.service.js.map