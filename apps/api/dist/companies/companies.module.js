"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const companies_controller_1 = require("./companies.controller");
const companies_service_1 = require("./companies.service");
const company_entity_1 = require("./entities/company.entity");
const company_settings_entity_1 = require("./entities/company-settings.entity");
const subscription_entity_1 = require("../plans/entities/subscription.entity");
const subscription_plan_entity_1 = require("../plans/entities/subscription-plan.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const agency_entity_1 = require("../agencies/entities/agency.entity");
const bus_entity_1 = require("../buses/entities/bus.entity");
const auth_module_1 = require("../auth/auth.module");
const common_module_1 = require("../common/common.module");
let CompaniesModule = class CompaniesModule {
};
exports.CompaniesModule = CompaniesModule;
exports.CompaniesModule = CompaniesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                company_entity_1.CompanyEntity,
                company_settings_entity_1.CompanySettingsEntity,
                subscription_entity_1.SubscriptionEntity,
                subscription_plan_entity_1.SubscriptionPlanEntity,
                user_entity_1.UserEntity,
                agency_entity_1.AgencyEntity,
                bus_entity_1.BusEntity,
            ]),
            auth_module_1.AuthModule,
            common_module_1.CommonModule,
        ],
        controllers: [companies_controller_1.CompaniesController],
        providers: [companies_service_1.CompaniesService],
        exports: [companies_service_1.CompaniesService],
    })
], CompaniesModule);
//# sourceMappingURL=companies.module.js.map