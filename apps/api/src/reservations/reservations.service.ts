import {
    Injectable, NotFoundException, ConflictException,
    BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ReservationEntity } from './entities/reservation.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { ScheduleEntity, ScheduleStatus } from '../schedules/entities/schedule.entity';
import { RouteStopEntity } from '../routes/entities/route-stop.entity';
import { SegmentPriceEntity } from '../routes/entities/segment-price.entity';
import {
    CreateReservationDto,
    CreateBulkReservationsDto,
    PassengerDto,
} from './dto/reservation.dto';
import {
    ReservationStatus, PaymentMethod, PaymentStatus,
    segmentsOverlap,
} from '../shared/types';
import { TicketsService } from '../tickets/tickets.service';

// ─── Types retournés ──────────────────────────────────────────

export interface SeatInfo {
    seatNumber: number;
    status: 'free' | 'taken';
}

export interface SeatMapResult {
    scheduleId: string;
    totalSeats: number;
    fromStopOrder: number;
    toStopOrder: number;
    seats: SeatInfo[];
    availableCount: number;
}

export interface BulkResult {
    created: number;
    totalAmount: number;
    currency: string;
    reservations: ReservationEntity[];
}

@Injectable()
export class ReservationsService {
    private readonly logger = new Logger(ReservationsService.name);

    constructor(
        @InjectRepository(ReservationEntity)
        private readonly reservationRepo: Repository<ReservationEntity>,
        @InjectRepository(ScheduleEntity)
        private readonly scheduleRepo: Repository<ScheduleEntity>,
        @InjectRepository(RouteStopEntity)
        private readonly stopRepo: Repository<RouteStopEntity>,
        @InjectRepository(SegmentPriceEntity)
        private readonly priceRepo: Repository<SegmentPriceEntity>,
        @InjectRepository(PaymentEntity)
        private readonly paymentRepo: Repository<PaymentEntity>,
        private readonly dataSource: DataSource,
        private readonly ticketsService: TicketsService,
    ) { }

    // ─── Seat Map ──────────────────────────────────────────────

    async getSeatMap(
        companyId: string,
        scheduleId: string,
        fromStopOrder: number,
        toStopOrder: number,
    ): Promise<SeatMapResult> {
        const schedule = await this.scheduleRepo.findOne({
            where: { id: scheduleId, companyId },
        });
        if (!schedule) throw new NotFoundException('Schedule introuvable');

        if (fromStopOrder >= toStopOrder) {
            throw new BadRequestException('fromStopOrder doit être inférieur à toStopOrder');
        }

        const reservations = await this.reservationRepo.find({
            where: { scheduleId, status: ReservationStatus.CONFIRMED },
            select: ['seatNumber', 'fromStopOrder', 'toStopOrder'],
        });

        const seats: SeatInfo[] = Array.from(
            { length: schedule.totalSeats },
            (_, i) => {
                const seatNum = i + 1;
                const isTaken = reservations.some(
                    (r) =>
                        r.seatNumber === seatNum &&
                        segmentsOverlap(
                            fromStopOrder, toStopOrder,
                            r.fromStopOrder, r.toStopOrder,
                        ),
                );
                return { seatNumber: seatNum, status: isTaken ? 'taken' : 'free' };
            },
        );

        return {
            scheduleId,
            totalSeats: schedule.totalSeats,
            fromStopOrder,
            toStopOrder,
            seats,
            availableCount: seats.filter((s) => s.status === 'free').length,
        };
    }

    // ─── Disponibilités ────────────────────────────────────────

    async getAvailableSeatsMap(
        companyId: string,
        scheduleIds: string[],
    ): Promise<Record<string, number>> {
        if (!scheduleIds.length) return {};

        const reservations = await this.reservationRepo
            .createQueryBuilder('r')
            .select(['r.scheduleId', 'r.seatNumber'])
            .where('r.companyId = :companyId', { companyId })
            .andWhere('r.scheduleId IN (:...scheduleIds)', { scheduleIds })
            .andWhere('r.status = :status', { status: ReservationStatus.CONFIRMED })
            .getMany();

        const schedules = await this.scheduleRepo
            .createQueryBuilder('s')
            .where('s.id IN (:...scheduleIds)', { scheduleIds })
            .getMany();

        const result: Record<string, number> = {};
        for (const schedule of schedules) {
            const takenSeats = new Set(
                reservations
                    .filter((r) => r.scheduleId === schedule.id)
                    .map((r) => r.seatNumber),
            );
            result[schedule.id] = schedule.totalSeats - takenSeats.size;
        }
        return result;
    }

    // ─── Pré-validation partagée ───────────────────────────────
    //
    // Factorisée pour éviter la duplication entre create() et createBulk().
    // Retourne le contexte validé : schedule, stops, segmentPrice, stops nommés.

