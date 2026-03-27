// apps/web/src/app/core/stores/quotas.store.ts
//
// Store NgRx Signal partagé pour les quotas du tenant.
// Fourni en root : un seul chargement pour toute l'app admin.
//
// Utilisation dans un composant :
//   private quotas = inject(QuotasStore);
//   canAddBus = this.quotas.buses.limitReached;  // Signal<boolean>

import { inject, computed } from '@angular/core';
import {
  signalStore, withState, withMethods, withComputed, patchState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { QuotasApiService, TenantQuotas, QuotaInfo } from '../services/quotas.service';

interface QuotasState {
  quotas:   TenantQuotas | null;
  loading:  boolean;
  error:    string | null;
  lastLoad: number | null; // timestamp ms pour éviter rechargements inutiles
}

const initial: QuotasState = {
  quotas:   null,
  loading:  false,
  error:    null,
  lastLoad: null,
};

// Durée de cache en ms avant de refetch (30 secondes)
const CACHE_TTL_MS = 30_000;

const emptyQuota: QuotaInfo = {
  current: 0, max: 0, remaining: 0, limitReached: false, planName: '',
};

export const QuotasStore = signalStore(
  { providedIn: 'root' },
  withState<QuotasState>(initial),

  withComputed(({ quotas }) => ({
    // Accès direct aux 3 quotas avec fallback safe
    busesQuota:    computed((): QuotaInfo => quotas()?.buses    ?? emptyQuota),
    agenciesQuota: computed((): QuotaInfo => quotas()?.agencies ?? emptyQuota),
    usersQuota:    computed((): QuotaInfo => quotas()?.users    ?? emptyQuota),

    // Booléens pratiques pour les templates
    canAddBus:    computed(() => !(quotas()?.buses?.limitReached    ?? false)),
    canAddAgency: computed(() => !(quotas()?.agencies?.limitReached ?? false)),
    canAddUser:   computed(() => !(quotas()?.users?.limitReached    ?? false)),

    // Indicateur global : au moins une limite atteinte
    hasAnyLimitReached: computed(() =>
      (quotas()?.buses?.limitReached    ?? false) ||
      (quotas()?.agencies?.limitReached ?? false) ||
      (quotas()?.users?.limitReached    ?? false)
    ),

    // Nom du plan pour l'affichage
    planName: computed(() =>
      quotas()?.buses?.planName ?? quotas()?.agencies?.planName ?? ''
    ),
  })),

  withMethods((store, api = inject(QuotasApiService)) => ({

    // ── Charger avec cache court (appelé à l'init de chaque feature) ──
    async loadQuotas(forceRefresh = false): Promise<void> {
      const lastLoad = store.lastLoad();
      const cacheValid = lastLoad && (Date.now() - lastLoad) < CACHE_TTL_MS;

      if (cacheValid && !forceRefresh) return;

      patchState(store, { loading: true, error: null });
      try {
        const quotas = await firstValueFrom(api.getMyQuotas());
        patchState(store, { quotas, loading: false, lastLoad: Date.now() });
      } catch {
        patchState(store, {
          loading: false,
          error: 'Impossible de charger les quotas du plan',
        });
      }
    },

    // ── Forcer un refresh après une création/suppression de ressource ──
    async refresh(): Promise<void> {
      patchState(store, { lastLoad: null });
      const api_ = api; // closure
      patchState(store, { loading: true, error: null });
      try {
        const quotas = await firstValueFrom(api_.getMyQuotas());
        patchState(store, { quotas, loading: false, lastLoad: Date.now() });
      } catch {
        patchState(store, { loading: false });
      }
    },
  })),
);
