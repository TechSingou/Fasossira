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
exports.UpdateBusDto = exports.CreateBusDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const bus_entity_1 = require("../entities/bus.entity");
class CreateBusDto {
}
exports.CreateBusDto = CreateBusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AA-123-BM' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBusDto.prototype, "plate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Toyota' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBusDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Coaster 2022' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBusDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: bus_entity_1.BusType }),
    (0, class_validator_1.IsEnum)(bus_entity_1.BusType),
    __metadata("design:type", String)
], CreateBusDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateBusDto.prototype, "capacity", void 0);
class UpdateBusDto {
}
exports.UpdateBusDto = UpdateBusDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBusDto.prototype, "plate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBusDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBusDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: bus_entity_1.BusType }),
    (0, class_validator_1.IsEnum)(bus_entity_1.BusType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBusDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateBusDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: bus_entity_1.BusStatus }),
    (0, class_validator_1.IsEnum)(bus_entity_1.BusStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateBusDto.prototype, "status", void 0);
//# sourceMappingURL=bus.dto.js.map