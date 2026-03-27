import { Repository } from 'typeorm';
import { ReservationEntity } from '../reservations/entities/reservation.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
export interface TicketDto {
    reference: string;
    passengerName: string;
    passengerPhone: string;
    seatNumber: number;
    fromCityName: string;
    toCityName: string;
    departureDateTime: Date;
    arrivalDateTime: Date;
    busPlate: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    saleChannel: string;
    status: string;
    createdAt: Date;
}
export declare class TicketsService {
    private readonly reservationRepo;
    private readonly paymentRepo;
    constructor(reservationRepo: Repository<ReservationEntity>, paymentRepo: Repository<PaymentEntity>);
    generateReference(): string;
    getTicket(companyId: string, reference: string): Promise<TicketDto>;
}
