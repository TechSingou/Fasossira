// apps/api/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ReservationEntity } from '../reservations/entities/reservation.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { ScheduleEntity } from '../schedules/entities/schedule.entity';
import { BusEntity } from '../buses/entities/bus.entity';
import { RouteEntity } from '../routes/entities/route.entity';
import { ReservationStatus, PaymentStatus } from '../shared/types';
import { BusStatus } from '../buses/entities/bus.entity';
import { DashboardQueryDto, PeriodPreset } from './dashboard.controller';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PeriodStats {
  revenue: number;           // Recettes totales (XOF)
  tickets: number;           // Billets vendus
  passengers: number;        // Passagers uniques
  avgTicketPrice: number;    // Prix moyen billet
  cancelledTickets: number;  // Annulations
  occupancyRate: number;     // Taux d'occupation moyen (%)
}

export interface DashboardStats {
  period: { from: string; to: string; label: string };

  // ── KPIs principaux ────────────────────────────────────────
  current: PeriodStats;
  previous: PeriodStats; // même durée, période précédente (pour delta %)

  // ── Flotte (indépendant de la période) ─────────────────────
  fleet: {
    total: number;
    active: number;
    maintenance: number;
  };

  // ── Réseau ─────────────────────────────────────────────────
  network: {
    activeRoutes: number;
    scheduledTrips: number; // voyages planifiés sur la période
    completedTrips: number;
  };

