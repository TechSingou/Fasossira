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
var TripsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const trip_entity_1 = require("./entities/trip.entity");
let TripsService = TripsService_1 = class TripsService {
    constructor(tripRepo) {
        this.tripRepo = tripRepo;
        this.logger = new common_1.Logger(TripsService_1.name);
    }
    async findAll(companyId) {
        return this.tripRepo.find({
            where: { companyId },
            relations: ['route'],
            order: { departureTime: 'ASC' },
        });
    }
    async findOne(companyId, id) {
        const trip = await this.tripRepo.findOne({
            where: { id, companyId },
            relations: ['route'],
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip introuvable');
        return trip;
    }
    async create(companyId, dto) {
        this.validateTimes(dto.departureTime, dto.arrivalTime);
        const trip = this.tripRepo.create({ ...dto, companyId });
        const saved = await this.tripRepo.save(trip);
        this.logger.log(`Trip créé : ${saved.departureTime}→${saved.arrivalTime} (${companyId})`);
        return this.findOne(companyId, saved.id);
    }
    async update(companyId, id, dto) {
        const trip = await this.findOne(companyId, id);
        const newDep = dto.departureTime ?? trip.departureTime;
        const newArr = dto.arrivalTime ?? trip.arrivalTime;
        this.validateTimes(newDep, newArr);
        Object.assign(trip, dto);
        return this.tripRepo.save(trip);
    }
    async remove(companyId, id) {
        const trip = await this.findOne(companyId, id);
        await this.tripRepo.remove(trip);
        return { message: 'Trip supprimé' };
    }
    validateTimes(dep, arr) {
        if (dep === arr) {
            throw new common_1.BadRequestException(`L'heure de départ et d'arrivée ne peuvent pas être identiques (${dep})`);
        }
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = TripsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trip_entity_1.TripEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TripsService);
//# sourceMappingURL=trips.service.js.map