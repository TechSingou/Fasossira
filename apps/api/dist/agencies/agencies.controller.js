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
exports.AgenciesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agencies_service_1 = require("./agencies.service");
const agency_dto_1 = require("./dto/agency.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const tenant_scope_decorator_1 = require("../auth/decorators/tenant-scope.decorator");
const types_1 = require("../shared/types");
let AgenciesController = class AgenciesController {
    constructor(agenciesService) {
        this.agenciesService = agenciesService;
    }
    findAll(companyId, active) {
        return this.agenciesService.findAll(companyId, active === 'true');
    }
    findOne(companyId, id) {
        return this.agenciesService.findOne(companyId, id);
    }
    findAgents(companyId, id) {
        return this.agenciesService.findAgents(companyId, id);
    }
    create(companyId, dto) {
        return this.agenciesService.create(companyId, dto);
    }
    update(companyId, id, dto) {
        return this.agenciesService.update(companyId, id, dto);
    }
    remove(companyId, id) {
        return this.agenciesService.remove(companyId, id);
    }
};
exports.AgenciesController = AgenciesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Lister toutes les agences du tenant' }),
    (0, swagger_1.ApiQuery)({ name: 'active', required: false, type: Boolean }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Détail d\'une agence avec compteurs' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/agents'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les agents d\'une agence' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "findAgents", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Créer une agence' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, agency_dto_1.CreateAgencyDto]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Modifier une agence' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, agency_dto_1.UpdateAgencyDto]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer une agence (seulement si aucun agent rattaché)' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AgenciesController.prototype, "remove", null);
exports.AgenciesController = AgenciesController = __decorate([
    (0, swagger_1.ApiTags)('Agencies'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('agencies'),
    __metadata("design:paramtypes", [agencies_service_1.AgenciesService])
], AgenciesController);
//# sourceMappingURL=agencies.controller.js.map