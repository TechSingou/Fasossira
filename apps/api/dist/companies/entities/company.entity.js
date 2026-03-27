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
exports.CompanyEntity = void 0;
const typeorm_1 = require("typeorm");
const company_settings_entity_1 = require("./company-settings.entity");
const subscription_entity_1 = require("../../plans/entities/subscription.entity");
let CompanyEntity = class CompanyEntity {
};
exports.CompanyEntity = CompanyEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CompanyEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], CompanyEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], CompanyEntity.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], CompanyEntity.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CompanyEntity.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], CompanyEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => company_settings_entity_1.CompanySettingsEntity, (s) => s.company, { cascade: true }),
    __metadata("design:type", company_settings_entity_1.CompanySettingsEntity)
], CompanyEntity.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subscription_entity_1.SubscriptionEntity, (s) => s.company),
    __metadata("design:type", Array)
], CompanyEntity.prototype, "subscriptions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CompanyEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CompanyEntity.prototype, "updatedAt", void 0);
exports.CompanyEntity = CompanyEntity = __decorate([
    (0, typeorm_1.Entity)('companies'),
    (0, typeorm_1.Index)(['slug'], { unique: true })
], CompanyEntity);
//# sourceMappingURL=company.entity.js.map