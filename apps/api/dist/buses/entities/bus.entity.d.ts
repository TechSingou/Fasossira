export declare enum BusType {
    COASTER = "COASTER",
    SPRINTER = "SPRINTER",
    GRAND_BUS = "GRAND_BUS"
}
export declare enum BusStatus {
    ACTIVE = "ACTIVE",
    MAINTENANCE = "MAINTENANCE",
    RETIRED = "RETIRED"
}
export declare class BusEntity {
    id: string;
    companyId: string;
    plate: string;
    brand: string;
    model: string;
    type: BusType;
    capacity: number;
    status: BusStatus;
    createdAt: Date;
    updatedAt: Date;
}
