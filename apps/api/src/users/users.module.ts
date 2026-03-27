import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from '../auth/entities/user.entity';
import { AgencyEntity } from '../agencies/entities/agency.entity';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, AgencyEntity]), CommonModule],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
