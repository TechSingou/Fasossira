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
exports.PublicReservationDto = exports.PublicPassengerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const types_1 = require("../../shared/types");
class PublicPassengerDto {
}
exports.PublicPassengerDto = PublicPassengerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 14 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], PublicPassengerDto.prototype, "seatNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Amadou Diallo' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], PublicPassengerDto.prototype, "passengerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+22376123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], PublicPassengerDto.prototype, "passengerPhone", void 0);
class PublicReservationDto {
}
exports.PublicReservationDto = PublicReservationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-du-schedule' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PublicReservationDto.prototype, "scheduleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PublicReservationDto.prototype, "fromStopOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    __metadata("design:type", Number)
], PublicReservationDto.prototype, "toStopOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: types_1.PaymentMethod }),
    (0, class_validator_1.IsEnum)(types_1.PaymentMethod),
    __metadata("design:type", String)
], PublicReservationDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'OM-123456789' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], PublicReservationDto.prototype, "externalRef", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PublicPassengerDto], description: '1 à 10 passagers' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PublicPassengerDto),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(10),
    __metadata("design:type", Array)
], PublicReservationDto.prototype, "passengers", void 0);
//# sourceMappingURL=public-reservation.dto.js.map