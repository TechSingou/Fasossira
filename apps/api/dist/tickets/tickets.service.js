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
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
let TicketsService = class TicketsService {
    constructor(reservationRepo, paymentRepo) {
        this.reservationRepo = reservationRepo;
        this.paymentRepo = paymentRepo;
    }
    generateReference() {
        const year = new Date().getFullYear();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const suffix = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `REF-${year}-${suffix}`;
    }
    async getTicket(companyId, reference) {
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
            throw new common_1.NotFoundException(`Billet ${reference} introuvable`);
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
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.ReservationEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.PaymentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map