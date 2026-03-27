// apps/api/src/common/common.module.ts
//
// Module commun exportant les services partagés entre modules.
// Importer dans BusesModule, AgenciesModule, UsersModule.

import { Module } from '@nestjs/common';
import { PlanLimitsService } from './services/plan-limits.service';

@Module({
  providers: [PlanLimitsService],
  exports:   [PlanLimitsService],
})
export class CommonModule {}
