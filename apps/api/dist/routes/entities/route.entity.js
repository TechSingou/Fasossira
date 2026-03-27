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
exports.RouteEntity = void 0;
const typeorm_1 = require("typeorm");
const route_stop_entity_1 = require("./route-stop.entity");
const segment_price_entity_1 = require("./segment-price.entity");
let RouteEntity = class RouteEntity {
};
exports.RouteEntity = RouteEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RouteEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RouteEntity.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], RouteEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], RouteEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], RouteEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => route_stop_entity_1.RouteStopEntity, (s) => s.route, {
        cascade: true,
        eager: false,
    }),
    __metadata("design:type", Array)
], RouteEntity.prototype, "stops", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => segment_price_entity_1.SegmentPriceEntity, (p) => p.route, {
        cascade: true,
        eager: false,
    }),
    __metadata("design:type", Array)
], RouteEntity.prototype, "segmentPrices", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RouteEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RouteEntity.prototype, "updatedAt", void 0);
exports.RouteEntity = RouteEntity = __decorate([
    (0, typeorm_1.Entity)('routes'),
    (0, typeorm_1.Index)(['companyId']),
    (0, typeorm_1.Index)(['companyId', 'isActive'])
], RouteEntity);
//# sourceMappingURL=route.entity.js.map