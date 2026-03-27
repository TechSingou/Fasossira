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
var SchedulesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_entity_1 = require("./entities/schedule.entity");
const trips_service_1 = require("../trips/trips.service");
const buses_service_1 = require("../buses/buses.service");
let SchedulesService = SchedulesService_1 = class SchedulesService {
    constructor(scheduleRepo, tripsService, busesService) {
        this.scheduleRepo = scheduleRepo;
        this.tripsService = tripsService;
        this.busesService = busesService;
        this.logger = new common_1.Logger(SchedulesService_1.name);
    }
    async findAll(companyId, filters = {}) {
        const qb = this.scheduleRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.trip', 'trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('s.bus', 'bus')
            .where('s.companyId = :companyId', { companyId })
            .orderBy('s.departureDateTime', 'ASC');
        if (filters.date)
            qb.andWhere('s.date = :date', { date: filters.date });
        if (filters.busId)
            qb.andWhere('s.busId = :busId', { busId: filters.busId });
        if (filters.status)
            qb.andWhere('s.status = :status', { status: filters.status });
        if (filters.routeId)
            qb.andWhere('trip.routeId = :routeId', { routeId: filters.routeId });
        return qb.getMany();
    }
    async findForSale(companyId, date, fromStop, toStop) {
        const qb = this.scheduleRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.trip', 'trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('route.stops', 'stops')
            .leftJoinAndSelect('s.bus', 'bus')
            .where('s.companyId = :companyId', { companyId })
            .andWhere('s.date = :date', { date })
            .andWhere('s.status NOT IN (:...excluded)', {
            excluded: [schedule_entity_1.ScheduleStatus.CANCELLED, schedule_entity_1.ScheduleStatus.COMPLETED],
        })
            .orderBy('s.departureDateTime', 'ASC')
            .addOrderBy('stops.order', 'ASC');
        const schedules = await qb.getMany();
        return schedules
            .filter((s) => {
            if (!s.trip?.route?.stops?.length)
                return true;
            const stopNames = s.trip.route.stops.map((st) => st.cityName.toLowerCase());
            if (fromStop && !stopNames.some((n) => n.includes(fromStop.toLowerCase())))
                return false;
            if (toStop && !stopNames.some((n) => n.includes(toStop.toLowerCase())))
                return false;
            return true;
        })
            .map((s) => ({
            id: s.id,
            date: s.date,
            departureDateTime: s.departureDateTime,
            arrivalDateTime: s.arrivalDateTime,
            status: s.status,
            totalSeats: s.totalSeats,
            availableSeats: s.totalSeats,
            trip: {
                departureTime: s.trip.departureTime,
                arrivalTime: s.trip.arrivalTime,
                route: {
                    id: s.trip.route?.id ?? '',
                    name: s.trip.route?.name ?? '—',
                    stops: (s.trip.route?.stops ?? [])
                        .sort((a, b) => a.order - b.order)
                        .map((st) => ({
                        id: st.id,
                        order: st.order,
                        cityName: st.cityName,
                    })),
                },
            },
            bus: {
                plate: s.bus?.plate ?? '—',
                capacity: s.bus?.capacity ?? 0,
            },
        }));
    }
    async getPlanning(companyId, date) {
        const schedules = await this.findAll(companyId, { date });
        return schedules.map((s) => ({
            id: s.id,
            date: s.date,
            departureTime: s.trip.departureTime,
            arrivalTime: s.trip.arrivalTime,
            departureDateTime: s.departureDateTime,
            arrivalDateTime: s.arrivalDateTime,
            route: s.trip.route ? s.trip.route.name : 'Route inconnue',
            tripId: s.tripId,
            bus: {
                id: s.bus.id,
                plate: s.bus.plate,
                capacity: s.bus.capacity,
            },
            totalSeats: s.totalSeats,
            availableSeats: s.totalSeats,
            status: s.status,
        }));
    }
    async findOne(companyId, id) {
        const schedule = await this.scheduleRepo.findOne({
            where: { id, companyId },
            relations: ['trip', 'trip.route', 'bus'],
        });
        if (!schedule)
            throw new common_1.NotFoundException('Schedule introuvable');
        return schedule;
    }
    async create(companyId, dto) {
        const trip = await this.tripsService.findOne(companyId, dto.tripId);
        const bus = await this.busesService.findOne(companyId, dto.busId);
        const { departureDateTime, arrivalDateTime } = this.buildDateTimes(dto.date, trip.departureTime, trip.arrivalTime);
        await this.checkBusConflict(bus.id, departureDateTime, arrivalDateTime, companyId);
        const schedule = this.scheduleRepo.create({
            companyId,
            tripId: trip.id,
            busId: bus.id,
            date: dto.date,
            departureDateTime,
            arrivalDateTime,
            totalSeats: bus.capacity,
            status: schedule_entity_1.ScheduleStatus.SCHEDULED,
        });
        const saved = await this.scheduleRepo.save(schedule);
        this.logger.log(`Schedule créé : ${trip.departureTime} le ${dto.date} — bus ${bus.plate}`);
        return this.findOne(companyId, saved.id);
    }
    async generate(companyId, dto) {
        const trip = await this.tripsService.findOne(companyId, dto.tripId);
        const bus = await this.busesService.findOne(companyId, dto.busId);
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        if (end <= start) {
            throw new common_1.BadRequestException('endDate doit être postérieure à startDate');
        }
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 365) {
            throw new common_1.BadRequestException('La période ne peut pas dépasser 365 jours');
        }
        const candidates = [];
        const cursor = new Date(start);
        while (cursor <= end) {
            const isoDay = cursor.getDay() === 0 ? 7 : cursor.getDay();
            const dateStr = cursor.toISOString().split('T')[0];
            if (dto.weekDays.includes(isoDay)) {
                const { departureDateTime, arrivalDateTime } = this.buildDateTimes(dateStr, trip.departureTime, trip.arrivalTime);
                candidates.push({ dateStr, departureDateTime, arrivalDateTime });
            }
            cursor.setDate(cursor.getDate() + 1);
        }
        if (candidates.length === 0) {
            return { created: 0, skipped: [], schedules: [] };
        }
        const endDateExtended = new Date(end);
        endDateExtended.setDate(endDateExtended.getDate() + 1);
        const endDateStr = endDateExtended.toISOString().split('T')[0];
        const existingSchedules = await this.scheduleRepo.find({
            where: {
                companyId,
                busId: bus.id,
                date: (0, typeorm_2.Between)(dto.startDate, endDateStr),
            },
            select: ['id', 'date', 'departureDateTime', 'arrivalDateTime', 'status'],
        });
        const activeExisting = existingSchedules.filter((s) => s.status !== schedule_entity_1.ScheduleStatus.CANCELLED);
        const created = [];
        const skipped = [];
        const toInsert = [];
        for (const candidate of candidates) {
            const hasConflict = activeExisting.some((existing) => existing.departureDateTime < candidate.arrivalDateTime &&
                existing.arrivalDateTime > candidate.departureDateTime);
            if (hasConflict) {
                skipped.push(candidate.dateStr);
                continue;
            }
            toInsert.push({
                companyId,
                tripId: trip.id,
                busId: bus.id,
                date: candidate.dateStr,
                departureDateTime: candidate.departureDateTime,
                arrivalDateTime: candidate.arrivalDateTime,
                totalSeats: bus.capacity,
                status: schedule_entity_1.ScheduleStatus.SCHEDULED,
            });
        }
        const BATCH_SIZE = 50;
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
            const batch = toInsert.slice(i, i + BATCH_SIZE);
            const entities = this.scheduleRepo.create(batch);
            const saved = await this.scheduleRepo.save(entities);
            created.push(...saved);
        }
        this.logger.log(`Génération terminée : ${created.length} créé(s), ${skipped.length} conflit(s) ignoré(s) ` +
            `[trip: ${trip.departureTime}→${trip.arrivalTime}, bus: ${bus.plate}]`);
        return { created: created.length, skipped, schedules: created };
    }
    async update(companyId, id, dto) {
        const schedule = await this.findOne(companyId, id);
        const updatePayload = {};
        if (dto.busId && dto.busId !== schedule.busId) {
            const bus = await this.busesService.findOne(companyId, dto.busId);
            updatePayload.busId = bus.id;
            updatePayload.totalSeats = bus.capacity;
        }
        if (dto.date && dto.date !== schedule.date) {
            const trip = await this.tripsService.findOne(companyId, schedule.tripId);
            const { departureDateTime, arrivalDateTime } = this.buildDateTimes(dto.date, trip.departureTime, trip.arrivalTime);
            updatePayload.date = dto.date;
            updatePayload.departureDateTime = departureDateTime;
            updatePayload.arrivalDateTime = arrivalDateTime;
        }
        if (dto.status) {
            updatePayload.status = dto.status;
        }
        if (dto.busId || dto.date) {
            await this.checkBusConflict(updatePayload.busId ?? schedule.busId, updatePayload.departureDateTime ?? schedule.departureDateTime, updatePayload.arrivalDateTime ?? schedule.arrivalDateTime, companyId, id);
        }
        await this.scheduleRepo.update({ id, companyId }, updatePayload);
        return this.findOne(companyId, id);
    }
    async remove(companyId, id) {
        const schedule = await this.findOne(companyId, id);
        if (schedule.status === schedule_entity_1.ScheduleStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Un voyage en cours ne peut pas être supprimé');
        }
        await this.scheduleRepo.remove(schedule);
        return { message: 'Schedule supprimé' };
    }
    buildDateTimes(date, depTime, arrTime) {
        const departureDateTime = new Date(`${date}T${depTime}:00`);
        const arrivalDateTime = new Date(`${date}T${arrTime}:00`);
        if (arrivalDateTime <= departureDateTime) {
            arrivalDateTime.setDate(arrivalDateTime.getDate() + 1);
        }
        return { departureDateTime, arrivalDateTime };
    }
    async checkBusConflict(busId, departureDateTime, arrivalDateTime, companyId, excludeId) {
        const qb = this.scheduleRepo.createQueryBuilder('s')
            .where('s.companyId = :companyId', { companyId })
            .andWhere('s.busId = :busId', { busId })
            .andWhere('s.status != :cancelled', { cancelled: schedule_entity_1.ScheduleStatus.CANCELLED })
            .andWhere('s.departureDateTime < :arrivalDateTime', { arrivalDateTime })
            .andWhere('s.arrivalDateTime > :departureDateTime', { departureDateTime });
        if (excludeId) {
            qb.andWhere('s.id != :excludeId', { excludeId });
        }
        const conflict = await qb.getOne();
        if (conflict) {
            throw new common_1.ConflictException(`Ce bus est déjà assigné à un voyage qui se chevauche le ${conflict.date}`);
        }
    }
    async findAvailableBuses(companyId, tripId, date) {
        const trip = await this.tripsService.findOne(companyId, tripId);
        const { departureDateTime, arrivalDateTime } = this.buildDateTimes(date, trip.departureTime, trip.arrivalTime);
        return this.busesService.findAvailable(companyId, departureDateTime, arrivalDateTime);
    }
};
exports.SchedulesService = SchedulesService;
exports.SchedulesService = SchedulesService = SchedulesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_entity_1.ScheduleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        trips_service_1.TripsService,
        buses_service_1.BusesService])
], SchedulesService);
//# sourceMappingURL=schedules.service.js.map