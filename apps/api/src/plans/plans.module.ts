// apps/api/src/plans/plans.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlanEntity } from './entities/subscription-plan.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlanEntity, SubscriptionEntity]),
  ],
  controllers: [PlansController],
  providers: [PlansService],
  // On exporte PlansService + TypeOrmModule pour que CompaniesModule
  // puisse accéder aux repos sans circular dependency
  exports: [PlansService, TypeOrmModule],
})
export class PlansModule {}