    private async validateSaleContext(
        companyId: string,
        scheduleId: string,
        fromStopOrder: number,
        toStopOrder: number,
        paymentMethod: PaymentMethod,
        externalRef?: string,
    ) {
        // 1. Schedule
        const schedule = await this.scheduleRepo.findOne({
            where: { id: scheduleId, companyId },
            relations: ['trip', 'trip.route'],
        });
        if (!schedule) throw new NotFoundException('Schedule introuvable');
        if (schedule.status === ScheduleStatus.CANCELLED)
            throw new BadRequestException('Ce voyage est annulé');
        if (schedule.status === ScheduleStatus.COMPLETED)
            throw new BadRequestException('Ce voyage est terminé');

        // 2. Segment
        if (fromStopOrder >= toStopOrder)
            throw new BadRequestException('fromStopOrder doit être < toStopOrder');

        // 3. Route
        const routeId = schedule.trip?.route?.id;
        if (!routeId) throw new BadRequestException('Route introuvable pour ce schedule');

        // 4. Stops
        const stops = await this.stopRepo.find({ where: { routeId, companyId } });
        const orders = stops.map((s) => s.order);
        if (!orders.includes(fromStopOrder) || !orders.includes(toStopOrder))
            throw new BadRequestException('Les arrêts demandés n\'existent pas sur cette route');

        // 5. Prix
        const segmentPrice = await this.priceRepo.findOne({
            where: { routeId, companyId, fromStopOrder, toStopOrder },
        });
        if (!segmentPrice)
            throw new BadRequestException(
                `Aucun prix défini pour ce segment (stops ${fromStopOrder}→${toStopOrder})`,
            );

        // 6. Mobile Money ref
        if (paymentMethod !== PaymentMethod.CASH && !externalRef)
            throw new BadRequestException(
                'La référence de transaction est obligatoire pour les paiements Mobile Money',
            );

        const fromStop = stops.find((s) => s.order === fromStopOrder);
        const toStop = stops.find((s) => s.order === toStopOrder);

        return { schedule, stops, segmentPrice, fromStop, toStop };
    }

    // ─── Vérifier la disponibilité d'un siège ─────────────────

    private async checkSeatAvailability(
        scheduleId: string,
        seatNumber: number,
        fromStopOrder: number,
        toStopOrder: number,
    ): Promise<void> {
        const conflict = await this.reservationRepo
            .createQueryBuilder('r')
            .where('r.scheduleId = :scheduleId', { scheduleId })
            .andWhere('r.seatNumber = :seatNumber', { seatNumber })
            .andWhere('r.status = :status', { status: ReservationStatus.CONFIRMED })
            .andWhere('r.fromStopOrder < :toStopOrder', { toStopOrder })
            .andWhere('r.toStopOrder > :fromStopOrder', { fromStopOrder })
            .getOne();

        if (conflict) {
            throw new ConflictException(
                `Le siège #${seatNumber} est déjà occupé sur ce segment`,
            );
        }
    }

    // ─── Créer une réservation simple ─────────────────────────

    async create(companyId: string, dto: CreateReservationDto, soldByUserId: string) {
        const { schedule, segmentPrice, fromStop, toStop } =
            await this.validateSaleContext(
                companyId, dto.scheduleId,
                dto.fromStopOrder, dto.toStopOrder,
                dto.paymentMethod, dto.externalRef,
            );

        await this.checkSeatAvailability(
            dto.scheduleId, dto.seatNumber,
            dto.fromStopOrder, dto.toStopOrder,
        );

        const result = await this.dataSource.transaction(async (manager) => {
            const reference = this.ticketsService.generateReference();

            const reservation = manager.create(ReservationEntity, {
                companyId,
                reference,
                scheduleId: dto.scheduleId,
                seatNumber: dto.seatNumber,
                fromStopOrder: dto.fromStopOrder,
                toStopOrder: dto.toStopOrder,
                fromCityName: fromStop?.cityName ?? '',
                toCityName: toStop?.cityName ?? '',
                passengerName: dto.passengerName,
                passengerPhone: dto.passengerPhone,
                amount: Number(segmentPrice.price),
                currency: segmentPrice.currency,
                saleChannel: dto.saleChannel,
                status: ReservationStatus.CONFIRMED,
                soldByUserId,
            });
            const saved = await manager.save(ReservationEntity, reservation);

            await manager.save(PaymentEntity, manager.create(PaymentEntity, {
                companyId,
                reservationId: saved.id,
                amount: Number(segmentPrice.price),
                currency: segmentPrice.currency,
                method: dto.paymentMethod,
                status: PaymentStatus.PAID,
                externalRef: dto.externalRef ?? null,
            }));

            return saved;
        });

        this.logger.log(`Réservation : ${result.reference} — siège #${dto.seatNumber}`);
        return this.findOne(companyId, result.id);
    }

    // ─── Créer des réservations groupées (bulk) ────────────────
    //
    // Atomique : toute la transaction est rollbackée si un seul siège
    // est déjà pris ou si la validation échoue. Retourne la liste des
    // billets créés avec le total à encaisser.

