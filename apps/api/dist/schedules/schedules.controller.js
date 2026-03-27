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
exports.SchedulesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const schedules_service_1 = require("./schedules.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const tenant_scope_decorator_1 = require("../auth/decorators/tenant-scope.decorator");
const types_1 = require("../shared/types");
const schedule_dto_1 = require("./dto/schedule.dto");
const schedule_entity_1 = require("./entities/schedule.entity");
let SchedulesController = class SchedulesController {
    constructor(schedulesService) {
        this.schedulesService = schedulesService;
    }
    getPlanning(companyId, date) {
        const targetDate = date ?? new Date().toISOString().split('T')[0];
        return this.schedulesService.getPlanning(companyId, targetDate);
    }
    findForSale(companyId, date, fromStop, toStop) {
        if (!date)
            throw new common_1.BadRequestException('Le paramètre date est obligatoire');
        return this.schedulesService.findForSale(companyId, date, fromStop, toStop);
    }
    findAll(companyId, date, routeId, busId, status) {
        return this.schedulesService.findAll(companyId, { date, routeId, busId, status });
    }
    async findAvailableBuses(companyId, tripId, date) {
        if (!tripId || !date) {
            throw new common_1.BadRequestException('tripId et date sont requis');
        }
        return this.schedulesService.findAvailableBuses(companyId, tripId, date);
    }
    findOne(companyId, id) {
        return this.schedulesService.findOne(companyId, id);
    }
    create(companyId, dto) {
        return this.schedulesService.create(companyId, dto);
    }
    generate(companyId, dto) {
        return this.schedulesService.generate(companyId, dto);
    }
    update(companyId, id, dto) {
        return this.schedulesService.update(companyId, id, dto);
    }
    remove(companyId, id) {
        return this.schedulesService.remove(companyId, id);
    }
};
exports.SchedulesController = SchedulesController;
__decorate([
    (0, common_1.Get)('planning'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Planning du jour — tous les voyages avec taux de remplissage' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'YYYY-MM-DD (défaut: aujourd\'hui)' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "getPlanning", null);
__decorate([
    (0, common_1.Get)('for-sale'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Voyages disponibles pour la vente (stops + sièges libres)' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, description: 'YYYY-MM-DD' }),
    (0, swagger_1.ApiQuery)({ name: 'fromStop', required: false, description: 'Filtre ville de départ (partiel)' }),
    (0, swagger_1.ApiQuery)({ name: 'toStop', required: false, description: 'Filtre ville d\'arrivée (partiel)' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('fromStop')),
    __param(3, (0, common_1.Query)('toStop')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "findForSale", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les schedules avec filtres' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'routeId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'busId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: schedule_entity_1.ScheduleStatus }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('routeId')),
    __param(3, (0, common_1.Query)('busId')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('buses/available'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Bus disponibles pour un trip à une date donnée' }),
    (0, swagger_1.ApiQuery)({ name: 'tripId', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('tripId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "findAvailableBuses", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN, types_1.UserRole.AGENT),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Planifier un voyage (trip + bus + date)' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, schedule_dto_1.CreateScheduleDto]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Générer des schedules en série sur une période' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, schedule_dto_1.GenerateSchedulesDto]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "generate", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, schedule_dto_1.UpdateScheduleDto]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "remove", null);
exports.SchedulesController = SchedulesController = __decorate([
    (0, swagger_1.ApiTags)('Schedules'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('schedules'),
    __metadata("design:paramtypes", [schedules_service_1.SchedulesService])
], SchedulesController);
//# sourceMappingURL=schedules.controller.js.map