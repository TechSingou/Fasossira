export declare class CreateRouteDto {
    name: string;
    description?: string;
}
export declare class UpdateRouteDto {
    name?: string;
    description?: string;
    isActive?: boolean;
}
export declare class CreateRouteStopDto {
    cityName: string;
    order: number;
    distanceFromStart?: number;
}
export declare class UpdateStopsDto {
    stops: CreateRouteStopDto[];
}
export declare class UpsertSegmentPriceDto {
    fromStopOrder: number;
    toStopOrder: number;
    price: number;
}
export declare class BulkUpsertSegmentPricesDto {
    prices: UpsertSegmentPriceDto[];
}