  // ── Répartition paiements (sur la période) ─────────────────
  paymentBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
  }>;

  // ── Courbe revenue journalière (graphe sparkline) ──────────
  revenueTimeline: Array<{
    date: string;  // 'YYYY-MM-DD'
    revenue: number;
    tickets: number;
  }>;

  // ── Top routes par recettes ────────────────────────────────
  topRoutes: Array<{
    name: string;
    tickets: number;
    revenue: number;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationRepo: Repository<ReservationEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepo: Repository<ScheduleEntity>,
    @InjectRepository(BusEntity)
    private readonly busRepo: Repository<BusEntity>,
    @InjectRepository(RouteEntity)
    private readonly routeRepo: Repository<RouteEntity>,
  ) {}

  // ── Résout les bornes de la période ──────────────────────────
  private resolveDateRange(query: DashboardQueryDto): DateRange {
    const now = new Date();
    const startOfDay = (d: Date) => {
      const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
    };
    const endOfDay = (d: Date) => {
      const r = new Date(d); r.setHours(23, 59, 59, 999); return r;
    };

    switch (query.period) {
      case PeriodPreset.TODAY:
        return { from: startOfDay(now), to: endOfDay(now) };

      case PeriodPreset.WEEK: {
        const day = now.getDay(); // 0=dim
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((day + 6) % 7));
        return { from: startOfDay(monday), to: endOfDay(now) };
      }

      case PeriodPreset.MONTH: {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: startOfDay(first), to: endOfDay(now) };
      }

      case PeriodPreset.CUSTOM: {
        if (query.from && query.to) {
          return {
            from: startOfDay(new Date(query.from)),
            to: endOfDay(new Date(query.to)),
          };
        }
        // Fallback → today
        return { from: startOfDay(now), to: endOfDay(now) };
      }

      default:
        return { from: startOfDay(now), to: endOfDay(now) };
    }
  }

  // ── Calcule la période précédente (même durée) ───────────────
  private previousRange(range: DateRange): DateRange {
    const duration = range.to.getTime() - range.from.getTime();
    return {
      from: new Date(range.from.getTime() - duration - 1),
      to:   new Date(range.from.getTime() - 1),
    };
  }

  // ── KPIs sur une plage de dates ──────────────────────────────
  private async computePeriodStats(
    companyId: string,
    range: DateRange,
  ): Promise<PeriodStats> {
    // Réservations confirmées
    const reservations = await this.reservationRepo.find({
      where: {
        companyId,
        status: ReservationStatus.CONFIRMED,
        createdAt: Between(range.from, range.to),
      },
    });

    // Annulations
    const cancelled = await this.reservationRepo.count({
      where: {
        companyId,
        status: ReservationStatus.CANCELLED,
        createdAt: Between(range.from, range.to),
      },
    });

    const tickets = reservations.length;
    const revenue = reservations.reduce((s, r) => s + Number(r.amount), 0);
    const avgTicketPrice = tickets > 0 ? Math.round(revenue / tickets) : 0;

    // Taux d'occupation : réservations / (total sièges des voyages sur la période)
    const schedules = await this.scheduleRepo.find({
      where: {
        companyId,
        departureDateTime: Between(range.from, range.to),
      },
    });
    const totalSeats = schedules.reduce((s, sc) => s + sc.totalSeats, 0);
    const occupancyRate = totalSeats > 0
      ? Math.round((tickets / totalSeats) * 100)
      : 0;

    return {
      revenue,
      tickets,
      passengers: tickets, // 1 billet = 1 passager dans ce MVP
      avgTicketPrice,
      cancelledTickets: cancelled,
      occupancyRate,
    };
  }

  // ── Entrée principale ────────────────────────────────────────
  async getStats(companyId: string, query: DashboardQueryDto): Promise<DashboardStats> {
    const range = this.resolveDateRange(query);
    const prevRange = this.previousRange(range);

    // ── Exécution parallèle de toutes les requêtes ──────────────
    const [
      current,
      previous,
      buses,
      activeRoutes,
      scheduledTrips,
      completedTrips,
      paymentRows,
      timelineRows,
      topRoutesRows,
    ] = await Promise.all([
      // KPIs période courante
      this.computePeriodStats(companyId, range),
      // KPIs période précédente (pour les deltas %)
      this.computePeriodStats(companyId, prevRange),

      // Flotte
      this.busRepo.find({ where: { companyId } }),

      // Réseau
      this.routeRepo.count({ where: { companyId, isActive: true } }),

      this.scheduleRepo.count({
        where: {
          companyId,
          departureDateTime: Between(range.from, range.to),
        },
      }),

      this.scheduleRepo
        .createQueryBuilder('s')
        .where('s."companyId" = :companyId', { companyId })
        .andWhere('s."departureDateTime" BETWEEN :from AND :to', {
          from: range.from, to: range.to,
        })
        .andWhere("s.status = 'COMPLETED'")
        .getCount(),

      // Répartition modes de paiement
      this.paymentRepo
        .createQueryBuilder('p')
        .select('p.method', 'method')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(p.amount)', 'amount')
        .where('p."companyId" = :companyId', { companyId })
        .andWhere('p."paidAt" BETWEEN :from AND :to', { from: range.from, to: range.to })
        .andWhere('p.status = :status', { status: PaymentStatus.PAID })
        .groupBy('p.method')
        .getRawMany(),

      // Timeline journalière revenue
      this.reservationRepo
        .createQueryBuilder('r')
        .select("TO_CHAR(r.\"createdAt\", 'YYYY-MM-DD')", 'date')
        .addSelect('SUM(r.amount)', 'revenue')
        .addSelect('COUNT(*)', 'tickets')
        .where('r."companyId" = :companyId', { companyId })
        .andWhere('r."createdAt" BETWEEN :from AND :to', { from: range.from, to: range.to })
        .andWhere("r.status = 'CONFIRMED'")
        .groupBy("TO_CHAR(r.\"createdAt\", 'YYYY-MM-DD')")
        .orderBy('date', 'ASC')
        .getRawMany(),

      // Top routes
      this.reservationRepo
        .createQueryBuilder('r')
        .select("CONCAT(r.\"fromCityName\", ' → ', r.\"toCityName\")", 'name')
        .addSelect('COUNT(*)', 'tickets')
        .addSelect('SUM(r.amount)', 'revenue')
        .where('r."companyId" = :companyId', { companyId })
        .andWhere('r."createdAt" BETWEEN :from AND :to', { from: range.from, to: range.to })
        .andWhere("r.status = 'CONFIRMED'")
        .groupBy("CONCAT(r.\"fromCityName\", ' → ', r.\"toCityName\")")
        .orderBy('"revenue"', 'DESC')
        .limit(5)
        .getRawMany(),
    ]);

    // ── Label période ──────────────────────────────────────────
    const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const periodLabel: Record<string, string> = {
      [PeriodPreset.TODAY]: "Aujourd'hui",
      [PeriodPreset.WEEK]:  'Cette semaine',
      [PeriodPreset.MONTH]: 'Ce mois',
      [PeriodPreset.CUSTOM]: `${fmt(range.from)} – ${fmt(range.to)}`,
    };

    return {
      period: {
        from: range.from.toISOString(),
        to:   range.to.toISOString(),
        label: periodLabel[query.period ?? PeriodPreset.TODAY],
      },
      current,
      previous,
      fleet: {
        total:       buses.length,
        active:      buses.filter(b => b.status === BusStatus.ACTIVE).length,
        maintenance: buses.filter(b => b.status === BusStatus.MAINTENANCE).length,
      },
      network: {
        activeRoutes,
        scheduledTrips,
        completedTrips,
      },
      paymentBreakdown: paymentRows.map(r => ({
        method: r.method,
        count:  Number(r.count),
        amount: Number(r.amount),
      })),
      revenueTimeline: timelineRows.map(r => ({
        date:    r.date,
        revenue: Number(r.revenue),
        tickets: Number(r.tickets),
      })),
      topRoutes: topRoutesRows.map(r => ({
        name:    r.name,
        tickets: Number(r.tickets),
        revenue: Number(r.revenue),
      })),
    };
  }
}
