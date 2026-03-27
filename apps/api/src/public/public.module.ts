/**
 * apps/api/src/public/public.module.ts
 * Fix : ajout de CompanySettingsEntity pour le branding du ticket.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController }      from './public.controller';
import { PublicService }         from './public.service';
import { CompanyEntity }         from '../companies/entities/company.entity';
import { CompanySettingsEntity } from '../companies/entities/company-settings.entity';
import { ScheduleEntity }        from '../schedules/entities/schedule.entity';
import { ReservationEntity }     from '../reservations/entities/reservation.entity';
import { PaymentEntity }         from '../payments/entities/payment.entity';
import { SegmentPriceEntity }    from '../routes/entities/segment-price.entity';
import { TicketsModule }         from '../tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      CompanySettingsEntity,   // ← ajouté pour getTicket branding
      ScheduleEntity,
      ReservationEntity,
      PaymentEntity,
      SegmentPriceEntity,
    ]),
    TicketsModule,
  ],
  controllers: [PublicController],
  providers:   [PublicService],
})
export class PublicModule {}
