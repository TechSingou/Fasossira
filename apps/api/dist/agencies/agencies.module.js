"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgenciesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const agencies_controller_1 = require("./agencies.controller");
const agencies_service_1 = require("./agencies.service");
const agency_entity_1 = require("./entities/agency.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const common_module_1 = require("../common/common.module");
let AgenciesModule = class AgenciesModule {
};
exports.AgenciesModule = AgenciesModule;
exports.AgenciesModule = AgenciesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([agency_entity_1.AgencyEntity, user_entity_1.UserEntity]), common_module_1.CommonModule],
        controllers: [agencies_controller_1.AgenciesController],
        providers: [agencies_service_1.AgenciesService],
        exports: [agencies_service_1.AgenciesService],
    })
], AgenciesModule);
//# sourceMappingURL=agencies.module.js.map