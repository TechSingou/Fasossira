import { RouteEntity } from './route.entity';
export declare class RouteStopEntity {
    id: string;
    companyId: string;
    routeId: string;
    route: RouteEntity;
    cityName: string;
    order: number;
    distanceFromStart: number;
}
