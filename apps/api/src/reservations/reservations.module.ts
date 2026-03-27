import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationEntity } from './entities/reservation.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { ScheduleEntity } from '../schedules/entities/schedule.entity';
import { RouteStopEntity } from '../routes/entities/route-stop.entity';
import { SegmentPriceEntity } from '../routes/entities/segment-price.entity';
import { AuthModule } from '../auth/auth.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ReservationEntity,
            PaymentEntity,
            ScheduleEntity,
            RouteStopEntity,
            SegmentPriceEntity,
        ]),
        AuthModule,
        TicketsModule,
    ],
    controllers: [ReservationsController],
    providers: [ReservationsService],
    exports: [ReservationsService],
})
export class ReservationsModule { }
