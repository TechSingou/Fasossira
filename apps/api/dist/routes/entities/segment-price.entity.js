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
exports.SegmentPriceEntity = void 0;
const typeorm_1 = require("typeorm");
const route_entity_1 = require("./route.entity");
let SegmentPriceEntity = class SegmentPriceEntity {
};
exports.SegmentPriceEntity = SegmentPriceEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SegmentPriceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SegmentPriceEntity.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SegmentPriceEntity.prototype, "routeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => route_entity_1.RouteEntity, (r) => r.segmentPrices, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'routeId' }),
    __metadata("design:type", route_entity_1.RouteEntity)
], SegmentPriceEntity.prototype, "route", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SegmentPriceEntity.prototype, "fromStopOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SegmentPriceEntity.prototype, "toStopOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], SegmentPriceEntity.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: 'XOF' }),
    __metadata("design:type", String)
], SegmentPriceEntity.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SegmentPriceEntity.prototype, "updatedAt", void 0);
exports.SegmentPriceEntity = SegmentPriceEntity = __decorate([
    (0, typeorm_1.Entity)('segment_prices'),
    (0, typeorm_1.Index)(['routeId', 'fromStopOrder', 'toStopOrder'], { unique: true }),
    (0, typeorm_1.Index)(['companyId'])
], SegmentPriceEntity);
//# sourceMappingURL=segment-price.entity.js.map