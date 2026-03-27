"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RoutesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const route_entity_1 = require("./entities/route.entity");
const route_stop_entity_1 = require("./entities/route-stop.entity");
const segment_price_entity_1 = require("./entities/segment-price.entity");
let RoutesService = RoutesService_1 = class RoutesService {
    constructor(routeRepo, stopRepo, priceRepo, dataSource) {
        this.routeRepo = routeRepo;
        this.stopRepo = stopRepo;
        this.priceRepo = priceRepo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(RoutesService_1.name);
    }
    async findAll(companyId) {
        return this.routeRepo.find({
            where: { companyId },
            relations: ['stops', 'segmentPrices'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(companyId, routeId) {
        const route = await this.routeRepo.findOne({
            where: { id: routeId, companyId },
            relations: ['stops', 'segmentPrices'],
        });
        if (!route)
            throw new common_1.NotFoundException('Route introuvable');
        route.stops = route.stops.sort((a, b) => a.order - b.order);
        return route;
    }
    async create(companyId, dto) {
        const route = this.routeRepo.create({
            companyId,
            name: dto.name,
            description: dto.description || '',
            isActive: true,
        });
        const saved = await this.routeRepo.save(route);
        this.logger.log(`Route créée : ${saved.name} (${companyId})`);
        return saved;
    }
    async update(companyId, routeId, dto) {
        const route = await this.findOne(companyId, routeId);
        Object.assign(route, dto);
        return this.routeRepo.save(route);
    }
    async remove(companyId, routeId) {
        const route = await this.findOne(companyId, routeId);
        await this.routeRepo.remove(route);
        return { message: 'Route supprimée' };
    }
    async updateStops(companyId, routeId, dto) {
        await this.findOne(companyId, routeId);
        const orders = dto.stops.map((s) => s.order).sort((a, b) => a - b);
        const hasDuplicates = orders.length !== new Set(orders).size;
        if (hasDuplicates) {
            throw new common_1.BadRequestException('Les numéros d\'ordre doivent être uniques');
        }
        return this.dataSource.transaction(async (manager) => {
            await manager.delete(route_stop_entity_1.RouteStopEntity, { routeId });
            const stops = dto.stops.map((s) => manager.create(route_stop_entity_1.RouteStopEntity, {
                companyId,
                routeId,
                cityName: s.cityName,
                order: s.order,
                distanceFromStart: s.distanceFromStart ?? 0,
            }));
            const savedStops = await manager.save(stops);
            const newOrders = new Set(dto.stops.map((s) => s.order));
            const allPrices = await manager.find(segment_price_entity_1.SegmentPriceEntity, { where: { routeId } });
            const orphanIds = allPrices
                .filter((p) => !newOrders.has(p.fromStopOrder) || !newOrders.has(p.toStopOrder))
                .map((p) => p.id);
            if (orphanIds.length > 0) {
                await manager.delete(segment_price_entity_1.SegmentPriceEntity, orphanIds);
            }
            this.logger.log(`Arrêts mis à jour : ${stops.map((s) => s.cityName).join(' → ')} | ` +
                `Prix : ${orphanIds.length} supprimé(s), ${allPrices.length - orphanIds.length} conservé(s)`);
            return savedStops.sort((a, b) => a.order - b.order);
        });
    }
    async getSegmentPrices(companyId, routeId) {
        await this.findOne(companyId, routeId);
        return this.priceRepo.find({
            where: { routeId, companyId },
            order: { fromStopOrder: 'ASC', toStopOrder: 'ASC' },
        });
    }
    async bulkUpsertSegmentPrices(companyId, routeId, dto) {
        const route = await this.findOne(companyId, routeId);
        const validOrders = new Set(route.stops.map((s) => s.order));
        for (const price of dto.prices) {
            if (!validOrders.has(price.fromStopOrder)) {
                throw new common_1.BadRequestException(`fromStopOrder ${price.fromStopOrder} n'existe pas dans les arrêts de cette route`);
            }
            if (!validOrders.has(price.toStopOrder)) {
                throw new common_1.BadRequestException(`toStopOrder ${price.toStopOrder} n'existe pas dans les arrêts de cette route`);
            }
            if (price.fromStopOrder >= price.toStopOrder) {
                throw new common_1.BadRequestException(`fromStopOrder (${price.fromStopOrder}) doit être inférieur à toStopOrder (${price.toStopOrder})`);
            }
        }
        return this.dataSource.transaction(async (manager) => {
            const results = [];
            for (const p of dto.prices) {
                await manager.upsert(segment_price_entity_1.SegmentPriceEntity, {
                    companyId,
                    routeId,
                    fromStopOrder: p.fromStopOrder,
                    toStopOrder: p.toStopOrder,
                    price: p.price,
                    currency: 'XOF',
                }, ['routeId', 'fromStopOrder', 'toStopOrder']);
            }
            const saved = await manager.find(segment_price_entity_1.SegmentPriceEntity, {
                where: { routeId, companyId },
                order: { fromStopOrder: 'ASC', toStopOrder: 'ASC' },
            });
            return saved;
        });
    }
    async getPrice(companyId, routeId, fromStopOrder, toStopOrder) {
        const price = await this.priceRepo.findOne({
            where: { companyId, routeId, fromStopOrder, toStopOrder },
        });
        if (!price) {
            throw new common_1.NotFoundException(`Aucun prix défini pour le segment ${fromStopOrder} → ${toStopOrder}`);
        }
        return Number(price.price);
    }
    generateAllSegmentCombinations(stopCount) {
        const combinations = [];
        for (let from = 1; from <= stopCount; from++) {
            for (let to = from + 1; to <= stopCount; to++) {
                combinations.push({ from, to });
            }
        }
        return combinations;
    }
};
exports.RoutesService = RoutesService;
exports.RoutesService = RoutesService = RoutesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(route_entity_1.RouteEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(route_stop_entity_1.RouteStopEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(segment_price_entity_1.SegmentPriceEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], RoutesService);
//# sourceMappingURL=routes.service.js.map