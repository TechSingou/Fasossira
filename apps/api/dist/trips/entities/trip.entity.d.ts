import { RouteEntity } from '../../routes/entities/route.entity';
export declare class TripEntity {
    id: string;
    companyId: string;
    routeId: string;
    route: RouteEntity;
    departureTime: string;
    arrivalTime: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
