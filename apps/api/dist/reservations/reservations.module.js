"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const reservations_controller_1 = require("./reservations.controller");
const reservations_service_1 = require("./reservations.service");
const reservation_entity_1 = require("./entities/reservation.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const route_stop_entity_1 = require("../routes/entities/route-stop.entity");
const segment_price_entity_1 = require("../routes/entities/segment-price.entity");
const auth_module_1 = require("../auth/auth.module");
const tickets_module_1 = require("../tickets/tickets.module");
let ReservationsModule = class ReservationsModule {
};
exports.ReservationsModule = ReservationsModule;
exports.ReservationsModule = ReservationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                reservation_entity_1.ReservationEntity,
                payment_entity_1.PaymentEntity,
                schedule_entity_1.ScheduleEntity,
                route_stop_entity_1.RouteStopEntity,
                segment_price_entity_1.SegmentPriceEntity,
            ]),
            auth_module_1.AuthModule,
            tickets_module_1.TicketsModule,
        ],
        controllers: [reservations_controller_1.ReservationsController],
        providers: [reservations_service_1.ReservationsService],
        exports: [reservations_service_1.ReservationsService],
    })
], ReservationsModule);
//# sourceMappingURL=reservations.module.js.map