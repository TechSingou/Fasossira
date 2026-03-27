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
exports.CancelReservationDto = exports.CreateBulkReservationsDto = exports.CreateReservationDto = exports.PassengerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const types_1 = require("../../shared/types");
class PassengerDto {
}
exports.PassengerDto = PassengerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 14, description: 'Numéro de siège (1..capacity)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], PassengerDto.prototype, "seatNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Amadou Diallo' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], PassengerDto.prototype, "passengerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+22376123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], PassengerDto.prototype, "passengerPhone", void 0);
class CreateReservationDto {
}
exports.CreateReservationDto = CreateReservationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-du-schedule' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "scheduleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 14, description: 'Numéro de siège (1..capacity)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], CreateReservationDto.prototype, "seatNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'order du stop de départ' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateReservationDto.prototype, "fromStopOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: 'order du stop d\'arrivée' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    __metadata("design:type", Number)
], CreateReservationDto.prototype, "toStopOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Amadou Diallo' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "passengerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+22376123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "passengerPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: types_1.SaleChannel }),
    (0, class_validator_1.IsEnum)(types_1.SaleChannel),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "saleChannel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: types_1.PaymentMethod }),
    (0, class_validator_1.IsEnum)(types_1.PaymentMethod),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'OM-123456789' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "externalRef", void 0);
class CreateBulkReservationsDto {
}
exports.CreateBulkReservationsDto = CreateBulkReservationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-du-schedule' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBulkReservationsDto.prototype, "scheduleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'order du stop de départ' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateBulkReservationsDto.prototype, "fromStopOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: 'order du stop d\'arrivée' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    __metadata("design:type", Number)
], CreateBulkReservationsDto.prototype, "toStopOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: types_1.SaleChannel }),
    (0, class_validator_1.IsEnum)(types_1.SaleChannel),
    __metadata("design:type", String)
], CreateBulkReservationsDto.prototype, "saleChannel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: types_1.PaymentMethod }),
    (0, class_validator_1.IsEnum)(types_1.PaymentMethod),
    __metadata("design:type", String)
], CreateBulkReservationsDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'OM-123456789' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateBulkReservationsDto.prototype, "externalRef", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PassengerDto], description: '1 à 10 passagers' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PassengerDto),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(10),
    __metadata("design:type", Array)
], CreateBulkReservationsDto.prototype, "passengers", void 0);
class CancelReservationDto {
}
exports.CancelReservationDto = CancelReservationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Annulation à la demande du passager' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CancelReservationDto.prototype, "reason", void 0);
//# sourceMappingURL=reservation.dto.js.map