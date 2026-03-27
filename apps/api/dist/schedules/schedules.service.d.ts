import { Repository } from 'typeorm';
import { ScheduleEntity, ScheduleStatus } from './entities/schedule.entity';
import { CreateScheduleDto, UpdateScheduleDto, GenerateSchedulesDto } from './dto/schedule.dto';
import { TripsService } from '../trips/trips.service';
import { BusesService } from '../buses/buses.service';
export interface GenerateResult {
    created: number;
    skipped: string[];
    schedules: ScheduleEntity[];
}
export declare class SchedulesService {
    private readonly scheduleRepo;
    private readonly tripsService;
    private readonly busesService;
    private readonly logger;
    constructor(scheduleRepo: Repository<ScheduleEntity>, tripsService: TripsService, busesService: BusesService);
    findAll(companyId: string, filters?: {
        date?: string;
        routeId?: string;
        busId?: string;
        status?: ScheduleStatus;
    }): Promise<ScheduleEntity[]>;
    findForSale(companyId: string, date: string, fromStop?: string, toStop?: string): Promise<{
        id: string;
        date: string;
        departureDateTime: Date;
        arrivalDateTime: Date;
        status: ScheduleStatus;
        totalSeats: number;
        availableSeats: number;
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
    getPlanning(companyId: string, date: string): Promise<{
        id: string;
        date: string;
        departureTime: string;
        arrivalTime: string;
        departureDateTime: Date;
        arrivalDateTime: Date;
        route: string;
        tripId: string;
        bus: {
            id: string;
            plate: string;
            capacity: number;
        };
        totalSeats: number;
        availableSeats: number;
        status: ScheduleStatus;
    }[]>;
    findOne(companyId: string, id: string): Promise<ScheduleEntity>;
    create(companyId: string, dto: CreateScheduleDto): Promise<ScheduleEntity>;
    generate(companyId: string, dto: GenerateSchedulesDto): Promise<GenerateResult>;
    update(companyId: string, id: string, dto: UpdateScheduleDto): Promise<ScheduleEntity>;
    remove(companyId: string, id: string): Promise<{
        message: string;
    }>;
    buildDateTimes(date: string, depTime: string, arrTime: string): {
        departureDateTime: Date;
        arrivalDateTime: Date;
    };
    private checkBusConflict;
    findAvailableBuses(companyId: string, tripId: string, date: string): Promise<import("../buses/entities/bus.entity").BusEntity[]>;
}
