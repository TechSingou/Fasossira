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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../companies/entities/company.entity");
const company_settings_entity_1 = require("../companies/entities/company-settings.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const segment_price_entity_1 = require("../routes/entities/segment-price.entity");
const tickets_service_1 = require("../tickets/tickets.service");
const types_1 = require("../shared/types");
let PublicService = class PublicService {
    constructor(companyRepo, settingsRepo, scheduleRepo, reservationRepo, paymentRepo, segmentPriceRepo, ticketsService, dataSource) {
        this.companyRepo = companyRepo;
        this.settingsRepo = settingsRepo;
        this.scheduleRepo = scheduleRepo;
        this.reservationRepo = reservationRepo;
        this.paymentRepo = paymentRepo;
        this.segmentPriceRepo = segmentPriceRepo;
        this.ticketsService = ticketsService;
        this.dataSource = dataSource;
    }
    async search({ date, fromStop, toStop, companySlug }) {
        const companyQb = this.companyRepo
            .createQueryBuilder('c')
            .select(['c.id', 'c.name', 'c.slug', 'c.city'])
            .leftJoinAndSelect('c.settings', 'settings')
            .where('c.isActive = true');
        if (companySlug)
            companyQb.andWhere('c.slug = :slug', { slug: companySlug });
        const companies = await companyQb.getMany();
        if (!companies.length)
            return [];
        const companyIds = companies.map(c => c.id);
        const companyMap = new Map(companies.map(c => [c.id, c]));
        const schedules = await this.scheduleRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.trip', 'trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('route.stops', 'stops')
            .leftJoinAndSelect('s.bus', 'bus')
            .where('s.companyId IN (:...companyIds)', { companyIds })
            .andWhere('s.date = :date', { date })
            .andWhere('s.status NOT IN (:...excluded)', {
            excluded: [schedule_entity_1.ScheduleStatus.CANCELLED, schedule_entity_1.ScheduleStatus.COMPLETED],
        })
            .orderBy('s.departureDateTime', 'ASC')
            .addOrderBy('stops.order', 'ASC')
            .getMany();
        return Promise.all(schedules
            .filter(s => {
            if (!s.trip?.route?.stops?.length)
                return true;
            const names = s.trip.route.stops.map(st => st.cityName.toLowerCase());
            if (fromStop && !names.some(n => n.includes(fromStop.toLowerCase())))
                return false;
            if (toStop && !names.some(n => n.includes(toStop.toLowerCase())))
                return false;
            return true;
        })
            .map(async (s) => {
            const takenCount = await this.reservationRepo.count({
                where: { scheduleId: s.id, status: types_1.ReservationStatus.CONFIRMED },
            });
            const company = companyMap.get(s.companyId);
            return {
                scheduleId: s.id,
                date: s.date,
                departureDateTime: s.departureDateTime,
                arrivalDateTime: s.arrivalDateTime,
                status: s.status,
                totalSeats: s.totalSeats,
                availableSeats: Math.max(0, s.totalSeats - takenCount),
                company: {
                    id: company.id,
                    name: company.name,
                    slug: company.slug,
                    city: company.city,
                    primaryColor: company.settings?.primaryColor ?? '#0B3D91',
                    logoUrl: company.settings?.logoUrl ?? null,
                },
                trip: {
                    departureTime: s.trip.departureTime,
                    arrivalTime: s.trip.arrivalTime,
                    route: {
                        id: s.trip.route?.id ?? '',
                        name: s.trip.route?.name ?? '—',
                        stops: (s.trip.route?.stops ?? [])
                            .sort((a, b) => a.order - b.order)
                            .map(st => ({ id: st.id, order: st.order, cityName: st.cityName })),
                    },
                },
                bus: { plate: s.bus?.plate ?? '—', capacity: s.bus?.capacity ?? 0 },
            };
        }));
    }
    async getSeatMap(scheduleId, fromStopOrder, toStopOrder) {
        const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId } });
        if (!schedule)
            throw new common_1.NotFoundException('Schedule introuvable');
        if (fromStopOrder >= toStopOrder)
            throw new common_1.BadRequestException('fromStopOrder doit être inférieur à toStopOrder');
        const reservations = await this.reservationRepo.find({
            where: { scheduleId, status: types_1.ReservationStatus.CONFIRMED },
            select: ['seatNumber', 'fromStopOrder', 'toStopOrder'],
        });
        const seats = Array.from({ length: schedule.totalSeats }, (_, i) => {
            const seatNum = i + 1;
            const isTaken = reservations.some(r => r.seatNumber === seatNum &&
                r.fromStopOrder < toStopOrder &&
                r.toStopOrder > fromStopOrder);
            return { seatNumber: seatNum, status: isTaken ? 'taken' : 'free' };
        });
        return {
            scheduleId, totalSeats: schedule.totalSeats,
            fromStopOrder, toStopOrder, seats,
            availableCount: seats.filter(s => s.status === 'free').length,
        };
    }
    async createReservation(dto) {
        const schedule = await this.scheduleRepo.findOne({
            where: { id: dto.scheduleId },
            relations: ['trip', 'trip.route', 'trip.route.stops'],
        });
        if (!schedule)
            throw new common_1.NotFoundException('Schedule introuvable');
        const companyId = schedule.companyId;
        const segmentPrice = await this.segmentPriceRepo.findOne({
            where: {
                routeId: schedule.trip.route.id,
                fromStopOrder: dto.fromStopOrder,
                toStopOrder: dto.toStopOrder,
            },
        });
        if (!segmentPrice)
            throw new common_1.NotFoundException(`Aucun tarif pour ce segment (${dto.fromStopOrder}→${dto.toStopOrder})`);
        const stops = schedule.trip.route.stops;
        const fromStop = stops.find(s => s.order === dto.fromStopOrder);
        const toStop = stops.find(s => s.order === dto.toStopOrder);
        const seatNums = dto.passengers.map(p => p.seatNumber);
        if (new Set(seatNums).size !== seatNums.length)
            throw new common_1.BadRequestException('Deux passagers ne peuvent pas avoir le même siège');
        await Promise.all(seatNums.map(async (seat) => {
            const conflict = await this.reservationRepo.findOne({
                where: { scheduleId: dto.scheduleId, seatNumber: seat, status: types_1.ReservationStatus.CONFIRMED },
            });
            if (conflict)
                throw new common_1.BadRequestException(`Le siège ${seat} est déjà réservé`);
        }));
        const unitPrice = Number(segmentPrice.price);
        const currency = segmentPrice.currency;
        const reservations = await this.dataSource.transaction(async (manager) => {
            const created = [];
            for (const passenger of dto.passengers) {
                const reference = this.ticketsService.generateReference();
                const res = manager.create(reservation_entity_1.ReservationEntity, {
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
                    saleChannel: types_1.SaleChannel.ONLINE,
                    status: types_1.ReservationStatus.CONFIRMED,
                    soldByUserId: null,
                });
                const saved = await manager.save(reservation_entity_1.ReservationEntity, res);
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
        return {
            count: reservations.length,
            totalAmount: unitPrice * reservations.length,
            currency,
            fromCityName: fromStop?.cityName ?? '',
            toCityName: toStop?.cityName ?? '',
            reservations: reservations.map(r => ({
                reference: r.reference,
                passengerName: r.passengerName,
                passengerPhone: r.passengerPhone,
                seatNumber: r.seatNumber,
                amount: r.amount,
                currency: r.currency,
                status: r.status,
                createdAt: r.createdAt,
            })),
        };
    }
    async getTicket(reference, phone) {
        const reservation = await this.reservationRepo.findOne({
            where: { reference },
            relations: ['schedule', 'schedule.trip', 'schedule.trip.route', 'schedule.bus'],
        });
        if (!reservation)
            throw new common_1.NotFoundException(`Billet ${reference} introuvable`);
        if (reservation.passengerPhone.replace(/\s/g, '') !== phone.replace(/\s/g, ''))
            throw new common_1.NotFoundException(`Billet ${reference} introuvable`);
        const payment = await this.paymentRepo.findOne({
            where: { reservationId: reservation.id },
        });
        const settings = await this.settingsRepo.findOne({
            where: { companyId: reservation.companyId },
        });
        const company = await this.companyRepo.findOne({
            where: { id: reservation.companyId },
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
            status: reservation.status,
            createdAt: reservation.createdAt,
            company: {
                name: company?.name ?? 'Fasossira',
                primaryColor: settings?.primaryColor ?? '#0B3D91',
                logoUrl: settings?.logoUrl ?? null,
            },
        };
    }
};
exports.PublicService = PublicService;
exports.PublicService = PublicService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.CompanyEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(company_settings_entity_1.CompanySettingsEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(schedule_entity_1.ScheduleEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(reservation_entity_1.ReservationEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(payment_entity_1.PaymentEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(segment_price_entity_1.SegmentPriceEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        tickets_service_1.TicketsService,
        typeorm_2.DataSource])
], PublicService);
//# sourceMappingURL=public.service.js.map