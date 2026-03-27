import { CompanySettingsEntity } from './company-settings.entity';
import { SubscriptionEntity } from '../../plans/entities/subscription.entity';
export declare class CompanyEntity {
    id: string;
    name: string;
    slug: string;
    city: string;
    phone: string;
    isActive: boolean;
    settings: CompanySettingsEntity;
    subscriptions: SubscriptionEntity[];
    createdAt: Date;
    updatedAt: Date;
}
