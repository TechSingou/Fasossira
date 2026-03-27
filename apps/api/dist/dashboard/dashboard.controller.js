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
exports.DashboardController = exports.DashboardQueryDto = exports.PeriodPreset = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const tenant_scope_decorator_1 = require("../auth/decorators/tenant-scope.decorator");
const types_1 = require("../shared/types");
const dashboard_service_1 = require("./dashboard.service");
var PeriodPreset;
(function (PeriodPreset) {
    PeriodPreset["TODAY"] = "today";
    PeriodPreset["WEEK"] = "week";
    PeriodPreset["MONTH"] = "month";
    PeriodPreset["CUSTOM"] = "custom";
})(PeriodPreset || (exports.PeriodPreset = PeriodPreset = {}));
class DashboardQueryDto {
    constructor() {
        this.period = PeriodPreset.TODAY;
    }
}
exports.DashboardQueryDto = DashboardQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PeriodPreset),
    __metadata("design:type", String)
], DashboardQueryDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], DashboardQueryDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], DashboardQueryDto.prototype, "to", void 0);
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getStats(companyId, query) {
        return this.dashboardService.getStats(companyId, query);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'KPIs dashboard avec filtre période (Jour/Semaine/Mois/Custom)' }),
    (0, swagger_1.ApiQuery)({ name: 'period', enum: PeriodPreset, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'from', type: String, required: false, description: 'ISO date (si period=custom)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', type: String, required: false, description: 'ISO date (si period=custom)' }),
    __param(0, (0, tenant_scope_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, DashboardQueryDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getStats", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map