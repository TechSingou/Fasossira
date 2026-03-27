import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { UserRole } from '../shared/types';
import { CreateScheduleDto, UpdateScheduleDto, GenerateSchedulesDto } from './dto/schedule.dto';
import { ScheduleStatus } from './entities/schedule.entity';

@ApiTags('Schedules')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) { }

  @Get('planning')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Planning du jour — tous les voyages avec taux de remplissage' })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (défaut: aujourd\'hui)' })
  getPlanning(
    @TenantId() companyId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    return this.schedulesService.getPlanning(companyId, targetDate);
  }

  // ─── Endpoint dédié vente guichet / en route ─────────────
  // Retourne trip.route.stops + availableSeats — structure exacte
  // attendue par TicketOfficeComponent et OnRouteComponent.
  // Placé AVANT @Get(':id') pour éviter que NestJS l'interprète comme un UUID.
  @Get('for-sale')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Voyages disponibles pour la vente (stops + sièges libres)' })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'fromStop', required: false, description: 'Filtre ville de départ (partiel)' })
  @ApiQuery({ name: 'toStop', required: false, description: 'Filtre ville d\'arrivée (partiel)' })
  findForSale(
    @TenantId() companyId: string,
    @Query('date') date: string,
    @Query('fromStop') fromStop?: string,
    @Query('toStop') toStop?: string,
  ) {
    if (!date) throw new BadRequestException('Le paramètre date est obligatoire');
    return this.schedulesService.findForSale(companyId, date, fromStop, toStop);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Lister les schedules avec filtres' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiQuery({ name: 'busId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ScheduleStatus })
  findAll(
    @TenantId() companyId: string,
    @Query('date') date?: string,
    @Query('routeId') routeId?: string,
    @Query('busId') busId?: string,
    @Query('status') status?: ScheduleStatus,
  ) {
    return this.schedulesService.findAll(companyId, { date, routeId, busId, status });
  }

  // À ajouter dans schedules.controller.ts — plus logique que dans buses.controller.ts
  @Get('buses/available')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Bus disponibles pour un trip à une date donnée' })
  @ApiQuery({ name: 'tripId', required: true })
  @ApiQuery({ name: 'date', required: true })
  async findAvailableBuses(
    @TenantId() companyId: string,
    @Query('tripId') tripId: string,
    @Query('date') date: string,
  ) {
    if (!tripId || !date) {
      throw new BadRequestException('tripId et date sont requis');
    }
    return this.schedulesService.findAvailableBuses(companyId, tripId, date);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  findOne(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.schedulesService.findOne(companyId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Planifier un voyage (trip + bus + date)' })
  create(
    @TenantId() companyId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulesService.create(companyId, dto);
  }

  @Post('generate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Générer des schedules en série sur une période' })
  generate(
    @TenantId() companyId: string,
    @Body() dto: GenerateSchedulesDto,
  ) {
    return this.schedulesService.generate(companyId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.schedulesService.remove(companyId, id);
  }

}