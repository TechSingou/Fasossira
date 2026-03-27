import { CompaniesService } from './companies.service';
import { CreateCompanyBodyDto, AssignPlanDto, UpdateCompanySettingsBodyDto } from './dto/company.dto';
import { PlanLimitsService } from '../common/services/plan-limits.service';
export declare class CompaniesController {
    private readonly companiesService;
    private readonly planLimits;
    constructor(companiesService: CompaniesService, planLimits: PlanLimitsService);
    findAll(): Promise<import("./companies.service").TenantSummary[]>;
    getGlobalStats(): Promise<import("./companies.service").GlobalStats>;
    getMyCompany(companyId: string): Promise<import("./companies.service").TenantSummary>;
    getMySettings(companyId: string): Promise<import("./entities/company-settings.entity").CompanySettingsEntity>;
    getMyQuotas(companyId: string): Promise<import("../common/services/plan-limits.service").TenantQuotas>;
    updateSettings(companyId: string, dto: UpdateCompanySettingsBodyDto): Promise<import("./entities/company-settings.entity").CompanySettingsEntity>;
    uploadLogo(companyId: string, file: any): Promise<import("./entities/company-settings.entity").CompanySettingsEntity>;
    deleteLogo(companyId: string): Promise<import("./entities/company-settings.entity").CompanySettingsEntity>;
    findOne(id: string): Promise<import("./companies.service").TenantSummary>;
    create(dto: CreateCompanyBodyDto): Promise<{
        company: import("./companies.service").TenantSummary;
        tempPassword: string;
    }>;
    suspend(id: string): Promise<import("./entities/company.entity").CompanyEntity>;
    activate(id: string): Promise<import("./entities/company.entity").CompanyEntity>;
    assignPlan(id: string, dto: AssignPlanDto): Promise<import("../plans/entities/subscription.entity").SubscriptionEntity>;
}
