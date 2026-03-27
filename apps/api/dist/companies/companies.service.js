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
var CompaniesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("./entities/company.entity");
const company_settings_entity_1 = require("./entities/company-settings.entity");
const subscription_entity_1 = require("../plans/entities/subscription.entity");
const subscription_plan_entity_1 = require("../plans/entities/subscription-plan.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const agency_entity_1 = require("../agencies/entities/agency.entity");
const bus_entity_1 = require("../buses/entities/bus.entity");
const types_1 = require("../shared/types");
const auth_service_1 = require("../auth/auth.service");
let CompaniesService = CompaniesService_1 = class CompaniesService {
    constructor(companyRepo, settingsRepo, subRepo, planRepo, userRepo, agencyRepo, busRepo, authService, dataSource) {
        this.companyRepo = companyRepo;
        this.settingsRepo = settingsRepo;
        this.subRepo = subRepo;
        this.planRepo = planRepo;
        this.userRepo = userRepo;
        this.agencyRepo = agencyRepo;
        this.busRepo = busRepo;
        this.authService = authService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(CompaniesService_1.name);
    }
    async findAll() {
        const companies = await this.companyRepo.find({
            relations: ['settings', 'subscriptions', 'subscriptions.plan'],
            order: { createdAt: 'DESC' },
        });
        return Promise.all(companies.map((c) => this.toTenantSummary(c)));
    }
    async getGlobalStats() {
        const [totalTenants, activeTenants] = await Promise.all([
            this.companyRepo.count(),
            this.companyRepo.count({ where: { isActive: true } }),
        ]);
        const activeSubs = await this.subRepo.find({
            where: { status: types_1.SubscriptionStatus.ACTIVE },
            relations: ['plan'],
        });
        const mrr = activeSubs.reduce((sum, s) => sum + Number(s.plan?.price ?? 0), 0);
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);
        const newThisMonth = await this.companyRepo
            .createQueryBuilder('c')
            .where('c."createdAt" >= :date', { date: firstOfMonth })
            .getCount();
        return { totalTenants, activeTenants, suspendedTenants: totalTenants - activeTenants, mrr, newThisMonth };
    }
    async create(dto) {
        const slugExists = await this.companyRepo.findOne({ where: { slug: dto.slug } });
        if (slugExists)
            throw new common_1.ConflictException(`Le slug "${dto.slug}" est déjà utilisé`);
        const emailExists = await this.userRepo.findOne({ where: { email: dto.adminEmail.toLowerCase() } });
        if (emailExists)
            throw new common_1.ConflictException(`L'email "${dto.adminEmail}" est déjà utilisé`);
        const plan = await this.planRepo.findOne({ where: { id: dto.planId, isActive: true } });
        if (!plan)
            throw new common_1.BadRequestException('Plan invalide ou inactif');
        const tempPassword = dto.adminPassword ?? this.generateTempPassword();
        const isCustomPassword = !!dto.adminPassword;
        return this.dataSource.transaction(async (manager) => {
            const company = await manager.save(manager.create(company_entity_1.CompanyEntity, {
                name: dto.name, slug: dto.slug, city: dto.city, phone: dto.phone, isActive: true,
            }));
            await manager.save(manager.create(company_settings_entity_1.CompanySettingsEntity, {
                companyId: company.id,
                companyDisplayName: dto.name,
                primaryColor: '#0B3D91',
                secondaryColor: '#E63B2E',
                ticketFooter: `${dto.name} — Votre sécurité est notre priorité`,
                supportContact: dto.phone,
            }));
            const hashedPassword = await this.authService.hashPassword(tempPassword);
            await manager.save(manager.create(user_entity_1.UserEntity, {
                companyId: company.id,
                name: dto.adminName,
                email: dto.adminEmail.toLowerCase(),
                password: hashedPassword,
                role: types_1.UserRole.ADMIN,
                agencyId: null,
                isActive: true,
            }));
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            await manager.save(manager.create(subscription_entity_1.SubscriptionEntity, {
                companyId: company.id, planId: plan.id,
                startDate, endDate, status: types_1.SubscriptionStatus.ACTIVE,
            }));
            this.logger.log(`Tenant créé : ${company.slug} | Plan : ${plan.name} | Password: ${isCustomPassword ? 'custom' : tempPassword}`);
            const full = await manager.findOne(company_entity_1.CompanyEntity, {
                where: { id: company.id },
                relations: ['settings', 'subscriptions', 'subscriptions.plan'],
            });
            if (!full)
                throw new Error(`Company ${company.id} not found after creation`);
            return { company: await this.toTenantSummary(full), tempPassword: isCustomPassword ? null : tempPassword };
        });
    }
    async findOne(companyId) {
        const company = await this.companyRepo.findOne({
            where: { id: companyId },
            relations: ['settings', 'subscriptions', 'subscriptions.plan'],
        });
        if (!company)
            throw new common_1.NotFoundException('Compagnie introuvable');
        return this.toTenantSummary(company);
    }
    async assignPlan(companyId, dto) {
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company)
            throw new common_1.NotFoundException('Compagnie introuvable');
        const plan = await this.planRepo.findOne({ where: { id: dto.planId, isActive: true } });
        if (!plan)
            throw new common_1.BadRequestException('Plan invalide ou inactif');
        await this.subRepo.update({ companyId, status: types_1.SubscriptionStatus.ACTIVE }, { status: types_1.SubscriptionStatus.EXPIRED });
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        const saved = await this.subRepo.save(this.subRepo.create({ companyId, planId: dto.planId, startDate, endDate, status: types_1.SubscriptionStatus.ACTIVE }));
        this.logger.log(`Plan changé : ${company.slug} → ${plan.name}`);
        return saved;
    }
    async toggleActive(companyId, isActive) {
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company)
            throw new common_1.NotFoundException('Compagnie introuvable');
        company.isActive = isActive;
        const saved = await this.companyRepo.save(company);
        this.logger.log(`Tenant ${isActive ? 'réactivé' : 'suspendu'} : ${company.slug}`);
        return saved;
    }
    async getSettings(companyId) {
        const settings = await this.settingsRepo.findOne({ where: { companyId } });
        if (!settings)
            throw new common_1.NotFoundException('Parametres introuvables');
        return settings;
    }
    async updateSettings(companyId, dto) {
        const settings = await this.settingsRepo.findOne({ where: { companyId } });
        if (!settings)
            throw new common_1.NotFoundException('Parametres introuvables');
        Object.assign(settings, dto);
        return this.settingsRepo.save(settings);
    }
    getActiveSub(subs) {
        return subs?.find((s) => s.status === types_1.SubscriptionStatus.ACTIVE);
    }
    async toTenantSummary(company) {
        const [buses, agencies, users] = await Promise.all([
            this.busRepo.count({ where: { companyId: company.id } }),
            this.agencyRepo.count({ where: { companyId: company.id } }),
            this.userRepo.count({ where: { companyId: company.id } }),
        ]);
        const activeSub = this.getActiveSub(company.subscriptions ?? []);
        return {
            id: company.id, name: company.name, slug: company.slug,
            city: company.city, phone: company.phone,
            isActive: company.isActive, createdAt: company.createdAt, updatedAt: company.updatedAt,
            settings: company.settings ?? null,
            activePlan: activeSub?.plan ?? null,
            subscription: activeSub ?? null,
            usage: {
                buses, agencies, users,
                maxBuses: activeSub?.plan?.maxBuses ?? 0,
                maxAgencies: activeSub?.plan?.maxAgencies ?? 0,
                maxUsers: activeSub?.plan?.maxUsers ?? 0,
            },
        };
    }
    generateTempPassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = CompaniesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.CompanyEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(company_settings_entity_1.CompanySettingsEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(subscription_entity_1.SubscriptionEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(subscription_plan_entity_1.SubscriptionPlanEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(agency_entity_1.AgencyEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(bus_entity_1.BusEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        auth_service_1.AuthService,
        typeorm_2.DataSource])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map