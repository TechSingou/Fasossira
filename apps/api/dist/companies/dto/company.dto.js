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
exports.UpdateCompanySettingsBodyDto = exports.UpdateCompanyInfoDto = exports.AssignPlanDto = exports.CreateCompanyBodyDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateCompanyBodyDto {
}
exports.CreateCompanyBodyDto = CreateCompanyBodyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sotrama Bamako' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateCompanyBodyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'sotrama-bamako',
        description: 'Identifiant URL unique, kebab-case uniquement',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-z0-9-]+$/, {
        message: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets',
    }),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateCompanyBodyDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bamako' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateCompanyBodyDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+223 20 22 33 44' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompanyBodyDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID du plan SaaS à assigner' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCompanyBodyDto.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin@sotrama-bamako.ml' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateCompanyBodyDto.prototype, "adminEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Koné Traoré' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateCompanyBodyDto.prototype, "adminName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'MonMotDePasse123',
        description: 'Mot de passe admin (optionnel — généré automatiquement si absent, min. 8 caractères)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'Le mot de passe doit faire au moins 8 caractères' }),
    __metadata("design:type", String)
], CreateCompanyBodyDto.prototype, "adminPassword", void 0);
class AssignPlanDto {
}
exports.AssignPlanDto = AssignPlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID du nouveau plan à assigner' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignPlanDto.prototype, "planId", void 0);
class UpdateCompanyInfoDto {
}
exports.UpdateCompanyInfoDto = UpdateCompanyInfoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sotrama Bamako — Nouveau nom' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], UpdateCompanyInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ségou' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompanyInfoDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompanyInfoDto.prototype, "phone", void 0);
class UpdateCompanySettingsBodyDto {
}
exports.UpdateCompanySettingsBodyDto = UpdateCompanySettingsBodyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sotrama Bamako Express', maxLength: 200 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateCompanySettingsBodyDto.prototype, "companyDisplayName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '#0B3D91', description: 'Couleur principale (hex 6 digits)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsHexColor)(),
    __metadata("design:type", String)
], UpdateCompanySettingsBodyDto.prototype, "primaryColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '#E63B2E', description: 'Couleur secondaire (hex 6 digits)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsHexColor)(),
    __metadata("design:type", String)
], UpdateCompanySettingsBodyDto.prototype, "secondaryColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Votre sécurité est notre priorité', maxLength: 200 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateCompanySettingsBodyDto.prototype, "ticketFooter", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+223 20 22 33 44', maxLength: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateCompanySettingsBodyDto.prototype, "supportContact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '/uploads/logos/logo-123.png', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value === '' ? null : value)),
    __metadata("design:type", String)
], UpdateCompanySettingsBodyDto.prototype, "logoUrl", void 0);
//# sourceMappingURL=company.dto.js.map