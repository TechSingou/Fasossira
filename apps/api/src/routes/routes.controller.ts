// apps/api/src/routes/routes.controller.ts
import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiParam,
} from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { UserRole } from '../shared/types';
import {
  CreateRouteDto, UpdateRouteDto,
  UpdateStopsDto, BulkUpsertSegmentPricesDto,
} from './dto/routes.dto';

@ApiTags('Routes & Réseau')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) { }

  // ─── Routes CRUD (Admin seulement) ─────────────────────────

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lister toutes les routes du tenant' })
  findAll(@TenantId() companyId: string) {
    return this.routesService.findAll(companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Détail d\'une route avec ses arrêts et prix' })
  findOne(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routesService.findOne(companyId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle route' })
  create(
    @TenantId() companyId: string,
    @Body() dto: CreateRouteDto,
  ) {
    return this.routesService.create(companyId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier une route' })
  update(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.routesService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer une route' })
  remove(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routesService.remove(companyId, id);
  }

  // ─── Arrêts ────────────────────────────────────────────────

  @Put(':id/stops')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Définir les arrêts d\'une route (remplace tous les arrêts existants)',
  })
  updateStops(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStopsDto,
  ) {
    return this.routesService.updateStops(companyId, id, dto);
  }

  // ─── Prix de segments ──────────────────────────────────────

  @Get(':id/segment-prices')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Voir la grille de prix d\'une route' })
  getSegmentPrices(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routesService.getSegmentPrices(companyId, id);
  }

  @Put(':id/segment-prices')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Sauvegarder la grille de prix (upsert — crée ou met à jour)',
  })
  bulkUpsertSegmentPrices(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BulkUpsertSegmentPricesDto,
  ) {

    return this.routesService.bulkUpsertSegmentPrices(companyId, id, dto);
  }
}
