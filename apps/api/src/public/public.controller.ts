/**
 * apps/api/src/public/public.controller.ts
 *
 * Endpoints publics — aucune auth requise.
 * Base path : /api/v1/public
 *
 * GET  /public/search           → voyages disponibles (toutes compagnies ou filtrées par slug)
 * GET  /public/seat-map/:id     → plan des sièges d'un schedule
 * POST /public/reservations     → créer une réservation (guest checkout)
 * GET  /public/ticket/:ref      → récupérer un billet par référence + téléphone
 */
import {
  Controller, Get, Post,
  Body, Param, Query,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PublicService } from './public.service';
import { PublicReservationDto } from './dto/public-reservation.dto';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /**
   * Recherche de voyages disponibles.
   * Retourne les schedules de TOUTES les compagnies actives,
   * ou filtrés par slug si le paramètre companySlug est fourni.
   */
  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Rechercher des voyages disponibles (public)' })
  @ApiQuery({ name: 'date',        required: true,  description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'fromStop',    required: false,  description: 'Ville de départ (partiel)' })
  @ApiQuery({ name: 'toStop',      required: false,  description: 'Ville d\'arrivée (partiel)' })
  @ApiQuery({ name: 'companySlug', required: false,  description: 'Slug de la compagnie (ex: sotrama-bamako)' })
  search(
    @Query('date')        date: string,
    @Query('fromStop')    fromStop?: string,
    @Query('toStop')      toStop?: string,
    @Query('companySlug') companySlug?: string,
  ) {
    if (!date) throw new BadRequestException('Le paramètre date est obligatoire');
    return this.publicService.search({ date, fromStop, toStop, companySlug });
  }

  /**
   * Plan des sièges d'un schedule pour un segment donné.
   * companyId résolu depuis le scheduleId — pas besoin de l'exposer publiquement.
   */
  @Public()
  @Get('seat-map/:scheduleId')
  @ApiOperation({ summary: 'Plan des sièges d\'un voyage (public)' })
  @ApiParam({ name: 'scheduleId' })
  @ApiQuery({ name: 'from', type: 'number', description: 'fromStopOrder' })
  @ApiQuery({ name: 'to',   type: 'number', description: 'toStopOrder' })
  getSeatMap(
    @Param('scheduleId') scheduleId: string,
    @Query('from', ParseIntPipe) from: number,
    @Query('to',   ParseIntPipe) to: number,
  ) {
    return this.publicService.getSeatMap(scheduleId, from, to);
  }

  /**
   * Créer une réservation sans compte (guest checkout).
   * Canal : ONLINE (nouveau SaleChannel).
   * Le companyId est résolu depuis le scheduleId.
   */
  @Public()
  @Post('reservations')
  @ApiOperation({ summary: 'Créer une réservation publique (guest)' })
  createReservation(@Body() dto: PublicReservationDto) {
    return this.publicService.createReservation(dto);
  }

  /**
   * Récupérer un billet par référence + téléphone (sans compte).
   * Le téléphone sert de second facteur d'identification.
   */
  @Public()
  @Get('ticket/:reference')
  @ApiOperation({ summary: 'Récupérer un billet par référence (public)' })
  @ApiParam({ name: 'reference', example: 'REF-2026-A7F2K1PB' })
  @ApiQuery({ name: 'phone', required: true, description: 'Téléphone du passager (vérification)' })
  getTicket(
    @Param('reference') reference: string,
    @Query('phone')     phone: string,
  ) {
    if (!phone) throw new BadRequestException('Le paramètre phone est obligatoire');
    return this.publicService.getTicket(reference, phone);
  }
}
