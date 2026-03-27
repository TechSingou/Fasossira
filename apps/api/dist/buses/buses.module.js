"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const buses_controller_1 = require("./buses.controller");
const buses_service_1 = require("./buses.service");
const bus_entity_1 = require("./entities/bus.entity");
const auth_module_1 = require("../auth/auth.module");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const common_module_1 = require("../common/common.module");
let BusesModule = class BusesModule {
};
exports.BusesModule = BusesModule;
exports.BusesModule = BusesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([bus_entity_1.BusEntity, schedule_entity_1.ScheduleEntity]), auth_module_1.AuthModule, common_module_1.CommonModule],
        controllers: [buses_controller_1.BusesController],
        providers: [buses_service_1.BusesService],
        exports: [buses_service_1.BusesService],
    })
], BusesModule);
//# sourceMappingURL=buses.module.js.map