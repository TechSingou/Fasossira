import { ReservationsService } from './reservations.service';
import { CreateReservationDto, CreateBulkReservationsDto, CancelReservationDto } from './dto/reservation.dto';
import { JwtPayload, ReservationStatus } from '../shared/types';
export declare class ReservationsController {
    private readonly reservationsService;
    constructor(reservationsService: ReservationsService);
    getSeatMap(companyId: string, scheduleId: string, from: number, to: number): Promise<import("./reservations.service").SeatMapResult>;
    findAll(companyId: string, scheduleId?: string, date?: string, status?: ReservationStatus, search?: string): Promise<import("./entities/reservation.entity").ReservationEntity[]>;
    create(companyId: string, user: JwtPayload, dto: CreateReservationDto): Promise<import("./entities/reservation.entity").ReservationEntity>;
    createBulk(companyId: string, user: JwtPayload, dto: CreateBulkReservationsDto): Promise<import("./reservations.service").BulkResult>;
    findOne(companyId: string, id: string): Promise<import("./entities/reservation.entity").ReservationEntity>;
    cancel(companyId: string, id: string, _dto: CancelReservationDto): Promise<{
        message: string;
        reference: string;
    }>;
}
