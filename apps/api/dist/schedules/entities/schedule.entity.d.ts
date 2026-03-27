import { TripEntity } from '../../trips/entities/trip.entity';
import { BusEntity } from '../../buses/entities/bus.entity';
export declare enum ScheduleStatus {
    SCHEDULED = "SCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare class ScheduleEntity {
    id: string;
    companyId: string;
    tripId: string;
    trip: TripEntity;
    busId: string;
    bus: BusEntity;
    date: string;
    departureDateTime: Date;
    arrivalDateTime: Date;
    status: ScheduleStatus;
    totalSeats: number;
    createdAt: Date;
    updatedAt: Date;
}
