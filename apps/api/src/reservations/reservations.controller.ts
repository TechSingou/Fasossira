import {
    Controller, Get, Post, Delete,
    Body, Param, Query, UseGuards, ParseUUIDPipe, ParseIntPipe,
} from '@nestjs/common';
import {
    ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import {
    CreateReservationDto,
    CreateBulkReservationsDto,
    CancelReservationDto,
} from './dto/reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, JwtPayload, ReservationStatus } from '../shared/types';

@ApiTags('Reservations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reservations')
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) { }

    // ─── Seat Map ──────────────────────────────────────────────

    @Get('seat-map/:scheduleId')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Plan des sièges pour un voyage + segment donné' })
    @ApiParam({ name: 'scheduleId', type: 'string' })
    @ApiQuery({ name: 'from', type: 'number', description: 'fromStopOrder' })
    @ApiQuery({ name: 'to', type: 'number', description: 'toStopOrder' })
    getSeatMap(
        @TenantId() companyId: string,
        @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
        @Query('from', ParseIntPipe) from: number,
        @Query('to', ParseIntPipe) to: number,
    ) {
        return this.reservationsService.getSeatMap(companyId, scheduleId, from, to);
    }

    // ─── Lister ────────────────────────────────────────────────

    @Get()
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Lister les réservations avec filtres' })
    @ApiQuery({ name: 'scheduleId', required: false })
    @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
    @ApiQuery({ name: 'status', required: false, enum: ReservationStatus })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @TenantId() companyId: string,
        @Query('scheduleId') scheduleId?: string,
        @Query('date') date?: string,
        @Query('status') status?: ReservationStatus,
        @Query('search') search?: string,
    ) {
        return this.reservationsService.findAll(companyId, { scheduleId, date, status, search });
    }

    // ─── Créer (1 passager) ────────────────────────────────────

    @Post()
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Créer une réservation simple (1 passager)' })
    create(
        @TenantId() companyId: string,
        @CurrentUser() user: JwtPayload,
        @Body() dto: CreateReservationDto,
    ) {
        return this.reservationsService.create(companyId, dto, user.sub);
    }

    // ─── Créer en masse (N passagers) ─────────────────────────
    //
    // Transaction atomique — rollback complet si un siège est déjà pris.
    // Retourne : { created, totalAmount, currency, reservations[] }

    @Post('bulk')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({
        summary: 'Créer plusieurs réservations en une transaction (même voyage & segment)',
    })
    createBulk(
        @TenantId() companyId: string,
        @CurrentUser() user: JwtPayload,
        @Body() dto: CreateBulkReservationsDto,
    ) {
        return this.reservationsService.createBulk(companyId, dto, user.sub);
    }

    // ─── Détail ────────────────────────────────────────────────

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Détail d\'une réservation par ID' })
    findOne(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.reservationsService.findOne(companyId, id);
    }

    // ─── Annuler ───────────────────────────────────────────────

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Annuler une réservation' })
    cancel(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() _dto: CancelReservationDto,
    ) {
        return this.reservationsService.cancel(companyId, id);
    }
}
