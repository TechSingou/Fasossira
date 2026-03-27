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
exports.BusEntity = exports.BusStatus = exports.BusType = void 0;
const typeorm_1 = require("typeorm");
var BusType;
(function (BusType) {
    BusType["COASTER"] = "COASTER";
    BusType["SPRINTER"] = "SPRINTER";
    BusType["GRAND_BUS"] = "GRAND_BUS";
})(BusType || (exports.BusType = BusType = {}));
var BusStatus;
(function (BusStatus) {
    BusStatus["ACTIVE"] = "ACTIVE";
    BusStatus["MAINTENANCE"] = "MAINTENANCE";
    BusStatus["RETIRED"] = "RETIRED";
})(BusStatus || (exports.BusStatus = BusStatus = {}));
let BusEntity = class BusEntity {
};
exports.BusEntity = BusEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BusEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], BusEntity.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], BusEntity.prototype, "plate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], BusEntity.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], BusEntity.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: BusType }),
    __metadata("design:type", String)
], BusEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], BusEntity.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: BusStatus, default: BusStatus.ACTIVE }),
    __metadata("design:type", String)
], BusEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BusEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], BusEntity.prototype, "updatedAt", void 0);
exports.BusEntity = BusEntity = __decorate([
    (0, typeorm_1.Entity)('buses'),
    (0, typeorm_1.Index)(['companyId']),
    (0, typeorm_1.Index)(['companyId', 'status'])
], BusEntity);
//# sourceMappingURL=bus.entity.js.map