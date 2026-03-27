import { Repository, DataSource } from 'typeorm';
import { CompanyEntity } from './entities/company.entity';
import { CompanySettingsEntity } from './entities/company-settings.entity';
import { SubscriptionEntity } from '../plans/entities/subscription.entity';
import { SubscriptionPlanEntity } from '../plans/entities/subscription-plan.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AgencyEntity } from '../agencies/entities/agency.entity';
import { BusEntity } from '../buses/entities/bus.entity';
import { UpdateCompanySettingsDto } from '../shared/types';
import { AuthService } from '../auth/auth.service';
import { CreateCompanyBodyDto, AssignPlanDto } from './dto/company.dto';
export interface UsageStats {
    buses: number;
    agencies: number;
    users: number;
    maxBuses: number;
    maxAgencies: number;
    maxUsers: number;
}
export interface TenantSummary {
    id: string;
    name: string;
    slug: string;
    city: string;
    phone: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    settings: CompanySettingsEntity | null;
    activePlan: SubscriptionPlanEntity | null;
    subscription: SubscriptionEntity | null;
    usage: UsageStats;
}
export interface GlobalStats {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    mrr: number;
    newThisMonth: number;
}
export declare class CompaniesService {
    private readonly companyRepo;
    private readonly settingsRepo;
    private readonly subRepo;
    private readonly planRepo;
    private readonly userRepo;
    private readonly agencyRepo;
    private readonly busRepo;
    private readonly authService;
    private readonly dataSource;
    private readonly logger;
    constructor(companyRepo: Repository<CompanyEntity>, settingsRepo: Repository<CompanySettingsEntity>, subRepo: Repository<SubscriptionEntity>, planRepo: Repository<SubscriptionPlanEntity>, userRepo: Repository<UserEntity>, agencyRepo: Repository<AgencyEntity>, busRepo: Repository<BusEntity>, authService: AuthService, dataSource: DataSource);
    findAll(): Promise<TenantSummary[]>;
    getGlobalStats(): Promise<GlobalStats>;
    create(dto: CreateCompanyBodyDto): Promise<{
        company: TenantSummary;
        tempPassword: string;
    }>;
    findOne(companyId: string): Promise<TenantSummary>;
    assignPlan(companyId: string, dto: AssignPlanDto): Promise<SubscriptionEntity>;
    toggleActive(companyId: string, isActive: boolean): Promise<CompanyEntity>;
    getSettings(companyId: string): Promise<CompanySettingsEntity>;
    updateSettings(companyId: string, dto: UpdateCompanySettingsDto): Promise<CompanySettingsEntity>;
    private getActiveSub;
    private toTenantSummary;
    private generateTempPassword;
}
