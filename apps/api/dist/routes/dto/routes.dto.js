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
exports.BulkUpsertSegmentPricesDto = exports.UpsertSegmentPriceDto = exports.UpdateStopsDto = exports.CreateRouteStopDto = exports.UpdateRouteDto = exports.CreateRouteDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateRouteDto {
}
exports.CreateRouteDto = CreateRouteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bamako → Mopti' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRouteDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Route principale nord Mali' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRouteDto.prototype, "description", void 0);
class UpdateRouteDto {
}
exports.UpdateRouteDto = UpdateRouteDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRouteDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRouteDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRouteDto.prototype, "isActive", void 0);
class CreateRouteStopDto {
}
exports.CreateRouteStopDto = CreateRouteStopDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bamako' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRouteStopDto.prototype, "cityName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Position dans la route (1-based)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRouteStopDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, description: 'Distance km depuis le départ' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateRouteStopDto.prototype, "distanceFromStart", void 0);
class UpdateStopsDto {
}
exports.UpdateStopsDto = UpdateStopsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreateRouteStopDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateRouteStopDto),
    __metadata("design:type", Array)
], UpdateStopsDto.prototype, "stops", void 0);
class UpsertSegmentPriceDto {
}
exports.UpsertSegmentPriceDto = UpsertSegmentPriceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'order du stop de départ' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpsertSegmentPriceDto.prototype, "fromStopOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: 'order du stop d\'arrivée' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpsertSegmentPriceDto.prototype, "toStopOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4500, description: 'Prix en FCFA' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertSegmentPriceDto.prototype, "price", void 0);
class BulkUpsertSegmentPricesDto {
}
exports.BulkUpsertSegmentPricesDto = BulkUpsertSegmentPricesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [UpsertSegmentPriceDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpsertSegmentPriceDto),
    __metadata("design:type", Array)
], BulkUpsertSegmentPricesDto.prototype, "prices", void 0);
//# sourceMappingURL=routes.dto.js.map