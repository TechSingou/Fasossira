// apps/api/src/companies/companies.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyEntity } from './entities/company.entity';
import { CompanySettingsEntity } from './entities/company-settings.entity';
import { SubscriptionEntity } from '../plans/entities/subscription.entity';
import { SubscriptionPlanEntity } from '../plans/entities/subscription-plan.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AgencyEntity } from '../agencies/entities/agency.entity';
import { BusEntity } from '../buses/entities/bus.entity';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      CompanySettingsEntity,
      SubscriptionEntity,
      SubscriptionPlanEntity,
      UserEntity,
      AgencyEntity,
      BusEntity,
    ]),
    AuthModule,
    CommonModule, // pour PlanLimitsService
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
