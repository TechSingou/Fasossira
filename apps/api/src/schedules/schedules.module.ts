import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { ScheduleEntity } from './entities/schedule.entity';
import { AuthModule } from '../auth/auth.module';
import { TripsModule } from '../trips/trips.module';
import { BusesModule } from '../buses/buses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleEntity]),
    AuthModule,
    TripsModule,
    BusesModule,
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService], // utilisé par ReservationsModule (Étape 4)
})
export class SchedulesModule { }