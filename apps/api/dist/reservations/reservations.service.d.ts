import { DataSource, Repository } from 'typeorm';
import { ReservationEntity } from './entities/reservation.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { ScheduleEntity } from '../schedules/entities/schedule.entity';
import { RouteStopEntity } from '../routes/entities/route-stop.entity';
import { SegmentPriceEntity } from '../routes/entities/segment-price.entity';
import { CreateReservationDto, CreateBulkReservationsDto } from './dto/reservation.dto';
import { ReservationStatus } from '../shared/types';
import { TicketsService } from '../tickets/tickets.service';
export interface SeatInfo {
    seatNumber: number;
    status: 'free' | 'taken';
}
export interface SeatMapResult {
    scheduleId: string;
    totalSeats: number;
    fromStopOrder: number;
    toStopOrder: number;
    seats: SeatInfo[];
    availableCount: number;
}
export interface BulkResult {
    created: number;
    totalAmount: number;
    currency: string;
    reservations: ReservationEntity[];
}
export declare class ReservationsService {
    private readonly reservationRepo;
    private readonly scheduleRepo;
    private readonly stopRepo;
    private readonly priceRepo;
    private readonly paymentRepo;
    private readonly dataSource;
    private readonly ticketsService;
    private readonly logger;
    constructor(reservationRepo: Repository<ReservationEntity>, scheduleRepo: Repository<ScheduleEntity>, stopRepo: Repository<RouteStopEntity>, priceRepo: Repository<SegmentPriceEntity>, paymentRepo: Repository<PaymentEntity>, dataSource: DataSource, ticketsService: TicketsService);
    getSeatMap(companyId: string, scheduleId: string, fromStopOrder: number, toStopOrder: number): Promise<SeatMapResult>;
    getAvailableSeatsMap(companyId: string, scheduleIds: string[]): Promise<Record<string, number>>;
    private validateSaleContext;
    private checkSeatAvailability;
    create(companyId: string, dto: CreateReservationDto, soldByUserId: string): Promise<ReservationEntity>;
    createBulk(companyId: string, dto: CreateBulkReservationsDto, soldByUserId: string): Promise<BulkResult>;
    findAll(companyId: string, filters?: {
        scheduleId?: string;
        date?: string;
        status?: ReservationStatus;
        search?: string;
    }): Promise<ReservationEntity[]>;
    findOne(companyId: string, id: string): Promise<ReservationEntity>;
    findByReference(companyId: string, reference: string): Promise<ReservationEntity>;
    cancel(companyId: string, id: string): Promise<{
        message: string;
        reference: string;
    }>;
}
