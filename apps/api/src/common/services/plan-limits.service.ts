// apps/api/src/common/services/plan-limits.service.ts
//
// Service centralisé de vérification des quotas de plan.
// Utilisé par BusesService, AgenciesService, UsersService
// pour bloquer toute création dépassant les limites du tenant.
//
// Design : injection légère, aucune dépendance circulaire.
// On interroge directement TypeORM via DataSource pour rester
// indépendant des services métier (évite le circular DI).

import {
  Injectable,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SubscriptionEntity } from '../../plans/entities/subscription.entity';
import { SubscriptionPlanEntity } from '../../plans/entities/subscription-plan.entity';
import { BusEntity } from '../../buses/entities/bus.entity';
import { AgencyEntity } from '../../agencies/entities/agency.entity';
import { UserEntity } from '../../auth/entities/user.entity';
import { SubscriptionStatus } from '../../shared/types';

export type ResourceType = 'buses' | 'agencies' | 'users';

export interface QuotaInfo {
  current: number;
  max: number;
  remaining: number;
  limitReached: boolean;
  planName: string;
}

export interface TenantQuotas {
  buses: QuotaInfo;
  agencies: QuotaInfo;
  users: QuotaInfo;
}

@Injectable()
export class PlanLimitsService {
  private readonly logger = new Logger(PlanLimitsService.name);

  constructor(private readonly dataSource: DataSource) {}

  // ─── Point d'entrée principal ──────────────────────────────
  // Appeler avant chaque création de ressource limitée.
  // Lève ForbiddenException (403) si la limite est atteinte.

  async assertCanCreate(companyId: string, resource: ResourceType): Promise<void> {
    const quota = await this.getQuota(companyId, resource);

    if (quota.limitReached) {
      const labels: Record<ResourceType, string> = {
        buses:    'bus',
        agencies: 'agence',
        users:    'utilisateur',
      };
      const label = labels[resource];

      this.logger.warn(
        `[PlanLimits] Tenant ${companyId} a atteint la limite ${resource}: ` +
        `${quota.current}/${quota.max} (plan: ${quota.planName})`,
      );

      throw new ForbiddenException({
        code:     'PLAN_LIMIT_REACHED',
        resource,
        current:  quota.current,
        max:      quota.max,
        planName: quota.planName,
        message:
          `Limite atteinte : votre plan "${quota.planName}" autorise ` +
          `${quota.max === -1 ? 'illimité' : quota.max} ${label}(s). ` +
          `Vous en avez déjà ${quota.current}. ` +
          `Passez à un plan supérieur pour continuer.`,
      });
    }
  }

  // ─── Lecture des quotas pour un tenant ────────────────────
  // Utilisé par GET /companies/:id/quotas côté dashboard admin.

  async getTenantQuotas(companyId: string): Promise<TenantQuotas> {
    const [buses, agencies, users] = await Promise.all([
      this.getQuota(companyId, 'buses'),
      this.getQuota(companyId, 'agencies'),
      this.getQuota(companyId, 'users'),
    ]);
    return { buses, agencies, users };
  }

  // ─── Calcul d'un quota individuel ─────────────────────────
  // Convention : max = -1 signifie "illimité" (plan Enterprise)

  private async getQuota(companyId: string, resource: ResourceType): Promise<QuotaInfo> {
    const plan = await this.getActivePlan(companyId);

    const maxMap: Record<ResourceType, number> = {
      buses:    plan.maxBuses,
      agencies: plan.maxAgencies,
      users:    plan.maxUsers,
    };
    const max = maxMap[resource];
    const isUnlimited = max === -1;

    const current = await this.countResource(companyId, resource);

    return {
      current,
      max,
      remaining:    isUnlimited ? -1 : Math.max(0, max - current),
      limitReached: isUnlimited ? false : current >= max,
      planName:     plan.name,
    };
  }

  // ─── Récupère le plan actif du tenant ─────────────────────

  private async getActivePlan(companyId: string): Promise<SubscriptionPlanEntity> {
    const sub = await this.dataSource
      .getRepository(SubscriptionEntity)
      .findOne({
        where: { companyId, status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
        order: { startDate: 'DESC' },
      });

    if (!sub?.plan) {
      // Tenant sans abonnement actif → quota zéro sur tout
      // (ne devrait pas arriver en prod, mais on protège)
      this.logger.error(`Tenant ${companyId} n'a pas de plan actif !`);
      throw new ForbiddenException({
        code:    'NO_ACTIVE_PLAN',
        message: "Votre abonnement est inactif ou expiré. Contactez l'administrateur.",
      });
    }

    return sub.plan;
  }

  // ─── Compte les ressources actuelles du tenant ─────────────

  private async countResource(companyId: string, resource: ResourceType): Promise<number> {
    switch (resource) {
      case 'buses':
        return this.dataSource
          .getRepository(BusEntity)
          .count({ where: { companyId } });

      case 'agencies':
        return this.dataSource
          .getRepository(AgencyEntity)
          .count({ where: { companyId } });

      case 'users':
        return this.dataSource
          .getRepository(UserEntity)
          .count({ where: { companyId } });
    }
  }
}
