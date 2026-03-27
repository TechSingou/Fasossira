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
exports.RouteStopEntity = void 0;
const typeorm_1 = require("typeorm");
const route_entity_1 = require("./route.entity");
let RouteStopEntity = class RouteStopEntity {
};
exports.RouteStopEntity = RouteStopEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RouteStopEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RouteStopEntity.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RouteStopEntity.prototype, "routeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => route_entity_1.RouteEntity, (r) => r.stops, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'routeId' }),
    __metadata("design:type", route_entity_1.RouteEntity)
], RouteStopEntity.prototype, "route", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], RouteStopEntity.prototype, "cityName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RouteStopEntity.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], RouteStopEntity.prototype, "distanceFromStart", void 0);
exports.RouteStopEntity = RouteStopEntity = __decorate([
    (0, typeorm_1.Entity)('route_stops'),
    (0, typeorm_1.Index)(['routeId', 'order'], { unique: true }),
    (0, typeorm_1.Index)(['companyId'])
], RouteStopEntity);
//# sourceMappingURL=route-stop.entity.js.map