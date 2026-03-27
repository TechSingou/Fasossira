// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { PlansModule } from './plans/plans.module';
import { RoutesModule } from './routes/routes.module';
import { BusesModule } from './buses/buses.module';
import { TripsModule } from './trips/trips.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PaymentsModule } from './payments/payments.module';
import { TicketsModule } from './tickets/tickets.module';
import { AgenciesModule } from './agencies/agencies.module';  // ← Étape 5
import { UsersModule } from './users/users.module';           // ← Étape 5
import { DashboardModule } from './dashboard/dashboard.module'; // ← Étape 7

// Entities
import { CompanyEntity } from './companies/entities/company.entity';
import { CompanySettingsEntity } from './companies/entities/company-settings.entity';
import { SubscriptionPlanEntity } from './plans/entities/subscription-plan.entity';
import { SubscriptionEntity } from './plans/entities/subscription.entity';
import { UserEntity } from './auth/entities/user.entity';
import { RouteEntity } from './routes/entities/route.entity';
import { RouteStopEntity } from './routes/entities/route-stop.entity';
import { SegmentPriceEntity } from './routes/entities/segment-price.entity';
import { BusEntity } from './buses/entities/bus.entity';
import { TripEntity } from './trips/entities/trip.entity';
import { ScheduleEntity } from './schedules/entities/schedule.entity';
import { ReservationEntity } from './reservations/entities/reservation.entity';
import { PaymentEntity } from './payments/entities/payment.entity';
import { AgencyEntity } from './agencies/entities/agency.entity';  // ← Étape 5

// Common
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CommonModule } from './common/common.module';
import { PublicModule } from './public/public.module';

@Module({
    imports: [
        // ─── Config ─────────────────────────────────────────────
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

        // ─── Rate Limiting ───────────────────────────────────────
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

        // ─── Database ────────────────────────────────────────────
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host:     config.get('DB_HOST', 'localhost'),
                port:     config.get<number>('DB_PORT', 5432),
                username: config.get('DB_USER', 'fasossira'),
                password: config.get('DB_PASS', 'fasossira_dev'),
                database: config.get('DB_NAME', 'fasossira'),
                entities: [
                    CompanyEntity,
                    CompanySettingsEntity,
                    SubscriptionPlanEntity,
                    SubscriptionEntity,
                    UserEntity,
                    RouteEntity,
                    RouteStopEntity,
                    SegmentPriceEntity,
                    BusEntity,
                    TripEntity,
                    ScheduleEntity,
                    ReservationEntity,
                    PaymentEntity,
                    AgencyEntity,      // ← Étape 5
                ],
                synchronize: config.get('NODE_ENV') !== 'production',
                logging:     config.get('NODE_ENV') === 'development',
                ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
            }),
        }),

        // ─── Feature Modules ─────────────────────────────────────
        AuthModule,
        CompaniesModule,
        PlansModule,
        RoutesModule,
        BusesModule,
        TripsModule,
        SchedulesModule,
        ReservationsModule,
        PaymentsModule,
        TicketsModule,
        AgenciesModule,    // ← Étape 5
        UsersModule, CommonModule,       // ← Étape 5
        DashboardModule, PublicModule,   // ← Étape 7
    ],
    providers: [
        { provide: APP_GUARD,  useClass: ThrottlerGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
    ],
})
export class AppModule { }
