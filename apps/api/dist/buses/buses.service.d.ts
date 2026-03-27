import { DataSource, Repository } from 'typeorm';
import { BusEntity, BusStatus } from './entities/bus.entity';
import { CreateBusDto, UpdateBusDto } from './dto/bus.dto';
import { PlanLimitsService } from '../common/services/plan-limits.service';
export declare class BusesService {
    private readonly busRepo;
    private readonly dataSource;
    private readonly planLimits;
    private readonly logger;
    constructor(busRepo: Repository<BusEntity>, dataSource: DataSource, planLimits: PlanLimitsService);
    findAll(companyId: string, statusFilter?: BusStatus): Promise<BusEntity[]>;
    findOne(companyId: string, id: string): Promise<BusEntity>;
    findAvailable(companyId: string, departureDateTime: Date, arrivalDateTime: Date): Promise<BusEntity[]>;
    create(companyId: string, dto: CreateBusDto): Promise<BusEntity>;
    update(companyId: string, id: string, dto: UpdateBusDto): Promise<BusEntity>;
    remove(companyId: string, id: string): Promise<{
        message: string;
    }>;
}
