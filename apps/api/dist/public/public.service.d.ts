import { Repository, DataSource } from 'typeorm';
import { CompanyEntity } from '../companies/entities/company.entity';
import { CompanySettingsEntity } from '../companies/entities/company-settings.entity';
import { ScheduleEntity, ScheduleStatus } from '../schedules/entities/schedule.entity';
import { ReservationEntity } from '../reservations/entities/reservation.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { SegmentPriceEntity } from '../routes/entities/segment-price.entity';
import { TicketsService } from '../tickets/tickets.service';
import { PublicReservationDto } from './dto/public-reservation.dto';
import { ReservationStatus } from '../shared/types';
interface SearchParams {
    date: string;
    fromStop?: string;
    toStop?: string;
    companySlug?: string;
}
export declare class PublicService {
    private readonly companyRepo;
    private readonly settingsRepo;
    private readonly scheduleRepo;
    private readonly reservationRepo;
    private readonly paymentRepo;
    private readonly segmentPriceRepo;
    private readonly ticketsService;
    private readonly dataSource;
    constructor(companyRepo: Repository<CompanyEntity>, settingsRepo: Repository<CompanySettingsEntity>, scheduleRepo: Repository<ScheduleEntity>, reservationRepo: Repository<ReservationEntity>, paymentRepo: Repository<PaymentEntity>, segmentPriceRepo: Repository<SegmentPriceEntity>, ticketsService: TicketsService, dataSource: DataSource);
    search({ date, fromStop, toStop, companySlug }: SearchParams): Promise<{
        scheduleId: string;
        date: string;
        departureDateTime: Date;
        arrivalDateTime: Date;
        status: ScheduleStatus;
        totalSeats: number;
        availableSeats: number;
        company: {
            id: string;
            name: string;
            slug: string;
            city: string;
            primaryColor: string;
            logoUrl: string;
        };
        trip: {
            departureTime: string;
            arrivalTime: string;
            route: {
                id: string;
                name: string;
                stops: {
                    id: string;
                    order: number;
                    cityName: string;
                }[];
            };
        };
        bus: {
            plate: string;
            capacity: number;
        };
    }[]>;
    getSeatMap(scheduleId: string, fromStopOrder: number, toStopOrder: number): Promise<{
        scheduleId: string;
        totalSeats: number;
        fromStopOrder: number;
        toStopOrder: number;
        seats: {
            seatNumber: number;
            status: string;
        }[];
        availableCount: number;
    }>;
    createReservation(dto: PublicReservationDto): Promise<{
        count: number;
        totalAmount: number;
        currency: string;
        fromCityName: string;
        toCityName: string;
        reservations: {
            reference: string;
            passengerName: string;
            passengerPhone: string;
            seatNumber: number;
            amount: number;
            currency: string;
            status: ReservationStatus;
            createdAt: Date;
        }[];
    }>;
    getTicket(reference: string, phone: string): Promise<{
        reference: string;
        passengerName: string;
        passengerPhone: string;
        seatNumber: number;
        fromCityName: string;
        toCityName: string;
        departureDateTime: Date;
        arrivalDateTime: Date;
        busPlate: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        status: ReservationStatus;
        createdAt: Date;
        company: {
            name: string;
            primaryColor: string;
            logoUrl: string;
        };
    }>;
}
export {};
