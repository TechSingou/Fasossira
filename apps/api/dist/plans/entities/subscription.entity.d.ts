import { SubscriptionStatus } from '../../shared/types';
import { CompanyEntity } from '../../companies/entities/company.entity';
import { SubscriptionPlanEntity } from './subscription-plan.entity';
export declare class SubscriptionEntity {
    id: string;
    companyId: string;
    company: CompanyEntity;
    planId: string;
    plan: SubscriptionPlanEntity;
    startDate: Date;
    endDate: Date;
    status: SubscriptionStatus;
    createdAt: Date;
}
