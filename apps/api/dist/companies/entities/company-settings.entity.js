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
exports.CompanySettingsEntity = void 0;
const typeorm_1 = require("typeorm");
const company_entity_1 = require("./company.entity");
let CompanySettingsEntity = class CompanySettingsEntity {
};
exports.CompanySettingsEntity = CompanySettingsEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CompanySettingsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', unique: true }),
    __metadata("design:type", String)
], CompanySettingsEntity.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => company_entity_1.CompanyEntity, (c) => c.settings, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'companyId' }),
    __metadata("design:type", company_entity_1.CompanyEntity)
], CompanySettingsEntity.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CompanySettingsEntity.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 7, default: '#0B3D91' }),
    __metadata("design:type", String)
], CompanySettingsEntity.prototype, "primaryColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 7, default: '#E63B2E' }),
    __metadata("design:type", String)
], CompanySettingsEntity.prototype, "secondaryColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], CompanySettingsEntity.prototype, "companyDisplayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], CompanySettingsEntity.prototype, "ticketFooter", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: '' }),
    __metadata("design:type", String)
], CompanySettingsEntity.prototype, "supportContact", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CompanySettingsEntity.prototype, "updatedAt", void 0);
exports.CompanySettingsEntity = CompanySettingsEntity = __decorate([
    (0, typeorm_1.Entity)('company_settings')
], CompanySettingsEntity);
//# sourceMappingURL=company-settings.entity.js.map