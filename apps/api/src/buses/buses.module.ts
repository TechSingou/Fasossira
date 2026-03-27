import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusesController } from './buses.controller';
import { BusesService } from './buses.service';
import { BusEntity } from './entities/bus.entity';
import { AuthModule } from '../auth/auth.module';
import { ScheduleEntity } from '../schedules/entities/schedule.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([BusEntity, ScheduleEntity]), AuthModule, CommonModule],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule { }