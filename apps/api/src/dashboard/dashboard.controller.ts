// apps/api/src/dashboard/dashboard.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsISO8601, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { UserRole } from '../shared/types';
import { DashboardService } from './dashboard.service';

export enum PeriodPreset {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom',
}

export class DashboardQueryDto {
  @IsOptional()
  @IsEnum(PeriodPreset)
  period?: PeriodPreset = PeriodPreset.TODAY;

  @IsOptional()
  @IsISO8601()
  from?: string; // ISO date string, requis si period=custom

  @IsOptional()
  @IsISO8601()
  to?: string;   // ISO date string, requis si period=custom
}

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'KPIs dashboard avec filtre période (Jour/Semaine/Mois/Custom)' })
  @ApiQuery({ name: 'period', enum: PeriodPreset, required: false })
  @ApiQuery({ name: 'from', type: String, required: false, description: 'ISO date (si period=custom)' })
  @ApiQuery({ name: 'to',   type: String, required: false, description: 'ISO date (si period=custom)' })
  getStats(
    @TenantId() companyId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getStats(companyId, query);
  }
}
