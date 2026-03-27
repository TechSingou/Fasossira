import { PaymentMethod } from '../../shared/types';
export declare class PublicPassengerDto {
    seatNumber: number;
    passengerName: string;
    passengerPhone: string;
}
export declare class PublicReservationDto {
    scheduleId: string;
    fromStopOrder: number;
    toStopOrder: number;
    paymentMethod: PaymentMethod;
    externalRef?: string;
    passengers: PublicPassengerDto[];
}
