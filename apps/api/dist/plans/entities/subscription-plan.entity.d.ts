import { SubscriptionEntity } from './subscription.entity';
export declare class SubscriptionPlanEntity {
    id: string;
    name: string;
    price: number;
    maxBuses: number;
    maxAgencies: number;
    maxUsers: number;
    features: string[];
    isActive: boolean;
    subscriptions: SubscriptionEntity[];
}
