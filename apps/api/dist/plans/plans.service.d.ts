import { Repository } from 'typeorm';
import { SubscriptionPlanEntity } from './entities/subscription-plan.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
export interface PlanStats {
    mrr: number;
    totalActiveSubs: number;
    byPlan: Array<{
        planId: string;
        planName: string;
        price: number;
        count: number;
        revenue: number;
    }>;
}
export declare class PlansService {
    private readonly planRepo;
    private readonly subRepo;
    private readonly logger;
    constructor(planRepo: Repository<SubscriptionPlanEntity>, subRepo: Repository<SubscriptionEntity>);
    findAll(): Promise<SubscriptionPlanEntity[]>;
    findActive(): Promise<SubscriptionPlanEntity[]>;
    findOne(id: string): Promise<SubscriptionPlanEntity>;
    create(dto: CreatePlanDto): Promise<SubscriptionPlanEntity>;
    update(id: string, dto: UpdatePlanDto): Promise<SubscriptionPlanEntity>;
    toggleActive(id: string): Promise<SubscriptionPlanEntity>;
    getStats(): Promise<PlanStats>;
}
