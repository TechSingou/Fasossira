export declare class CreateTripDto {
    routeId: string;
    departureTime: string;
    arrivalTime: string;
}
export declare class UpdateTripDto {
    departureTime?: string;
    arrivalTime?: string;
    isActive?: boolean;
}
