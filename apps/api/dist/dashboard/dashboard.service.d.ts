import { Repository } from 'typeorm';
import { ReservationEntity } from '../reservations/entities/reservation.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { ScheduleEntity } from '../schedules/entities/schedule.entity';
import { BusEntity } from '../buses/entities/bus.entity';
import { RouteEntity } from '../routes/entities/route.entity';
import { DashboardQueryDto } from './dashboard.controller';
export interface DateRange {
    from: Date;
    to: Date;
}
export interface PeriodStats {
    revenue: number;
    tickets: number;
    passengers: number;
    avgTicketPrice: number;
    cancelledTickets: number;
    occupancyRate: number;
}
export interface DashboardStats {
    period: {
        from: string;
        to: string;
        label: string;
    };
    current: PeriodStats;
    previous: PeriodStats;
    fleet: {
        total: number;
        active: number;
        maintenance: number;
    };
    network: {
        activeRoutes: number;
        scheduledTrips: number;
        completedTrips: number;
    };
    paymentBreakdown: Array<{
        method: string;
        count: number;
        amount: number;
    }>;
    revenueTimeline: Array<{
        date: string;
        revenue: number;
        tickets: number;
    }>;
    topRoutes: Array<{
        name: string;
        tickets: number;
        revenue: number;
    }>;
}
export declare class DashboardService {
    private readonly reservationRepo;
    private readonly paymentRepo;
    private readonly scheduleRepo;
    private readonly busRepo;
    private readonly routeRepo;
    constructor(reservationRepo: Repository<ReservationEntity>, paymentRepo: Repository<PaymentEntity>, scheduleRepo: Repository<ScheduleEntity>, busRepo: Repository<BusEntity>, routeRepo: Repository<RouteEntity>);
    private resolveDateRange;
    private previousRange;
    private computePeriodStats;
    getStats(companyId: string, query: DashboardQueryDto): Promise<DashboardStats>;
}
