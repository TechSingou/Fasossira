import { Repository } from 'typeorm';
import { TripEntity } from './entities/trip.entity';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';
export declare class TripsService {
    private readonly tripRepo;
    private readonly logger;
    constructor(tripRepo: Repository<TripEntity>);
    findAll(companyId: string): Promise<TripEntity[]>;
    findOne(companyId: string, id: string): Promise<TripEntity>;
    create(companyId: string, dto: CreateTripDto): Promise<TripEntity>;
    update(companyId: string, id: string, dto: UpdateTripDto): Promise<TripEntity>;
    remove(companyId: string, id: string): Promise<{
        message: string;
    }>;
    private validateTimes;
}
