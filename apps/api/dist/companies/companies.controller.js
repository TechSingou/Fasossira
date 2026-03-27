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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const companies_service_1 = require("./companies.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const tenant_scope_decorator_1 = require("../auth/decorators/tenant-scope.decorator");
const types_1 = require("../shared/types");
const company_dto_1 = require("./dto/company.dto");
const plan_limits_service_1 = require("../common/services/plan-limits.service");
const LOGO_UPLOAD_DIR = (0, path_1.join)(process.cwd(), 'uploads', 'logos');
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;
let CompaniesController = class CompaniesController {
    constructor(companiesService, planLimits) {
        this.companiesService = companiesService;
        this.planLimits = planLimits;
    }
    findAll() {
        return this.companiesService.findAll();
    }
    getGlobalStats() {
        return this.companiesService.getGlobalStats();
    }
    getMyCompany(companyId) {
        return this.companiesService.findOne(companyId);
    }
    getMySettings(companyId) {
        return this.companiesService.getSettings(companyId);
    }
    getMyQuotas(companyId) {
        return this.planLimits.getTenantQuotas(companyId);
    }
    updateSettings(companyId, dto) {
        return this.companiesService.updateSettings(companyId, dto);
    }
    async uploadLogo(companyId, file) {
        if (!file)
            throw new common_1.BadRequestException('Aucun fichier recu');
        const logoUrl = `/uploads/logos/${file.filename}`;
        return this.companiesService.updateSettings(companyId, { logoUrl });
    }
    deleteLogo(companyId) {
        return this.companiesService.updateSettings(companyId, { logoUrl: null });
    }
    findOne(id) {
        return this.companiesService.findOne(id);
    }
    create(dto) {
        return this.companiesService.create(dto);
    }
    suspend(id) {
        return this.companiesService.toggleActive(id, false);
    }
    activate(id) {
        return this.companiesService.toggleActive(id, true);
    }
    assignPlan(id, dto) {
        return this.companiesService.assignPlan(id, dto);
    }
};
exports.CompaniesController = CompaniesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Lister tous les tenants avec stats d'usage" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Stats globales plateforme (MRR, tenants actifs, nouveaux)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getGlobalStats", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Informations de mon entreprise (Admin)' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getMyCompany", null);
__decorate([
    (0, common_1.Get)('me/settings'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Parametres de branding white-label du tenant (Admin + Agent)' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getMySettings", null);
__decorate([
    (0, common_1.Get)('me/quotas'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Quotas d'utilisation du plan actuel (Admin)" }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getMyQuotas", null);
__decorate([
    (0, common_1.Patch)('me/settings'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre a jour le branding white-label de son tenant' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, company_dto_1.UpdateCompanySettingsBodyDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)('me/logo'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Uploader le logo (JPEG/PNG/WebP/SVG, max 2 MB)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, _file, cb) => {
                if (!(0, fs_1.existsSync)(LOGO_UPLOAD_DIR))
                    (0, fs_1.mkdirSync)(LOGO_UPLOAD_DIR, { recursive: true });
                cb(null, LOGO_UPLOAD_DIR);
            },
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
                cb(null, `logo-${unique}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        fileFilter: (_req, file, cb) => {
            if (!ALLOWED_MIME.includes(file.mimetype)) {
                return cb(new common_1.BadRequestException('Format non supporte. Utilisez JPEG, PNG, WebP ou SVG.'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: MAX_SIZE_BYTES },
    })),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Delete)('me/logo'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer le logo du tenant' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "deleteLogo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Creer un nouveau tenant (company + admin + subscription)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [company_dto_1.CreateCompanyBodyDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/suspend'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Suspendre un tenant' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "suspend", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Reactiver un tenant suspendu' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)(':id/plan'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Assigner ou changer le plan d'un tenant" }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, company_dto_1.AssignPlanDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "assignPlan", null);
exports.CompaniesController = CompaniesController = __decorate([
    (0, swagger_1.ApiTags)('Companies'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('companies'),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService,
        plan_limits_service_1.PlanLimitsService])
], CompaniesController);
//# sourceMappingURL=companies.controller.js.map