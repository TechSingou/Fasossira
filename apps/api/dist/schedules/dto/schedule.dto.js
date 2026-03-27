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
exports.GenerateSchedulesDto = exports.UpdateScheduleDto = exports.CreateScheduleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const schedule_entity_1 = require("../entities/schedule.entity");
const class_transformer_1 = require("class-transformer");
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
class CreateScheduleDto {
}
exports.CreateScheduleDto = CreateScheduleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-du-trip' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "tripId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-du-bus' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "busId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03-15' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(DATE_REGEX, { message: 'Format YYYY-MM-DD requis' }),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "date", void 0);
class UpdateScheduleDto {
}
exports.UpdateScheduleDto = UpdateScheduleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-du-bus' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "busId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: schedule_entity_1.ScheduleStatus }),
    (0, class_validator_1.IsEnum)(schedule_entity_1.ScheduleStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-03-15' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(DATE_REGEX, { message: 'Format YYYY-MM-DD requis' }),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "date", void 0);
class GenerateSchedulesDto {
}
exports.GenerateSchedulesDto = GenerateSchedulesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-du-trip' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateSchedulesDto.prototype, "tripId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-du-bus' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateSchedulesDto.prototype, "busId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03-10' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DATE_REGEX, { message: 'Format YYYY-MM-DD requis' }),
    __metadata("design:type", String)
], GenerateSchedulesDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-10' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(DATE_REGEX, { message: 'Format YYYY-MM-DD requis' }),
    __metadata("design:type", String)
], GenerateSchedulesDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [1, 3, 5],
        description: '1=Lundi … 7=Dimanche. Vide = tous les jours.',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(7),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    (0, class_validator_1.Max)(7, { each: true }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Array)
], GenerateSchedulesDto.prototype, "weekDays", void 0);
//# sourceMappingURL=schedule.dto.js.map