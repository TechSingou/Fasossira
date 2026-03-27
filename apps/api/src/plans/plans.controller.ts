// apps/api/src/plans/plans.controller.ts
import {
  Controller, Get, Post, Patch, Body, Param,
  ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../shared/types';

@ApiTags('Plans')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // ── GET /plans ────────────────────────────────────────────────
  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lister tous les plans SaaS' })
  findAll() {
    return this.plansService.findAll();
  }

  // ── GET /plans/active — AVANT /:id pour éviter conflit de route ──
  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Plans actifs — dropdown création tenant' })
  findActive() {
    return this.plansService.findActive();
  }

  // ── GET /plans/stats — AVANT /:id ─────────────────────────────
  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Statistiques SaaS (MRR, répartition)' })
  getStats() {
    return this.plansService.getStats();
  }

  // ── GET /plans/:id ────────────────────────────────────────────
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.findOne(id);
  }

  // ── POST /plans ───────────────────────────────────────────────
  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau plan SaaS' })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  // ── PATCH /plans/:id ─────────────────────────────────────────
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, dto);
  }

  // ── PATCH /plans/:id/toggle ──────────────────────────────────
  @Patch(':id/toggle')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activer / Désactiver un plan' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.toggleActive(id);
  }
}
