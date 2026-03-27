import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto, UpdateStopsDto, BulkUpsertSegmentPricesDto } from './dto/routes.dto';
export declare class RoutesController {
    private readonly routesService;
    constructor(routesService: RoutesService);
    findAll(companyId: string): Promise<import("./entities/route.entity").RouteEntity[]>;
    findOne(companyId: string, id: string): Promise<import("./entities/route.entity").RouteEntity>;
    create(companyId: string, dto: CreateRouteDto): Promise<import("./entities/route.entity").RouteEntity>;
    update(companyId: string, id: string, dto: UpdateRouteDto): Promise<import("./entities/route.entity").RouteEntity>;
    remove(companyId: string, id: string): Promise<{
        message: string;
    }>;
    updateStops(companyId: string, id: string, dto: UpdateStopsDto): Promise<import("./entities/route-stop.entity").RouteStopEntity[]>;
    getSegmentPrices(companyId: string, id: string): Promise<import("./entities/segment-price.entity").SegmentPriceEntity[]>;
    bulkUpsertSegmentPrices(companyId: string, id: string, dto: BulkUpsertSegmentPricesDto): Promise<import("./entities/segment-price.entity").SegmentPriceEntity[]>;
}
