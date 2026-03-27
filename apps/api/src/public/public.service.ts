/**
 * apps/api/src/public/public.service.ts
 *
 * Fixes :
 *   1. createReservation → boucle sur dto.passengers (multi-sièges atomique)
 *   2. getTicket → retourne company { name, primaryColor, logoUrl } pour le branding
 */
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CompanyEntity } from '../companies/entities/company.entity';
import { CompanySettingsEntity } from '../companies/entities/company-settings.entity';
import { ScheduleEntity, ScheduleStatus } from '../schedules/entities/schedule.entity';
import { ReservationEntity } from '../reservations/entities/reservation.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { SegmentPriceEntity } from '../routes/entities/segment-price.entity';
import { TicketsService } from '../tickets/tickets.service';
import { PublicReservationDto } from './dto/public-reservation.dto';
import { ReservationStatus, PaymentStatus, SaleChannel } from '../shared/types';

interface SearchParams {
  date: string; fromStop?: string; toStop?: string; companySlug?: string;
}

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,

    @InjectRepository(CompanySettingsEntity)
    private readonly settingsRepo: Repository<CompanySettingsEntity>,

    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepo: Repository<ScheduleEntity>,

    @InjectRepository(ReservationEntity)
    private readonly reservationRepo: Repository<ReservationEntity>,

    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,

    @InjectRepository(SegmentPriceEntity)
    private readonly segmentPriceRepo: Repository<SegmentPriceEntity>,

    private readonly ticketsService: TicketsService,
    private readonly dataSource: DataSource,
  ) { }

  // ─────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────
  async search({ date, fromStop, toStop, companySlug }: SearchParams) {
    const companyQb = this.companyRepo
      .createQueryBuilder('c')
      .select(['c.id', 'c.name', 'c.slug', 'c.city'])
      .leftJoinAndSelect('c.settings', 'settings')
      .where('c.isActive = true');

    if (companySlug) companyQb.andWhere('c.slug = :slug', { slug: companySlug });

    const companies = await companyQb.getMany();
    if (!companies.length) return [];

    const companyIds = companies.map(c => c.id);
    const companyMap = new Map(companies.map(c => [c.id, c]));

    const schedules = await this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.trip', 'trip')
      .leftJoinAndSelect('trip.route', 'route')
      .leftJoinAndSelect('route.stops', 'stops')
      .leftJoinAndSelect('s.bus', 'bus')
      .where('s.companyId IN (:...companyIds)', { companyIds })
      .andWhere('s.date = :date', { date })
      .andWhere('s.status NOT IN (:...excluded)', {
        excluded: [ScheduleStatus.CANCELLED, ScheduleStatus.COMPLETED],
      })
      .orderBy('s.departureDateTime', 'ASC')
      .addOrderBy('stops.order', 'ASC')
      .getMany();

    return Promise.all(
      schedules
        .filter(s => {
          if (!s.trip?.route?.stops?.length) return true;
          const names = s.trip.route.stops.map(st => st.cityName.toLowerCase());
          if (fromStop && !names.some(n => n.includes(fromStop.toLowerCase()))) return false;
          if (toStop && !names.some(n => n.includes(toStop.toLowerCase()))) return false;
          return true;
        })
        .map(async s => {
          const takenCount = await this.reservationRepo.count({
            where: { scheduleId: s.id, status: ReservationStatus.CONFIRMED },
          });
          const company = companyMap.get(s.companyId)!;
          return {
            scheduleId: s.id,
            date: s.date,
            departureDateTime: s.departureDateTime,
            arrivalDateTime: s.arrivalDateTime,
            status: s.status,
            totalSeats: s.totalSeats,
            availableSeats: Math.max(0, s.totalSeats - takenCount),
            company: {
              id: company.id,
              name: company.name,
              slug: company.slug,
              city: company.city,
              primaryColor: company.settings?.primaryColor ?? '#0B3D91',
              logoUrl: company.settings?.logoUrl ?? null,
            },
            trip: {
              departureTime: s.trip.departureTime,
              arrivalTime: s.trip.arrivalTime,
              route: {
                id: s.trip.route?.id ?? '',
                name: s.trip.route?.name ?? '—',
                stops: (s.trip.route?.stops ?? [])
                  .sort((a, b) => a.order - b.order)
                  .map(st => ({ id: st.id, order: st.order, cityName: st.cityName })),
              },
            },
            bus: { plate: s.bus?.plate ?? '—', capacity: s.bus?.capacity ?? 0 },
          };
        }),
    );
  }

  // ─────────────────────────────────────────────────────────
  // SEAT MAP
  // ─────────────────────────────────────────────────────────
  async getSeatMap(scheduleId: string, fromStopOrder: number, toStopOrder: number) {
    const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Schedule introuvable');
    if (fromStopOrder >= toStopOrder)
      throw new BadRequestException('fromStopOrder doit être inférieur à toStopOrder');

    const reservations = await this.reservationRepo.find({
      where: { scheduleId, status: ReservationStatus.CONFIRMED },
      select: ['seatNumber', 'fromStopOrder', 'toStopOrder'],
    });

    const seats = Array.from({ length: schedule.totalSeats }, (_, i) => {
      const seatNum = i + 1;
      const isTaken = reservations.some(
        r => r.seatNumber === seatNum &&
          r.fromStopOrder < toStopOrder &&
          r.toStopOrder > fromStopOrder,
      );
      return { seatNumber: seatNum, status: isTaken ? 'taken' : 'free' };
    });

    return {
      scheduleId, totalSeats: schedule.totalSeats,
      fromStopOrder, toStopOrder, seats,
      availableCount: seats.filter(s => s.status === 'free').length,
    };
  }

  // ─────────────────────────────────────────────────────────
  // CREATE RESERVATION — FIX : boucle sur tous les passagers
  // ─────────────────────────────────────────────────────────
  async createReservation(dto: PublicReservationDto) {
    // 1. Charger le schedule
    const schedule = await this.scheduleRepo.findOne({
      where: { id: dto.scheduleId },
      relations: ['trip', 'trip.route', 'trip.route.stops'],
    });
    if (!schedule) throw new NotFoundException('Schedule introuvable');

    const companyId = schedule.companyId;

    // 2. Prix du segment
    const segmentPrice = await this.segmentPriceRepo.findOne({
      where: {
        routeId: schedule.trip.route.id,
        fromStopOrder: dto.fromStopOrder,
        toStopOrder: dto.toStopOrder,
      },
    });
    if (!segmentPrice)
      throw new NotFoundException(`Aucun tarif pour ce segment (${dto.fromStopOrder}→${dto.toStopOrder})`);

    // 3. Noms de villes
    const stops = schedule.trip.route.stops;
    const fromStop = stops.find(s => s.order === dto.fromStopOrder);
    const toStop = stops.find(s => s.order === dto.toStopOrder);

    // 4. Vérifier doublons de sièges dans la requête
    const seatNums = dto.passengers.map(p => p.seatNumber);
    if (new Set(seatNums).size !== seatNums.length)
      throw new BadRequestException('Deux passagers ne peuvent pas avoir le même siège');

    // 5. Vérifier disponibilité de TOUS les sièges AVANT la transaction
    await Promise.all(seatNums.map(async seat => {
      const conflict = await this.reservationRepo.findOne({
        where: { scheduleId: dto.scheduleId, seatNumber: seat, status: ReservationStatus.CONFIRMED },
      });
      if (conflict) throw new BadRequestException(`Le siège ${seat} est déjà réservé`);
    }));

    const unitPrice = Number(segmentPrice.price);
    const currency = segmentPrice.currency;

    // 6. Transaction atomique — créer N réservations + N paiements
    const reservations = await this.dataSource.transaction(async manager => {
      const created: ReservationEntity[] = [];
      for (const passenger of dto.passengers) {
        const reference = this.ticketsService.generateReference();
        const res = manager.create(ReservationEntity, {
          companyId,
          reference,
          scheduleId: dto.scheduleId,
          seatNumber: passenger.seatNumber,
          fromStopOrder: dto.fromStopOrder,
          toStopOrder: dto.toStopOrder,
          fromCityName: fromStop?.cityName ?? '',
          toCityName: toStop?.cityName ?? '',
          passengerName: passenger.passengerName,
          passengerPhone: passenger.passengerPhone,
          amount: unitPrice,
          currency,
          saleChannel: SaleChannel.ONLINE,
          status: ReservationStatus.CONFIRMED,
          soldByUserId: null,
        });
        const saved = await manager.save(ReservationEntity, res);
        created.push(saved);

        await manager.save(PaymentEntity, manager.create(PaymentEntity, {
          companyId,
          reservationId: saved.id,
          amount: unitPrice,
          currency,
          method: dto.paymentMethod,
          status: PaymentStatus.PAID,
          externalRef: dto.externalRef ?? null,
        }));
      }
      return created;
    });

    // Retourner tous les billets créés
    return {
      count: reservations.length,
      totalAmount: unitPrice * reservations.length,
      currency,
      fromCityName: fromStop?.cityName ?? '',
      toCityName: toStop?.cityName ?? '',
      reservations: reservations.map(r => ({
        reference: r.reference,
        passengerName: r.passengerName,
        passengerPhone: r.passengerPhone,
        seatNumber: r.seatNumber,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }

  // ─────────────────────────────────────────────────────────
  // GET TICKET — FIX : inclure company branding
  // ─────────────────────────────────────────────────────────
  async getTicket(reference: string, phone: string) {
    const reservation = await this.reservationRepo.findOne({
      where: { reference },
      relations: ['schedule', 'schedule.trip', 'schedule.trip.route', 'schedule.bus'],
    });

    if (!reservation) throw new NotFoundException(`Billet ${reference} introuvable`);

    if (reservation.passengerPhone.replace(/\s/g, '') !== phone.replace(/\s/g, ''))
      throw new NotFoundException(`Billet ${reference} introuvable`);

    const payment = await this.paymentRepo.findOne({
      where: { reservationId: reservation.id },
    });

    // FIX : charger les settings de la compagnie pour le branding
    const settings = await this.settingsRepo.findOne({
      where: { companyId: reservation.companyId },
    });
    const company = await this.companyRepo.findOne({
      where: { id: reservation.companyId },
    });

    return {
      reference: reservation.reference,
      passengerName: reservation.passengerName,
      passengerPhone: reservation.passengerPhone,
      seatNumber: reservation.seatNumber,
      fromCityName: reservation.fromCityName,
      toCityName: reservation.toCityName,
      departureDateTime: reservation.schedule?.departureDateTime,
      arrivalDateTime: reservation.schedule?.arrivalDateTime,
      busPlate: reservation.schedule?.bus?.plate ?? '—',
      amount: reservation.amount,
      currency: reservation.currency,
      paymentMethod: payment?.method ?? '—',
      status: reservation.status,
      createdAt: reservation.createdAt,
      // FIX : données branding compagnie
      company: {
        name: company?.name ?? 'Fasossira',
        primaryColor: settings?.primaryColor ?? '#0B3D91',
        logoUrl: settings?.logoUrl ?? null,
      },
    };
  }
}
