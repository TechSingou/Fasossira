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
var BusesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bus_entity_1 = require("./entities/bus.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const plan_limits_service_1 = require("../common/services/plan-limits.service");
let BusesService = BusesService_1 = class BusesService {
    constructor(busRepo, dataSource, planLimits) {
        this.busRepo = busRepo;
        this.dataSource = dataSource;
        this.planLimits = planLimits;
        this.logger = new common_1.Logger(BusesService_1.name);
    }
    async findAll(companyId, statusFilter) {
        return this.busRepo.find({
            where: { companyId, ...(statusFilter ? { status: statusFilter } : {}) },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(companyId, id) {
        const bus = await this.busRepo.findOne({ where: { id, companyId } });
        if (!bus)
            throw new common_1.NotFoundException('Bus introuvable');
        return bus;
    }
    async findAvailable(companyId, departureDateTime, arrivalDateTime) {
        const busyBusIds = await this.dataSource
            .getRepository(schedule_entity_1.ScheduleEntity)
            .createQueryBuilder('s')
            .select('s.busId')
            .where('s.companyId = :companyId', { companyId })
            .andWhere('s.status != :cancelled', { cancelled: schedule_entity_1.ScheduleStatus.CANCELLED })
            .andWhere('s.departureDateTime < :arrivalDateTime', { arrivalDateTime })
            .andWhere('s.arrivalDateTime > :departureDateTime', { departureDateTime })
            .getRawMany();
        const busyIds = busyBusIds.map((r) => r.s_busId);
        const qb = this.busRepo
            .createQueryBuilder('b')
            .where('b.companyId = :companyId', { companyId })
            .andWhere('b.status = :active', { active: bus_entity_1.BusStatus.ACTIVE })
            .orderBy('b.plate', 'ASC');
        if (busyIds.length > 0) {
            qb.andWhere('b.id NOT IN (:...busyIds)', { busyIds });
        }
        return qb.getMany();
    }
    async create(companyId, dto) {
        await this.planLimits.assertCanCreate(companyId, 'buses');
        const exists = await this.busRepo.findOne({
            where: { companyId, plate: dto.plate },
        });
        if (exists) {
            throw new common_1.ConflictException(`Un bus avec la plaque "${dto.plate}" existe déjà`);
        }
        const bus = this.busRepo.create({ ...dto, companyId });
        const saved = await this.busRepo.save(bus);
        this.logger.log(`Bus créé : ${saved.plate} (${companyId})`);
        return saved;
    }
    async update(companyId, id, dto) {
        const bus = await this.findOne(companyId, id);
        if (dto.plate && dto.plate !== bus.plate) {
            const conflict = await this.busRepo.findOne({
                where: { companyId, plate: dto.plate },
            });
            if (conflict) {
                throw new common_1.ConflictException(`Un bus avec la plaque "${dto.plate}" existe déjà`);
            }
        }
        Object.assign(bus, dto);
        return this.busRepo.save(bus);
    }
    async remove(companyId, id) {
        const bus = await this.findOne(companyId, id);
        const hasUpcomingSchedules = await this.dataSource
            .getRepository(schedule_entity_1.ScheduleEntity)
            .exists({
            where: {
                busId: id,
                status: (0, typeorm_2.Not)(schedule_entity_1.ScheduleStatus.CANCELLED),
                departureDateTime: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (hasUpcomingSchedules) {
            throw new common_1.ConflictException(`Ce bus est assigné à des voyages futurs. ` +
                `Passez-le en MAINTENANCE ou RETIRED avant de le supprimer.`);
        }
        await this.busRepo.remove(bus);
        return { message: 'Bus supprimé' };
    }
};
exports.BusesService = BusesService;
exports.BusesService = BusesService = BusesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bus_entity_1.BusEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        plan_limits_service_1.PlanLimitsService])
], BusesService);
//# sourceMappingURL=buses.service.js.map