import { DataSource } from 'typeorm';
export type ResourceType = 'buses' | 'agencies' | 'users';
export interface QuotaInfo {
    current: number;
    max: number;
    remaining: number;
    limitReached: boolean;
    planName: string;
}
export interface TenantQuotas {
    buses: QuotaInfo;
    agencies: QuotaInfo;
    users: QuotaInfo;
}
export declare class PlanLimitsService {
    private readonly dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    assertCanCreate(companyId: string, resource: ResourceType): Promise<void>;
    getTenantQuotas(companyId: string): Promise<TenantQuotas>;
    private getQuota;
    private getActivePlan;
    private countResource;
}
