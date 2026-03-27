import { RouteEntity } from './route.entity';
export declare class SegmentPriceEntity {
    id: string;
    companyId: string;
    routeId: string;
    route: RouteEntity;
    fromStopOrder: number;
    toStopOrder: number;
    price: number;
    currency: string;
    updatedAt: Date;
}
