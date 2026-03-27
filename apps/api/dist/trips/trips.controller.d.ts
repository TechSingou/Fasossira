import { TripsService } from './trips.service';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';
export declare class TripsController {
    private readonly tripsService;
    constructor(tripsService: TripsService);
    findAll(companyId: string): Promise<import("./entities/trip.entity").TripEntity[]>;
    findOne(companyId: string, id: string): Promise<import("./entities/trip.entity").TripEntity>;
    create(companyId: string, dto: CreateTripDto): Promise<import("./entities/trip.entity").TripEntity>;
    update(companyId: string, id: string, dto: UpdateTripDto): Promise<import("./entities/trip.entity").TripEntity>;
    remove(companyId: string, id: string): Promise<{
        message: string;
    }>;
}
