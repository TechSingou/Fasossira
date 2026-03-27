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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleEntity = exports.ScheduleStatus = void 0;
const typeorm_1 = require("typeorm");
const trip_entity_1 = require("../../trips/entities/trip.entity");
const bus_entity_1 = require("../../buses/entities/bus.entity");
var ScheduleStatus;
(function (ScheduleStatus) {
    ScheduleStatus["SCHEDULED"] = "SCHEDULED";
    ScheduleStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ScheduleStatus["COMPLETED"] = "COMPLETED";
    ScheduleStatus["CANCELLED"] = "CANCELLED";
})(ScheduleStatus || (exports.ScheduleStatus = ScheduleStatus = {}));
let ScheduleEntity = class ScheduleEntity {
};
exports.ScheduleEntity = ScheduleEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ScheduleEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ScheduleEntity.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ScheduleEntity.prototype, "tripId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => trip_entity_1.TripEntity, { onDelete: 'CASCADE', eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tripId' }),
    __metadata("design:type", trip_entity_1.TripEntity)
], ScheduleEntity.prototype, "trip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ScheduleEntity.prototype, "busId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bus_entity_1.BusEntity, { onDelete: 'RESTRICT', eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'busId' }),
    __metadata("design:type", bus_entity_1.BusEntity)
], ScheduleEntity.prototype, "bus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ScheduleEntity.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ScheduleEntity.prototype, "departureDateTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ScheduleEntity.prototype, "arrivalDateTime", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ScheduleStatus,
        default: ScheduleStatus.SCHEDULED,
    }),
    __metadata("design:type", String)
], ScheduleEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ScheduleEntity.prototype, "totalSeats", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleEntity.prototype, "updatedAt", void 0);
exports.ScheduleEntity = ScheduleEntity = __decorate([
    (0, typeorm_1.Entity)('schedules'),
    (0, typeorm_1.Index)(['companyId']),
    (0, typeorm_1.Index)(['companyId', 'date']),
    (0, typeorm_1.Index)(['busId', 'departureDateTime'])
], ScheduleEntity);
//# sourceMappingURL=schedule.entity.js.map