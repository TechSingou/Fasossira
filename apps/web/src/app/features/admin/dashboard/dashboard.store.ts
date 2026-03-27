// apps/web/src/app/features/admin/dashboard/dashboard.store.ts
import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DashboardDataService, DashboardStats, DashboardQuery, PeriodPreset } from './dashboard.service';

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  selectedPeriod: PeriodPreset;
  customFrom: string;   // 'YYYY-MM-DD'
  customTo: string;     // 'YYYY-MM-DD'
}

const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0];
};

const initialState: DashboardState = {
  stats: null,
  loading: false,
  error: null,
  selectedPeriod: 'today',
  customFrom: daysAgo(7),
  customTo: today(),
};

// ── Helpers format ─────────────────────────────────────────────
const delta = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => ({
    // Deltas % vs période précédente
    revenueDelta:    computed(() => delta(store.stats()?.current.revenue ?? 0,         store.stats()?.previous.revenue ?? 0)),
    ticketsDelta:    computed(() => delta(store.stats()?.current.tickets ?? 0,         store.stats()?.previous.tickets ?? 0)),
    occupancyDelta:  computed(() => delta(store.stats()?.current.occupancyRate ?? 0,   store.stats()?.previous.occupancyRate ?? 0)),
    avgPriceDelta:   computed(() => delta(store.stats()?.current.avgTicketPrice ?? 0,  store.stats()?.previous.avgTicketPrice ?? 0)),

    // Max timeline pour normaliser la barre sparkline
    timelineMax: computed(() => {
      const tl = store.stats()?.revenueTimeline ?? [];
      return Math.max(...tl.map(t => t.revenue), 1);
    }),

    // Total paiements pour les pourcentages
    totalPaymentAmount: computed(() =>
      (store.stats()?.paymentBreakdown ?? []).reduce((s, p) => s + p.amount, 0)
    ),
  })),

  withMethods((store, svc = inject(DashboardDataService)) => ({

    async load(query?: Partial<DashboardQuery>): Promise<void> {
      const period = query?.period ?? store.selectedPeriod();
      const q: DashboardQuery = {
        period,
        from: period === 'custom' ? (query?.from ?? store.customFrom()) : undefined,
        to:   period === 'custom' ? (query?.to   ?? store.customTo())   : undefined,
      };
      patchState(store, { loading: true, error: null, selectedPeriod: period });
      try {
        const stats = await firstValueFrom(svc.getStats(q));
        patchState(store, { stats });
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? 'Erreur de chargement' });
      } finally {
        patchState(store, { loading: false });
      }
    },

    setPeriod(period: PeriodPreset): void {
      patchState(store, { selectedPeriod: period });
    },

    setCustomRange(from: string, to: string): void {
      patchState(store, { customFrom: from, customTo: to });
    },

    reset(): void {
      patchState(store, initialState);
    },
  })),
);
