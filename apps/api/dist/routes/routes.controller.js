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
exports.RoutesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const routes_service_1 = require("./routes.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const tenant_scope_decorator_1 = require("../auth/decorators/tenant-scope.decorator");
const types_1 = require("../shared/types");
const routes_dto_1 = require("./dto/routes.dto");
let RoutesController = class RoutesController {
    constructor(routesService) {
        this.routesService = routesService;
    }
    findAll(companyId) {
        return this.routesService.findAll(companyId);
    }
    findOne(companyId, id) {
        return this.routesService.findOne(companyId, id);
    }
    create(companyId, dto) {
        return this.routesService.create(companyId, dto);
    }
    update(companyId, id, dto) {
        return this.routesService.update(companyId, id, dto);
    }
    remove(companyId, id) {
        return this.routesService.remove(companyId, id);
    }
    updateStops(companyId, id, dto) {
        return this.routesService.updateStops(companyId, id, dto);
    }
    getSegmentPrices(companyId, id) {
        return this.routesService.getSegmentPrices(companyId, id);
    }
    bulkUpsertSegmentPrices(companyId, id, dto) {
        return this.routesService.bulkUpsertSegmentPrices(companyId, id, dto);
    }
};
exports.RoutesController = RoutesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Lister toutes les routes du tenant' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoutesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Détail d\'une route avec ses arrêts et prix' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RoutesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Créer une nouvelle route' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, routes_dto_1.CreateRouteDto]),
    __metadata("design:returntype", void 0)
], RoutesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Modifier une route' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, routes_dto_1.UpdateRouteDto]),
    __metadata("design:returntype", void 0)
], RoutesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer une route' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RoutesController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/stops'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Définir les arrêts d\'une route (remplace tous les arrêts existants)',
    }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, routes_dto_1.UpdateStopsDto]),
    __metadata("design:returntype", void 0)
], RoutesController.prototype, "updateStops", null);
__decorate([
    (0, common_1.Get)(':id/segment-prices'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Voir la grille de prix d\'une route' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RoutesController.prototype, "getSegmentPrices", null);
__decorate([
    (0, common_1.Put)(':id/segment-prices'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Sauvegarder la grille de prix (upsert — crée ou met à jour)',
    }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, routes_dto_1.BulkUpsertSegmentPricesDto]),
    __metadata("design:returntype", void 0)
], RoutesController.prototype, "bulkUpsertSegmentPrices", null);
exports.RoutesController = RoutesController = __decorate([
    (0, swagger_1.ApiTags)('Routes & Réseau'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('routes'),
    __metadata("design:paramtypes", [routes_service_1.RoutesService])
], RoutesController);
//# sourceMappingURL=routes.controller.js.map