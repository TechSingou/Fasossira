import { BusesService } from './buses.service';
import { CreateBusDto, UpdateBusDto } from './dto/bus.dto';
export declare class BusesController {
    private readonly busesService;
    constructor(busesService: BusesService);
    findAll(companyId: string): Promise<import("./entities/bus.entity").BusEntity[]>;
    findActive(companyId: string): Promise<import("./entities/bus.entity").BusEntity[]>;
    findOne(companyId: string, id: string): Promise<import("./entities/bus.entity").BusEntity>;
    create(companyId: string, dto: CreateBusDto): Promise<import("./entities/bus.entity").BusEntity>;
    update(companyId: string, id: string, dto: UpdateBusDto): Promise<import("./entities/bus.entity").BusEntity>;
    remove(companyId: string, id: string): Promise<{
        message: string;
    }>;
}
