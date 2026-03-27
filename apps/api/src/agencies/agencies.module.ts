import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { AgencyEntity } from './entities/agency.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [TypeOrmModule.forFeature([AgencyEntity, UserEntity]), CommonModule],
    controllers: [AgenciesController],
    providers: [AgenciesService],
    exports: [AgenciesService],
})
export class AgenciesModule { }
