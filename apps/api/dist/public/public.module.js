"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const public_controller_1 = require("./public.controller");
const public_service_1 = require("./public.service");
const company_entity_1 = require("../companies/entities/company.entity");
const company_settings_entity_1 = require("../companies/entities/company-settings.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const segment_price_entity_1 = require("../routes/entities/segment-price.entity");
const tickets_module_1 = require("../tickets/tickets.module");
let PublicModule = class PublicModule {
};
exports.PublicModule = PublicModule;
exports.PublicModule = PublicModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                company_entity_1.CompanyEntity,
                company_settings_entity_1.CompanySettingsEntity,
                schedule_entity_1.ScheduleEntity,
                reservation_entity_1.ReservationEntity,
                payment_entity_1.PaymentEntity,
                segment_price_entity_1.SegmentPriceEntity,
            ]),
            tickets_module_1.TicketsModule,
        ],
        controllers: [public_controller_1.PublicController],
        providers: [public_service_1.PublicService],
    })
], PublicModule);
//# sourceMappingURL=public.module.js.map