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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const bus_entity_1 = require("../buses/entities/bus.entity");
const route_entity_1 = require("../routes/entities/route.entity");
const types_1 = require("../shared/types");
const bus_entity_2 = require("../buses/entities/bus.entity");
const dashboard_controller_1 = require("./dashboard.controller");
let DashboardService = class DashboardService {
    constructor(reservationRepo, paymentRepo, scheduleRepo, busRepo, routeRepo) {
        this.reservationRepo = reservationRepo;
        this.paymentRepo = paymentRepo;
        this.scheduleRepo = scheduleRepo;
        this.busRepo = busRepo;
        this.routeRepo = routeRepo;
    }
    resolveDateRange(query) {
        const now = new Date();
        const startOfDay = (d) => {
            const r = new Date(d);
            r.setHours(0, 0, 0, 0);
            return r;
        };
        const endOfDay = (d) => {
            const r = new Date(d);
            r.setHours(23, 59, 59, 999);
            return r;
        };
        switch (query.period) {
            case dashboard_controller_1.PeriodPreset.TODAY:
                return { from: startOfDay(now), to: endOfDay(now) };
            case dashboard_controller_1.PeriodPreset.WEEK: {
                const day = now.getDay();
                const monday = new Date(now);
                monday.setDate(now.getDate() - ((day + 6) % 7));
                return { from: startOfDay(monday), to: endOfDay(now) };
            }
            case dashboard_controller_1.PeriodPreset.MONTH: {
                const first = new Date(now.getFullYear(), now.getMonth(), 1);
                return { from: startOfDay(first), to: endOfDay(now) };
            }
            case dashboard_controller_1.PeriodPreset.CUSTOM: {
                if (query.from && query.to) {
                    return {
                        from: startOfDay(new Date(query.from)),
                        to: endOfDay(new Date(query.to)),
                    };
                }
                return { from: startOfDay(now), to: endOfDay(now) };
            }
            default:
                return { from: startOfDay(now), to: endOfDay(now) };
        }
    }
    previousRange(range) {
        const duration = range.to.getTime() - range.from.getTime();
        return {
            from: new Date(range.from.getTime() - duration - 1),
            to: new Date(range.from.getTime() - 1),
        };
    }
    async computePeriodStats(companyId, range) {
        const reservations = await this.reservationRepo.find({
            where: {
                companyId,
                status: types_1.ReservationStatus.CONFIRMED,
                createdAt: (0, typeorm_2.Between)(range.from, range.to),
            },
        });
        const cancelled = await this.reservationRepo.count({
            where: {
                companyId,
                status: types_1.ReservationStatus.CANCELLED,
                createdAt: (0, typeorm_2.Between)(range.from, range.to),
            },
        });
        const tickets = reservations.length;
        const revenue = reservations.reduce((s, r) => s + Number(r.amount), 0);
        const avgTicketPrice = tickets > 0 ? Math.round(revenue / tickets) : 0;
        const schedules = await this.scheduleRepo.find({
            where: {
                companyId,
                departureDateTime: (0, typeorm_2.Between)(range.from, range.to),
            },
        });
        const totalSeats = schedules.reduce((s, sc) => s + sc.totalSeats, 0);
        const occupancyRate = totalSeats > 0
            ? Math.round((tickets / totalSeats) * 100)
            : 0;
        return {
            revenue,
            tickets,
            passengers: tickets,
            avgTicketPrice,
            cancelledTickets: cancelled,
            occupancyRate,
        };
    }
    async getStats(companyId, query) {
        const range = this.resolveDateRange(query);
        const prevRange = this.previousRange(range);
        const [current, previous, buses, activeRoutes, scheduledTrips, completedTrips, paymentRows, timelineRows, topRoutesRows,] = await Promise.all([
            this.computePeriodStats(companyId, range),
            this.computePeriodStats(companyId, prevRange),
            this.busRepo.find({ where: { companyId } }),
            this.routeRepo.count({ where: { companyId, isActive: true } }),
            this.scheduleRepo.count({
                where: {
                    companyId,
                    departureDateTime: (0, typeorm_2.Between)(range.from, range.to),
                },
            }),
            this.scheduleRepo
                .createQueryBuilder('s')
                .where('s."companyId" = :companyId', { companyId })
                .andWhere('s."departureDateTime" BETWEEN :from AND :to', {
                from: range.from, to: range.to,
            })
                .andWhere("s.status = 'COMPLETED'")
                .getCount(),
            this.paymentRepo
                .createQueryBuilder('p')
                .select('p.method', 'method')
                .addSelect('COUNT(*)', 'count')
                .addSelect('SUM(p.amount)', 'amount')
                .where('p."companyId" = :companyId', { companyId })
                .andWhere('p."paidAt" BETWEEN :from AND :to', { from: range.from, to: range.to })
                .andWhere('p.status = :status', { status: types_1.PaymentStatus.PAID })
                .groupBy('p.method')
                .getRawMany(),
            this.reservationRepo
                .createQueryBuilder('r')
                .select("TO_CHAR(r.\"createdAt\", 'YYYY-MM-DD')", 'date')
                .addSelect('SUM(r.amount)', 'revenue')
                .addSelect('COUNT(*)', 'tickets')
                .where('r."companyId" = :companyId', { companyId })
                .andWhere('r."createdAt" BETWEEN :from AND :to', { from: range.from, to: range.to })
                .andWhere("r.status = 'CONFIRMED'")
                .groupBy("TO_CHAR(r.\"createdAt\", 'YYYY-MM-DD')")
                .orderBy('date', 'ASC')
                .getRawMany(),
            this.reservationRepo
                .createQueryBuilder('r')
                .select("CONCAT(r.\"fromCityName\", ' → ', r.\"toCityName\")", 'name')
                .addSelect('COUNT(*)', 'tickets')
                .addSelect('SUM(r.amount)', 'revenue')
                .where('r."companyId" = :companyId', { companyId })
                .andWhere('r."createdAt" BETWEEN :from AND :to', { from: range.from, to: range.to })
                .andWhere("r.status = 'CONFIRMED'")
                .groupBy("CONCAT(r.\"fromCityName\", ' → ', r.\"toCityName\")")
                .orderBy('"revenue"', 'DESC')
                .limit(5)
                .getRawMany(),
        ]);
        const fmt = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        const periodLabel = {
            [dashboard_controller_1.PeriodPreset.TODAY]: "Aujourd'hui",
            [dashboard_controller_1.PeriodPreset.WEEK]: 'Cette semaine',
            [dashboard_controller_1.PeriodPreset.MONTH]: 'Ce mois',
            [dashboard_controller_1.PeriodPreset.CUSTOM]: `${fmt(range.from)} – ${fmt(range.to)}`,
        };
        return {
            period: {
                from: range.from.toISOString(),
                to: range.to.toISOString(),
                label: periodLabel[query.period ?? dashboard_controller_1.PeriodPreset.TODAY],
            },
            current,
            previous,
            fleet: {
                total: buses.length,
                active: buses.filter(b => b.status === bus_entity_2.BusStatus.ACTIVE).length,
                maintenance: buses.filter(b => b.status === bus_entity_2.BusStatus.MAINTENANCE).length,
            },
            network: {
                activeRoutes,
                scheduledTrips,
                completedTrips,
            },
            paymentBreakdown: paymentRows.map(r => ({
                method: r.method,
                count: Number(r.count),
                amount: Number(r.amount),
            })),
            revenueTimeline: timelineRows.map(r => ({
                date: r.date,
                revenue: Number(r.revenue),
                tickets: Number(r.tickets),
            })),
            topRoutes: topRoutesRows.map(r => ({
                name: r.name,
                tickets: Number(r.tickets),
                revenue: Number(r.revenue),
            })),
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.ReservationEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.PaymentEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(schedule_entity_1.ScheduleEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(bus_entity_1.BusEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(route_entity_1.RouteEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map