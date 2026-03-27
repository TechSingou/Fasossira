import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { ReservationEntity } from '../reservations/entities/reservation.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ReservationEntity, PaymentEntity]),
        AuthModule,
    ],
    controllers: [TicketsController],
    providers: [TicketsService],
    exports: [TicketsService], // utilisé par ReservationsModule
})
export class TicketsModule { }
