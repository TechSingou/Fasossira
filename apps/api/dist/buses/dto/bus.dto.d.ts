import { BusType, BusStatus } from '../entities/bus.entity';
export declare class CreateBusDto {
    plate: string;
    brand: string;
    model: string;
    type: BusType;
    capacity: number;
}
export declare class UpdateBusDto {
    plate?: string;
    brand?: string;
    model?: string;
    type?: BusType;
    capacity?: number;
    status?: BusStatus;
}
