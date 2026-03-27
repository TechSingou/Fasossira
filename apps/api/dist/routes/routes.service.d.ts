import { Repository, DataSource } from 'typeorm';
import { RouteEntity } from './entities/route.entity';
import { RouteStopEntity } from './entities/route-stop.entity';
import { SegmentPriceEntity } from './entities/segment-price.entity';
import { CreateRouteDto, UpdateRouteDto, UpdateStopsDto, BulkUpsertSegmentPricesDto } from './dto/routes.dto';
export declare class RoutesService {
    private readonly routeRepo;
    private readonly stopRepo;
    private readonly priceRepo;
    private readonly dataSource;
    private readonly logger;
    constructor(routeRepo: Repository<RouteEntity>, stopRepo: Repository<RouteStopEntity>, priceRepo: Repository<SegmentPriceEntity>, dataSource: DataSource);
    findAll(companyId: string): Promise<RouteEntity[]>;
    findOne(companyId: string, routeId: string): Promise<RouteEntity>;
    create(companyId: string, dto: CreateRouteDto): Promise<RouteEntity>;
    update(companyId: string, routeId: string, dto: UpdateRouteDto): Promise<RouteEntity>;
    remove(companyId: string, routeId: string): Promise<{
        message: string;
    }>;
    updateStops(companyId: string, routeId: string, dto: UpdateStopsDto): Promise<RouteStopEntity[]>;
    getSegmentPrices(companyId: string, routeId: string): Promise<SegmentPriceEntity[]>;
    bulkUpsertSegmentPrices(companyId: string, routeId: string, dto: BulkUpsertSegmentPricesDto): Promise<SegmentPriceEntity[]>;
    getPrice(companyId: string, routeId: string, fromStopOrder: number, toStopOrder: number): Promise<number>;
    generateAllSegmentCombinations(stopCount: number): Array<{
        from: number;
        to: number;
    }>;
}
