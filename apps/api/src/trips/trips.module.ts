import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TripEntity } from './entities/trip.entity';
import { AuthModule } from '../auth/auth.module';
import { RoutesModule } from '../routes/routes.module';

@Module({
  imports: [TypeOrmModule.forFeature([TripEntity]), AuthModule, RoutesModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService], // utilisé par SchedulesModule
})
export class TripsModule { }