    async createBulk(
        companyId: string,
        dto: CreateBulkReservationsDto,
        soldByUserId: string,
    ): Promise<BulkResult> {
        const { segmentPrice, fromStop, toStop } =
            await this.validateSaleContext(
                companyId, dto.scheduleId,
                dto.fromStopOrder, dto.toStopOrder,
                dto.paymentMethod, dto.externalRef,
            );

        // Vérifier les doublons de sièges dans la requête elle-même
        const seatNumbers = dto.passengers.map((p) => p.seatNumber);
        const uniqueSeats = new Set(seatNumbers);
        if (uniqueSeats.size !== seatNumbers.length) {
            throw new BadRequestException(
                'Deux passagers ne peuvent pas avoir le même siège dans la même réservation groupée',
            );
        }

        // Vérifier la disponibilité de TOUS les sièges AVANT la transaction
        // (évite un rollback partiel coûteux)
        await Promise.all(
            dto.passengers.map((p) =>
                this.checkSeatAvailability(
                    dto.scheduleId, p.seatNumber,
                    dto.fromStopOrder, dto.toStopOrder,
                ),
            ),
        );

        const unitPrice = Number(segmentPrice.price);
        const currency = segmentPrice.currency;

        // Transaction atomique : créer N réservations + N paiements
        const reservations = await this.dataSource.transaction(async (manager) => {
            const created: ReservationEntity[] = [];

            for (const passenger of dto.passengers) {
                const reference = this.ticketsService.generateReference();

                const reservation = manager.create(ReservationEntity, {
                    companyId,
                    reference,
                    scheduleId: dto.scheduleId,
                    seatNumber: passenger.seatNumber,
                    fromStopOrder: dto.fromStopOrder,
                    toStopOrder: dto.toStopOrder,
                    fromCityName: fromStop?.cityName ?? '',
                    toCityName: toStop?.cityName ?? '',
                    passengerName: passenger.passengerName,
                    passengerPhone: passenger.passengerPhone,
                    amount: unitPrice,
                    currency,
                    saleChannel: dto.saleChannel,
                    status: ReservationStatus.CONFIRMED,
                    soldByUserId,
                });
                const saved = await manager.save(ReservationEntity, reservation);
                created.push(saved);

                await manager.save(PaymentEntity, manager.create(PaymentEntity, {
                    companyId,
                    reservationId: saved.id,
                    amount: unitPrice,
                    currency,
                    method: dto.paymentMethod,
                    status: PaymentStatus.PAID,
                    externalRef: dto.externalRef ?? null,
                }));
            }

            return created;
        });

        this.logger.log(
            `Réservation groupée : ${reservations.length} billets — ` +
            `sièges [${seatNumbers.join(', ')}] — schedule ${dto.scheduleId}`,
        );

        return {
            created: reservations.length,
            totalAmount: unitPrice * reservations.length,
            currency,
            reservations,
        };
    }

    // ─── Lister ────────────────────────────────────────────────

    async findAll(
        companyId: string,
        filters: {
            scheduleId?: string;
            date?: string;
            status?: ReservationStatus;
            search?: string;
        } = {},
    ) {
        const qb = this.reservationRepo
            .createQueryBuilder('r')
            .leftJoinAndSelect('r.schedule', 'schedule')
            .leftJoinAndSelect('schedule.trip', 'trip')
            .leftJoinAndSelect('trip.route', 'route')
            .where('r.companyId = :companyId', { companyId })
            .orderBy('r.createdAt', 'DESC');

        if (filters.scheduleId)
            qb.andWhere('r.scheduleId = :scheduleId', { scheduleId: filters.scheduleId });
        if (filters.date)
            qb.andWhere('schedule.date = :date', { date: filters.date });
        if (filters.status)
            qb.andWhere('r.status = :status', { status: filters.status });
        if (filters.search)
            qb.andWhere(
                '(r.reference ILIKE :search OR r.passengerName ILIKE :search)',
                { search: `%${filters.search}%` },
            );

        return qb.getMany();
    }

    // ─── Détail ────────────────────────────────────────────────

    async findOne(companyId: string, id: string) {
        const reservation = await this.reservationRepo.findOne({
            where: { id, companyId },
            relations: ['schedule', 'schedule.trip', 'schedule.trip.route', 'schedule.bus'],
        });
        if (!reservation) throw new NotFoundException('Réservation introuvable');
        return reservation;
    }

    async findByReference(companyId: string, reference: string) {
        const reservation = await this.reservationRepo.findOne({
            where: { reference, companyId },
            relations: ['schedule', 'schedule.trip', 'schedule.trip.route', 'schedule.bus'],
        });
        if (!reservation) throw new NotFoundException(`Réservation ${reference} introuvable`);
        return reservation;
    }

    // ─── Annuler ───────────────────────────────────────────────

    async cancel(companyId: string, id: string) {
        const reservation = await this.findOne(companyId, id);
        if (reservation.status === ReservationStatus.CANCELLED)
            throw new BadRequestException('Cette réservation est déjà annulée');

        await this.reservationRepo.update(
            { id, companyId },
            { status: ReservationStatus.CANCELLED },
        );

        this.logger.log(`Réservation annulée : ${reservation.reference}`);
        return { message: 'Réservation annulée', reference: reservation.reference };
    }
}
