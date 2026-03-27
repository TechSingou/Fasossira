import { SaleChannel, PaymentMethod } from '../../shared/types';
export declare class PassengerDto {
    seatNumber: number;
    passengerName: string;
    passengerPhone: string;
}
export declare class CreateReservationDto {
    scheduleId: string;
    seatNumber: number;
    fromStopOrder: number;
    toStopOrder: number;
    passengerName: string;
    passengerPhone: string;
    saleChannel: SaleChannel;
    paymentMethod: PaymentMethod;
    externalRef?: string;
}
export declare class CreateBulkReservationsDto {
    scheduleId: string;
    fromStopOrder: number;
    toStopOrder: number;
    saleChannel: SaleChannel;
    paymentMethod: PaymentMethod;
    externalRef?: string;
    passengers: PassengerDto[];
}
export declare class CancelReservationDto {
    reason?: string;
}
