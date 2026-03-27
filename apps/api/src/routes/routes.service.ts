// apps/api/src/routes/routes.service.ts
import {
  Injectable, NotFoundException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RouteEntity } from './entities/route.entity';
import { RouteStopEntity } from './entities/route-stop.entity';
import { SegmentPriceEntity } from './entities/segment-price.entity';
import {
  CreateRouteDto, UpdateRouteDto,
  UpdateStopsDto, BulkUpsertSegmentPricesDto,
} from './dto/routes.dto';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    @InjectRepository(RouteEntity)
    private readonly routeRepo: Repository<RouteEntity>,
    @InjectRepository(RouteStopEntity)
    private readonly stopRepo: Repository<RouteStopEntity>,
    @InjectRepository(SegmentPriceEntity)
    private readonly priceRepo: Repository<SegmentPriceEntity>,
    private readonly dataSource: DataSource,
  ) { }

  // ─── ROUTES CRUD ───────────────────────────────────────────

  async findAll(companyId: string) {
    return this.routeRepo.find({
      where: { companyId },
      relations: ['stops', 'segmentPrices'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(companyId: string, routeId: string) {
    const route = await this.routeRepo.findOne({
      where: { id: routeId, companyId },
      relations: ['stops', 'segmentPrices'],
    });
    if (!route) throw new NotFoundException('Route introuvable');

    route.stops = route.stops.sort((a, b) => a.order - b.order);
    return route;
  }

  async create(companyId: string, dto: CreateRouteDto) {
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

  async update(companyId: string, routeId: string, dto: UpdateRouteDto) {
    const route = await this.findOne(companyId, routeId);
    Object.assign(route, dto);
    return this.routeRepo.save(route);
  }

  async remove(companyId: string, routeId: string) {
    const route = await this.findOne(companyId, routeId);
    await this.routeRepo.remove(route);
    return { message: 'Route supprimée' };
  }

  // ─── ARRÊTS ────────────────────────────────────────────────

  // async updateStops(companyId: string, routeId: string, dto: UpdateStopsDto) {
  //   // Vérifie que la route appartient au tenant
  //   await this.findOne(companyId, routeId);

  //   // Valide les ordres : doivent être uniques
  //   const orders = dto.stops.map((s) => s.order).sort((a, b) => a - b);
  //   const hasDuplicates = orders.length !== new Set(orders).size;
  //   if (hasDuplicates) {
  //     throw new BadRequestException('Les numéros d\'ordre doivent être uniques');
  //   }

  //   // Transaction : supprimer les anciens arrêts et créer les nouveaux
  //   return this.dataSource.transaction(async (manager) => {
  //     await manager.delete(RouteStopEntity, { routeId });

  //     const stops = dto.stops.map((s) =>
  //       manager.create(RouteStopEntity, {
  //         companyId,
  //         routeId,
  //         cityName: s.cityName,
  //         order: s.order,
  //         distanceFromStart: s.distanceFromStart ?? 0,
  //       }),
  //     );
  //     const savedStops = await manager.save(stops);

  //     // Supprimer les prix de segments devenus invalides
  //     await manager.delete(SegmentPriceEntity, { routeId });

  //     this.logger.log(
  //       `Arrêts mis à jour pour route ${routeId} : ${stops.map((s) => s.cityName).join(' → ')}`,
  //     );
  //     return savedStops.sort((a, b) => a.order - b.order);
  //   });
  // }
  async updateStops(companyId: string, routeId: string, dto: UpdateStopsDto) {
    await this.findOne(companyId, routeId);

    const orders = dto.stops.map((s) => s.order).sort((a, b) => a - b);
    const hasDuplicates = orders.length !== new Set(orders).size;
    if (hasDuplicates) {
      throw new BadRequestException('Les numéros d\'ordre doivent être uniques');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Remplacer les arrêts
      await manager.delete(RouteStopEntity, { routeId });

      const stops = dto.stops.map((s) =>
        manager.create(RouteStopEntity, {
          companyId,
          routeId,
          cityName: s.cityName,
          order: s.order,
          distanceFromStart: s.distanceFromStart ?? 0,
        }),
      );
      const savedStops = await manager.save(stops);

      // 2. Supprimer uniquement les prix orphelins (stops supprimés)
      const newOrders = new Set(dto.stops.map((s) => s.order));
      const allPrices = await manager.find(SegmentPriceEntity, { where: { routeId } });
      const orphanIds = allPrices
        .filter((p) => !newOrders.has(p.fromStopOrder) || !newOrders.has(p.toStopOrder))
        .map((p) => p.id);

      if (orphanIds.length > 0) {
        await manager.delete(SegmentPriceEntity, orphanIds);
      }

      this.logger.log(
        `Arrêts mis à jour : ${stops.map((s) => s.cityName).join(' → ')} | ` +
        `Prix : ${orphanIds.length} supprimé(s), ${allPrices.length - orphanIds.length} conservé(s)`,
      );

      return savedStops.sort((a, b) => a.order - b.order);
    });
  }
  // ─── PRIX DE SEGMENTS ──────────────────────────────────────

  async getSegmentPrices(companyId: string, routeId: string) {
    await this.findOne(companyId, routeId);
    return this.priceRepo.find({
      where: { routeId, companyId },
      order: { fromStopOrder: 'ASC', toStopOrder: 'ASC' },
    });
  }

  async bulkUpsertSegmentPrices(
    companyId: string,
    routeId: string,
    dto: BulkUpsertSegmentPricesDto,
  ) {
    const route = await this.findOne(companyId, routeId);

    // Valider que tous les fromStopOrder/toStopOrder existent dans les stops
    const validOrders = new Set(route.stops.map((s) => s.order));
    for (const price of dto.prices) {
      if (!validOrders.has(price.fromStopOrder)) {
        throw new BadRequestException(
          `fromStopOrder ${price.fromStopOrder} n'existe pas dans les arrêts de cette route`,
        );
      }
      if (!validOrders.has(price.toStopOrder)) {
        throw new BadRequestException(
          `toStopOrder ${price.toStopOrder} n'existe pas dans les arrêts de cette route`,
        );
      }
      if (price.fromStopOrder >= price.toStopOrder) {
        throw new BadRequestException(
          `fromStopOrder (${price.fromStopOrder}) doit être inférieur à toStopOrder (${price.toStopOrder})`,
        );
      }
    }

    // ✅ Fix : vrai UPSERT TypeORM en une seule transaction
    // Au lieu de N findOne() + save() séquentiels
    return this.dataSource.transaction(async (manager) => {
      const results: SegmentPriceEntity[] = [];

      for (const p of dto.prices) {
        // upsert() : INSERT ... ON CONFLICT DO UPDATE
        await manager.upsert(
          SegmentPriceEntity,
          {
            companyId,
            routeId,
            fromStopOrder: p.fromStopOrder,
            toStopOrder: p.toStopOrder,
            price: p.price,
            currency: 'XOF',
          },
          // Colonnes qui définissent le conflit (doit matcher l'index unique)
          ['routeId', 'fromStopOrder', 'toStopOrder'],
        );
      }

      // Retourner les prix mis à jour
      const saved = await manager.find(SegmentPriceEntity, {
        where: { routeId, companyId },
        order: { fromStopOrder: 'ASC', toStopOrder: 'ASC' },
      });

      return saved;
    });
  }

  // ─── UTILITAIRE : Obtenir le prix d'un segment ─────────────
  // Utilisé par ReservationsModule (Étape 4)
  async getPrice(
    companyId: string,
    routeId: string,
    fromStopOrder: number,
    toStopOrder: number,
  ): Promise<number> {
    const price = await this.priceRepo.findOne({
      where: { companyId, routeId, fromStopOrder, toStopOrder },
    });
    if (!price) {
      throw new NotFoundException(
        `Aucun prix défini pour le segment ${fromStopOrder} → ${toStopOrder}`,
      );
    }
    return Number(price.price);
  }

  // ─── UTILITAIRE : Générer tous les segments possibles ──────
  generateAllSegmentCombinations(stopCount: number): Array<{ from: number; to: number }> {
    const combinations: Array<{ from: number; to: number }> = [];
    for (let from = 1; from <= stopCount; from++) {
      for (let to = from + 1; to <= stopCount; to++) {
        combinations.push({ from, to });
      }
    }
    return combinations;
  }
}
