import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto, GenerateSchedulesDto } from './dto/schedule.dto';
import { ScheduleStatus } from './entities/schedule.entity';
export declare class SchedulesController {
    private readonly schedulesService;
    constructor(schedulesService: SchedulesService);
    getPlanning(companyId: string, date?: string): Promise<{
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
    findAll(companyId: string, date?: string, routeId?: string, busId?: string, status?: ScheduleStatus): Promise<import("./entities/schedule.entity").ScheduleEntity[]>;
    findAvailableBuses(companyId: string, tripId: string, date: string): Promise<import("../buses/entities/bus.entity").BusEntity[]>;
    findOne(companyId: string, id: string): Promise<import("./entities/schedule.entity").ScheduleEntity>;
    create(companyId: string, dto: CreateScheduleDto): Promise<import("./entities/schedule.entity").ScheduleEntity>;
    generate(companyId: string, dto: GenerateSchedulesDto): Promise<import("./schedules.service").GenerateResult>;
    update(companyId: string, id: string, dto: UpdateScheduleDto): Promise<import("./entities/schedule.entity").ScheduleEntity>;
    remove(companyId: string, id: string): Promise<{
        message: string;
    }>;
}
