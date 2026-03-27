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
exports.BusesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const buses_service_1 = require("./buses.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const tenant_scope_decorator_1 = require("../auth/decorators/tenant-scope.decorator");
const types_1 = require("../shared/types");
const bus_dto_1 = require("./dto/bus.dto");
const bus_entity_1 = require("./entities/bus.entity");
let BusesController = class BusesController {
    constructor(busesService) {
        this.busesService = busesService;
    }
    findAll(companyId) {
        return this.busesService.findAll(companyId);
    }
    findActive(companyId) {
        return this.busesService.findAll(companyId, bus_entity_1.BusStatus.ACTIVE);
    }
    findOne(companyId, id) {
        return this.busesService.findOne(companyId, id);
    }
    create(companyId, dto) {
        return this.busesService.create(companyId, dto);
    }
    update(companyId, id, dto) {
        return this.busesService.update(companyId, id, dto);
    }
    remove(companyId, id) {
        return this.busesService.remove(companyId, id);
    }
};
exports.BusesController = BusesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Lister tous les bus du tenant' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BusesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Bus actifs uniquement' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BusesController.prototype, "findActive", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BusesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Ajouter un bus à la flotte' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, bus_dto_1.CreateBusDto]),
    __metadata("design:returntype", void 0)
], BusesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, bus_dto_1.UpdateBusDto]),
    __metadata("design:returntype", void 0)
], BusesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BusesController.prototype, "remove", null);
exports.BusesController = BusesController = __decorate([
    (0, swagger_1.ApiTags)('Flotte'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('buses'),
    __metadata("design:paramtypes", [buses_service_1.BusesService])
], BusesController);
//# sourceMappingURL=buses.controller.js.map