// apps/web/src/app/features/super-admin/tenants/tenants.store.ts
import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import {
  TenantsService, Tenant, SubscriptionPlan, GlobalStats, PlanStats, CreateTenantPayload,
} from '../services/tenants.service';

// ─── State ────────────────────────────────────────────────────

interface TenantsState {
  // Données
  tenants:      Tenant[];
  plans:        SubscriptionPlan[];   // plans actifs pour les dropdowns
  allPlans:     SubscriptionPlan[];   // tous les plans pour la gestion
  globalStats:  GlobalStats | null;
  planStats:    PlanStats | null;
  // UI
  loading:         boolean;
  saving:          boolean;
  error:           string | null;
  successMessage:  string | null;
  // Filtres
  searchQuery:  string;
  statusFilter: 'ALL' | 'ACTIVE' | 'SUSPENDED';
  planFilter:   string;               // planId | ''
  // Post-création
  lastCreatedPassword: string | null;
}

const initial: TenantsState = {
  tenants: [], plans: [], allPlans: [], globalStats: null, planStats: null,
  loading: false, saving: false, error: null, successMessage: null,
  searchQuery: '', statusFilter: 'ALL', planFilter: '',
  lastCreatedPassword: null,
};

// ─── Store ────────────────────────────────────────────────────

export const TenantsStore = signalStore(
  { providedIn: 'root' },
  withState<TenantsState>(initial),

  withComputed(({ tenants, searchQuery, statusFilter, planFilter }) => ({

    filteredTenants: computed(() => {
      let list = tenants();
      const q      = searchQuery().trim().toLowerCase();
      const status = statusFilter();
      const plan   = planFilter();

      if (status === 'ACTIVE')    list = list.filter((t) => t.isActive);
      if (status === 'SUSPENDED') list = list.filter((t) => !t.isActive);
      if (plan)                   list = list.filter((t) => t.activePlan?.id === plan);
      if (q) list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q),
      );
      return list;
    }),

    countByStatus: computed(() => ({
      ALL:       tenants().length,
      ACTIVE:    tenants().filter((t) => t.isActive).length,
      SUSPENDED: tenants().filter((t) => !t.isActive).length,
    })),

    hasActiveFilter: computed(() =>
      searchQuery().trim() !== '' ||
      statusFilter() !== 'ALL'   ||
      planFilter()   !== '',
    ),

    // Tenants triés par date décroissante pour le dashboard
    recentTenants: computed(() =>
      [...tenants()]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    ),
  })),

  withMethods((store, svc = inject(TenantsService)) => ({

    // ── Chargement initial en parallèle ────────────────────────
    async loadAll(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const [tenants, plans, allPlans, globalStats, planStats] = await Promise.all([
          firstValueFrom(svc.getAll()),
          firstValueFrom(svc.getActivePlans()),
          firstValueFrom(svc.getPlans()),
          firstValueFrom(svc.getGlobalStats()),
          firstValueFrom(svc.getPlanStats()),
        ]);
        patchState(store, { tenants, plans, allPlans, globalStats, planStats });
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? 'Erreur de chargement' });
      } finally {
        patchState(store, { loading: false });
      }
    },

    // ── Créer un tenant ─────────────────────────────────────────
    async createTenant(payload: CreateTenantPayload): Promise<boolean> {
      patchState(store, { saving: true, error: null });
      try {
        const { company, tempPassword } = await firstValueFrom(svc.create(payload));
        patchState(store, {
          tenants: [company, ...store.tenants()],
          lastCreatedPassword: tempPassword,
          successMessage: `Tenant "${company.name}" créé avec succès`,
        });
        return true;
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? 'Erreur lors de la création' });
        return false;
      } finally {
        patchState(store, { saving: false });
      }
    },

    // ── Suspendre / réactiver ───────────────────────────────────
    async toggleTenant(tenant: Tenant): Promise<void> {
      patchState(store, { saving: true, error: null });
      try {
        const updated = await firstValueFrom(
          tenant.isActive ? svc.suspend(tenant.id) : svc.activate(tenant.id),
        );
        patchState(store, {
          tenants: store.tenants().map((t) =>
            t.id === updated.id ? { ...t, isActive: updated.isActive } : t,
          ),
          successMessage: tenant.isActive
            ? `"${tenant.name}" suspendu`
            : `"${tenant.name}" réactivé`,
        });
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? 'Erreur' });
      } finally {
        patchState(store, { saving: false });
      }
    },

    // ── Changer le plan ─────────────────────────────────────────
    async assignPlan(tenant: Tenant, planId: string): Promise<boolean> {
      patchState(store, { saving: true, error: null });
      try {
        await firstValueFrom(svc.assignPlan(tenant.id, planId));
        // Recharger ce tenant pour avoir les relations à jour
        const refreshed = await firstValueFrom(svc.getOne(tenant.id));
        patchState(store, {
          tenants: store.tenants().map((t) => t.id === refreshed.id ? refreshed : t),
          successMessage: `Plan mis à jour pour "${tenant.name}"`,
        });
        return true;
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? 'Erreur changement de plan' });
        return false;
      } finally {
        patchState(store, { saving: false });
      }
    },

    // ── Toggle plan (activer/désactiver) ────────────────────────
    async togglePlan(plan: SubscriptionPlan): Promise<void> {
      patchState(store, { saving: true, error: null });
      try {
        const updated = await firstValueFrom(svc.togglePlan(plan.id));
        patchState(store, {
          allPlans: store.allPlans().map((p) => p.id === updated.id ? updated : p),
          successMessage: `Plan "${updated.name}" ${updated.isActive ? 'activé' : 'désactivé'}`,
        });
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? 'Erreur' });
      } finally {
        patchState(store, { saving: false });
      }
    },

    // ── Filtres ─────────────────────────────────────────────────
    setSearch(q: string): void   { patchState(store, { searchQuery: q }); },
    setStatusFilter(s: 'ALL' | 'ACTIVE' | 'SUSPENDED'): void {
      patchState(store, { statusFilter: s });
    },
    setPlanFilter(p: string): void { patchState(store, { planFilter: p }); },
    resetFilters(): void {
      patchState(store, { searchQuery: '', statusFilter: 'ALL', planFilter: '' });
    },

    // ── Notifications ───────────────────────────────────────────
    clearSuccess(): void { patchState(store, { successMessage: null, lastCreatedPassword: null }); },
    clearError():   void { patchState(store, { error: null }); },
  })),
);
