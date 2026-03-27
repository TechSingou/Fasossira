import { RouteStopEntity } from './route-stop.entity';
import { SegmentPriceEntity } from './segment-price.entity';
export declare class RouteEntity {
    id: string;
    companyId: string;
    name: string;
    description: string;
    isActive: boolean;
    stops: RouteStopEntity[];
    segmentPrices: SegmentPriceEntity[];
    createdAt: Date;
    updatedAt: Date;
}
