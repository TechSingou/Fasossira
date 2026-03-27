import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class TicketsService {
    constructor(
        @InjectRepository(ReservationEntity)
        private readonly reservationRepo: Repository<ReservationEntity>,
        @InjectRepository(PaymentEntity)
        private readonly paymentRepo: Repository<PaymentEntity>,
    ) { }

    /**
     * Génère une référence unique de billet.
     * Format : REF-YYYY-XXXXXXXX (8 chars alphanum majuscules)
     * Collision quasi-impossible en MVP (< 10k billets/jour par tenant).
     * En production, ajouter un retry si UNIQUE violation.
     */
    generateReference(): string {
        const year = new Date().getFullYear();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // pas O/0/1/I pour lisibilité
        const suffix = Array.from(
            { length: 8 },
            () => chars[Math.floor(Math.random() * chars.length)],
        ).join('');
        return `REF-${year}-${suffix}`;
    }

    /**
     * Retourne les données complètes d'un billet par référence.
     * Utilisé pour l'impression et le QR code.
     */
    async getTicket(companyId: string, reference: string): Promise<TicketDto> {
        const reservation = await this.reservationRepo.findOne({
            where: { reference, companyId },
            relations: [
                'schedule',
                'schedule.trip',
                'schedule.trip.route',
                'schedule.bus',
            ],
        });

        if (!reservation) {
            throw new NotFoundException(`Billet ${reference} introuvable`);
        }

        const payment = await this.paymentRepo.findOne({
            where: { reservationId: reservation.id },
        });

        return {
            reference: reservation.reference,
            passengerName: reservation.passengerName,
            passengerPhone: reservation.passengerPhone,
            seatNumber: reservation.seatNumber,
            fromCityName: reservation.fromCityName,
            toCityName: reservation.toCityName,
            departureDateTime: reservation.schedule?.departureDateTime,
            arrivalDateTime: reservation.schedule?.arrivalDateTime,
            busPlate: reservation.schedule?.bus?.plate ?? '—',
            amount: reservation.amount,
            currency: reservation.currency,
            paymentMethod: payment?.method ?? '—',
            saleChannel: reservation.saleChannel,
            status: reservation.status,
            createdAt: reservation.createdAt,
        };
    }
}
