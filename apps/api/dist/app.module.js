"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const companies_module_1 = require("./companies/companies.module");
const plans_module_1 = require("./plans/plans.module");
const routes_module_1 = require("./routes/routes.module");
const buses_module_1 = require("./buses/buses.module");
const trips_module_1 = require("./trips/trips.module");
const schedules_module_1 = require("./schedules/schedules.module");
const reservations_module_1 = require("./reservations/reservations.module");
const payments_module_1 = require("./payments/payments.module");
const tickets_module_1 = require("./tickets/tickets.module");
const agencies_module_1 = require("./agencies/agencies.module");
const users_module_1 = require("./users/users.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const company_entity_1 = require("./companies/entities/company.entity");
const company_settings_entity_1 = require("./companies/entities/company-settings.entity");
const subscription_plan_entity_1 = require("./plans/entities/subscription-plan.entity");
const subscription_entity_1 = require("./plans/entities/subscription.entity");
const user_entity_1 = require("./auth/entities/user.entity");
const route_entity_1 = require("./routes/entities/route.entity");
const route_stop_entity_1 = require("./routes/entities/route-stop.entity");
const segment_price_entity_1 = require("./routes/entities/segment-price.entity");
const bus_entity_1 = require("./buses/entities/bus.entity");
const trip_entity_1 = require("./trips/entities/trip.entity");
const schedule_entity_1 = require("./schedules/entities/schedule.entity");
const reservation_entity_1 = require("./reservations/entities/reservation.entity");
const payment_entity_1 = require("./payments/entities/payment.entity");
const agency_entity_1 = require("./agencies/entities/agency.entity");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const common_module_1 = require("./common/common.module");
const public_module_1 = require("./public/public.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: config.get('DB_PORT', 5432),
                    username: config.get('DB_USER', 'fasossira'),
                    password: config.get('DB_PASS', 'fasossira_dev'),
                    database: config.get('DB_NAME', 'fasossira'),
                    entities: [
                        company_entity_1.CompanyEntity,
                        company_settings_entity_1.CompanySettingsEntity,
                        subscription_plan_entity_1.SubscriptionPlanEntity,
                        subscription_entity_1.SubscriptionEntity,
                        user_entity_1.UserEntity,
                        route_entity_1.RouteEntity,
                        route_stop_entity_1.RouteStopEntity,
                        segment_price_entity_1.SegmentPriceEntity,
                        bus_entity_1.BusEntity,
                        trip_entity_1.TripEntity,
                        schedule_entity_1.ScheduleEntity,
                        reservation_entity_1.ReservationEntity,
                        payment_entity_1.PaymentEntity,
                        agency_entity_1.AgencyEntity,
                    ],
                    synchronize: config.get('NODE_ENV') !== 'production',
                    logging: config.get('NODE_ENV') === 'development',
                    ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
                }),
            }),
            auth_module_1.AuthModule,
            companies_module_1.CompaniesModule,
            plans_module_1.PlansModule,
            routes_module_1.RoutesModule,
            buses_module_1.BusesModule,
            trips_module_1.TripsModule,
            schedules_module_1.SchedulesModule,
            reservations_module_1.ReservationsModule,
            payments_module_1.PaymentsModule,
            tickets_module_1.TicketsModule,
            agencies_module_1.AgenciesModule,
            users_module_1.UsersModule, common_module_1.CommonModule,
            dashboard_module_1.DashboardModule, public_module_1.PublicModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_FILTER, useClass: all_exceptions_filter_1.AllExceptionsFilter },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map