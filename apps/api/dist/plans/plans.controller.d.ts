import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findAll(): Promise<import("./entities/subscription-plan.entity").SubscriptionPlanEntity[]>;
    findActive(): Promise<import("./entities/subscription-plan.entity").SubscriptionPlanEntity[]>;
    getStats(): Promise<import("./plans.service").PlanStats>;
    findOne(id: string): Promise<import("./entities/subscription-plan.entity").SubscriptionPlanEntity>;
    create(dto: CreatePlanDto): Promise<import("./entities/subscription-plan.entity").SubscriptionPlanEntity>;
    update(id: string, dto: UpdatePlanDto): Promise<import("./entities/subscription-plan.entity").SubscriptionPlanEntity>;
    toggleActive(id: string): Promise<import("./entities/subscription-plan.entity").SubscriptionPlanEntity>;
}
