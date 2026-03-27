// apps/api/src/plans/plans.service.ts
import {
  Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlanEntity } from './entities/subscription-plan.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { SubscriptionStatus } from '../shared/types';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

// ─── Types retour publics ─────────────────────────────────────

export interface PlanStats {
  mrr: number;
  totalActiveSubs: number;
  byPlan: Array<{
    planId: string;
    planName: string;
    price: number;
    count: number;
    revenue: number;
  }>;
}

// ─── Service ──────────────────────────────────────────────────

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepo: Repository<SubscriptionPlanEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subRepo: Repository<SubscriptionEntity>,
  ) {}

  // ── Lister tous les plans ─────────────────────────────────────
  async findAll(): Promise<SubscriptionPlanEntity[]> {
    return this.planRepo.find({ order: { price: 'ASC' } });
  }

  // ── Plans actifs seulement (dropdown côté Admin/ADMIN) ─────────
  // Note : route GET /plans/active déclarée AVANT /:id dans le controller
  async findActive(): Promise<SubscriptionPlanEntity[]> {
    return this.planRepo.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  // ── Détail d'un plan ──────────────────────────────────────────
  async findOne(id: string): Promise<SubscriptionPlanEntity> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan introuvable : ${id}`);
    return plan;
  }

  // ── Créer un plan ─────────────────────────────────────────────
  async create(dto: CreatePlanDto): Promise<SubscriptionPlanEntity> {
    const exists = await this.planRepo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException(`Un plan "${dto.name}" existe déjà`);

    const plan = this.planRepo.create({
      name:         dto.name,
      price:        dto.price,
      maxBuses:     dto.maxBuses,
      maxAgencies:  dto.maxAgencies,
      maxUsers:     dto.maxUsers,
      features:     dto.features,
      isActive:     dto.isActive ?? true,
    });
    const saved = await this.planRepo.save(plan);
    this.logger.log(`Plan créé : ${saved.name} (${saved.price} FCFA/mois)`);
    return saved;
  }

  // ── Mettre à jour ─────────────────────────────────────────────
  async update(id: string, dto: UpdatePlanDto): Promise<SubscriptionPlanEntity> {
    const plan = await this.findOne(id);

    if (dto.name && dto.name !== plan.name) {
      const conflict = await this.planRepo.findOne({ where: { name: dto.name } });
      if (conflict) throw new ConflictException(`Un plan "${dto.name}" existe déjà`);
    }

    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  // ── Activer / Désactiver ──────────────────────────────────────
  async toggleActive(id: string): Promise<SubscriptionPlanEntity> {
    const plan = await this.findOne(id);
    plan.isActive = !plan.isActive;
    const saved = await this.planRepo.save(plan);
    this.logger.log(`Plan ${saved.isActive ? 'activé' : 'désactivé'} : ${saved.name}`);
    return saved;
  }

  // ── Stats MRR pour le dashboard SuperAdmin ────────────────────
  async getStats(): Promise<PlanStats> {
    const [plans, activeSubs] = await Promise.all([
      this.planRepo.find({ order: { price: 'ASC' } }),
      this.subRepo.find({
        where: { status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
      }),
    ]);

    const mrr = activeSubs.reduce((sum, s) => sum + Number(s.plan?.price ?? 0), 0);

    const byPlan = plans.map((p) => {
      const planSubs = activeSubs.filter((s) => s.planId === p.id);
      return {
        planId:   p.id,
        planName: p.name,
        price:    Number(p.price),
        count:    planSubs.length,
        revenue:  planSubs.length * Number(p.price),
      };
    });

    return { mrr, totalActiveSubs: activeSubs.length, byPlan };
  }
}
