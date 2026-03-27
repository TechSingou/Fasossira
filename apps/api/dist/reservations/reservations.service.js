"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReservationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("./entities/reservation.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const route_stop_entity_1 = require("../routes/entities/route-stop.entity");
const segment_price_entity_1 = require("../routes/entities/segment-price.entity");
const types_1 = require("../shared/types");
const tickets_service_1 = require("../tickets/tickets.service");
let ReservationsService = ReservationsService_1 = class ReservationsService {
    constructor(reservationRepo, scheduleRepo, stopRepo, priceRepo, paymentRepo, dataSource, ticketsService) {
        this.reservationRepo = reservationRepo;
        this.scheduleRepo = scheduleRepo;
        this.stopRepo = stopRepo;
        this.priceRepo = priceRepo;
        this.paymentRepo = paymentRepo;
        this.dataSource = dataSource;
        this.ticketsService = ticketsService;
        this.logger = new common_1.Logger(ReservationsService_1.name);
    }
    async getSeatMap(companyId, scheduleId, fromStopOrder, toStopOrder) {
        const schedule = await this.scheduleRepo.findOne({
            where: { id: scheduleId, companyId },
        });
        if (!schedule)
            throw new common_1.NotFoundException('Schedule introuvable');
        if (fromStopOrder >= toStopOrder) {
            throw new common_1.BadRequestException('fromStopOrder doit être inférieur à toStopOrder');
        }
        const reservations = await this.reservationRepo.find({
            where: { scheduleId, status: types_1.ReservationStatus.CONFIRMED },
            select: ['seatNumber', 'fromStopOrder', 'toStopOrder'],
        });
        const seats = Array.from({ length: schedule.totalSeats }, (_, i) => {
            const seatNum = i + 1;
            const isTaken = reservations.some((r) => r.seatNumber === seatNum &&
                (0, types_1.segmentsOverlap)(fromStopOrder, toStopOrder, r.fromStopOrder, r.toStopOrder));
            return { seatNumber: seatNum, status: isTaken ? 'taken' : 'free' };
        });
        return {
            scheduleId,
            totalSeats: schedule.totalSeats,
            fromStopOrder,
            toStopOrder,
            seats,
            availableCount: seats.filter((s) => s.status === 'free').length,
        };
    }
    async getAvailableSeatsMap(companyId, scheduleIds) {
        if (!scheduleIds.length)
            return {};
        const reservations = await this.reservationRepo
            .createQueryBuilder('r')
            .select(['r.scheduleId', 'r.seatNumber'])
            .where('r.companyId = :companyId', { companyId })
            .andWhere('r.scheduleId IN (:...scheduleIds)', { scheduleIds })
            .andWhere('r.status = :status', { status: types_1.ReservationStatus.CONFIRMED })
            .getMany();
        const schedules = await this.scheduleRepo
            .createQueryBuilder('s')
            .where('s.id IN (:...scheduleIds)', { scheduleIds })
            .getMany();
        const result = {};
        for (const schedule of schedules) {
            const takenSeats = new Set(reservations
                .filter((r) => r.scheduleId === schedule.id)
                .map((r) => r.seatNumber));
            result[schedule.id] = schedule.totalSeats - takenSeats.size;
        }
        return result;
    }
    async validateSaleContext(companyId, scheduleId, fromStopOrder, toStopOrder, paymentMethod, externalRef) {
        const schedule = await this.scheduleRepo.findOne({
            where: { id: scheduleId, companyId },
            relations: ['trip', 'trip.route'],
        });
        if (!schedule)
            throw new common_1.NotFoundException('Schedule introuvable');
        if (schedule.status === schedule_entity_1.ScheduleStatus.CANCELLED)
            throw new common_1.BadRequestException('Ce voyage est annulé');
        if (schedule.status === schedule_entity_1.ScheduleStatus.COMPLETED)
            throw new common_1.BadRequestException('Ce voyage est terminé');
        if (fromStopOrder >= toStopOrder)
            throw new common_1.BadRequestException('fromStopOrder doit être < toStopOrder');
        const routeId = schedule.trip?.route?.id;
        if (!routeId)
            throw new common_1.BadRequestException('Route introuvable pour ce schedule');
        const stops = await this.stopRepo.find({ where: { routeId, companyId } });
        const orders = stops.map((s) => s.order);
        if (!orders.includes(fromStopOrder) || !orders.includes(toStopOrder))
            throw new common_1.BadRequestException('Les arrêts demandés n\'existent pas sur cette route');
        const segmentPrice = await this.priceRepo.findOne({
            where: { routeId, companyId, fromStopOrder, toStopOrder },
        });
        if (!segmentPrice)
            throw new common_1.BadRequestException(`Aucun prix défini pour ce segment (stops ${fromStopOrder}→${toStopOrder})`);
        if (paymentMethod !== types_1.PaymentMethod.CASH && !externalRef)
            throw new common_1.BadRequestException('La référence de transaction est obligatoire pour les paiements Mobile Money');
        const fromStop = stops.find((s) => s.order === fromStopOrder);
        const toStop = stops.find((s) => s.order === toStopOrder);
        return { schedule, stops, segmentPrice, fromStop, toStop };
    }
    async checkSeatAvailability(scheduleId, seatNumber, fromStopOrder, toStopOrder) {
        const conflict = await this.reservationRepo
            .createQueryBuilder('r')
            .where('r.scheduleId = :scheduleId', { scheduleId })
            .andWhere('r.seatNumber = :seatNumber', { seatNumber })
            .andWhere('r.status = :status', { status: types_1.ReservationStatus.CONFIRMED })
            .andWhere('r.fromStopOrder < :toStopOrder', { toStopOrder })
            .andWhere('r.toStopOrder > :fromStopOrder', { fromStopOrder })
            .getOne();
        if (conflict) {
            throw new common_1.ConflictException(`Le siège #${seatNumber} est déjà occupé sur ce segment`);
        }
    }
    async create(companyId, dto, soldByUserId) {
        const { schedule, segmentPrice, fromStop, toStop } = await this.validateSaleContext(companyId, dto.scheduleId, dto.fromStopOrder, dto.toStopOrder, dto.paymentMethod, dto.externalRef);
        await this.checkSeatAvailability(dto.scheduleId, dto.seatNumber, dto.fromStopOrder, dto.toStopOrder);
        const result = await this.dataSource.transaction(async (manager) => {
            const reference = this.ticketsService.generateReference();
            const reservation = manager.create(reservation_entity_1.ReservationEntity, {
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
                status: types_1.ReservationStatus.CONFIRMED,
                soldByUserId,
            });
            const saved = await manager.save(reservation_entity_1.ReservationEntity, reservation);
            await manager.save(payment_entity_1.PaymentEntity, manager.create(payment_entity_1.PaymentEntity, {
                companyId,
                reservationId: saved.id,
                amount: Number(segmentPrice.price),
                currency: segmentPrice.currency,
                method: dto.paymentMethod,
                status: types_1.PaymentStatus.PAID,
                externalRef: dto.externalRef ?? null,
            }));
            return saved;
        });
        this.logger.log(`Réservation : ${result.reference} — siège #${dto.seatNumber}`);
        return this.findOne(companyId, result.id);
    }
    async createBulk(companyId, dto, soldByUserId) {
        const { segmentPrice, fromStop, toStop } = await this.validateSaleContext(companyId, dto.scheduleId, dto.fromStopOrder, dto.toStopOrder, dto.paymentMethod, dto.externalRef);
        const seatNumbers = dto.passengers.map((p) => p.seatNumber);
        const uniqueSeats = new Set(seatNumbers);
        if (uniqueSeats.size !== seatNumbers.length) {
            throw new common_1.BadRequestException('Deux passagers ne peuvent pas avoir le même siège dans la même réservation groupée');
        }
        await Promise.all(dto.passengers.map((p) => this.checkSeatAvailability(dto.scheduleId, p.seatNumber, dto.fromStopOrder, dto.toStopOrder)));
        const unitPrice = Number(segmentPrice.price);
        const currency = segmentPrice.currency;
        const reservations = await this.dataSource.transaction(async (manager) => {
            const created = [];
            for (const passenger of dto.passengers) {
                const reference = this.ticketsService.generateReference();
                const reservation = manager.create(reservation_entity_1.ReservationEntity, {
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
                    status: types_1.ReservationStatus.CONFIRMED,
                    soldByUserId,
                });
                const saved = await manager.save(reservation_entity_1.ReservationEntity, reservation);
                created.push(saved);
                await manager.save(payment_entity_1.PaymentEntity, manager.create(payment_entity_1.PaymentEntity, {
                    companyId,
                    reservationId: saved.id,
                    amount: unitPrice,
                    currency,
                    method: dto.paymentMethod,
                    status: types_1.PaymentStatus.PAID,
                    externalRef: dto.externalRef ?? null,
                }));
            }
            return created;
        });
        this.logger.log(`Réservation groupée : ${reservations.length} billets — ` +
            `sièges [${seatNumbers.join(', ')}] — schedule ${dto.scheduleId}`);
        return {
            created: reservations.length,
            totalAmount: unitPrice * reservations.length,
            currency,
            reservations,
        };
    }
    async findAll(companyId, filters = {}) {
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
            qb.andWhere('(r.reference ILIKE :search OR r.passengerName ILIKE :search)', { search: `%${filters.search}%` });
        return qb.getMany();
    }
    async findOne(companyId, id) {
        const reservation = await this.reservationRepo.findOne({
            where: { id, companyId },
            relations: ['schedule', 'schedule.trip', 'schedule.trip.route', 'schedule.bus'],
        });
        if (!reservation)
            throw new common_1.NotFoundException('Réservation introuvable');
        return reservation;
    }
    async findByReference(companyId, reference) {
        const reservation = await this.reservationRepo.findOne({
            where: { reference, companyId },
            relations: ['schedule', 'schedule.trip', 'schedule.trip.route', 'schedule.bus'],
        });
        if (!reservation)
            throw new common_1.NotFoundException(`Réservation ${reference} introuvable`);
        return reservation;
    }
    async cancel(companyId, id) {
        const reservation = await this.findOne(companyId, id);
        if (reservation.status === types_1.ReservationStatus.CANCELLED)
            throw new common_1.BadRequestException('Cette réservation est déjà annulée');
        await this.reservationRepo.update({ id, companyId }, { status: types_1.ReservationStatus.CANCELLED });
        this.logger.log(`Réservation annulée : ${reservation.reference}`);
        return { message: 'Réservation annulée', reference: reservation.reference };
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = ReservationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.ReservationEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_entity_1.ScheduleEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(route_stop_entity_1.RouteStopEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(segment_price_entity_1.SegmentPriceEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(payment_entity_1.PaymentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        tickets_service_1.TicketsService])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map