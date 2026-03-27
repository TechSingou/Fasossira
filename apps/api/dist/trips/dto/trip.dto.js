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
exports.UpdateTripDto = exports.CreateTripDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIME_MSG = 'Format HH:mm requis (ex: 06:30)';
class CreateTripDto {
}
exports.CreateTripDto = CreateTripDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-de-la-route' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "routeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '06:30' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: TIME_MSG }),
    __metadata("design:type", String)
], CreateTripDto.prototype, "departureTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '14:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: TIME_MSG }),
    __metadata("design:type", String)
], CreateTripDto.prototype, "arrivalTime", void 0);
class UpdateTripDto {
}
exports.UpdateTripDto = UpdateTripDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: TIME_MSG }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "departureTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: TIME_MSG }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "arrivalTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateTripDto.prototype, "isActive", void 0);
//# sourceMappingURL=trip.dto.js.map