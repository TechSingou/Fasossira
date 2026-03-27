import { ScheduleEntity } from '../../schedules/entities/schedule.entity';
import { ReservationStatus, SaleChannel } from '../../shared/types';
export declare class ReservationEntity {
    id: string;
    companyId: string;
    reference: string;
    scheduleId: string;
    schedule: ScheduleEntity;
    seatNumber: number;
    fromStopOrder: number;
    toStopOrder: number;
    fromCityName: string;
    toCityName: string;
    passengerName: string;
    passengerPhone: string;
    amount: number;
    currency: string;
    saleChannel: SaleChannel;
    status: ReservationStatus;
    soldByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
