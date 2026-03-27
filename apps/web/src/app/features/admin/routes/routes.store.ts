// apps/web/src/app/features/admin/routes/routes.store.ts
import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { RoutesApiService, Route, RouteStop, SegmentPrice, SegmentPricePayload } from './services/routes.service';

interface RoutesState {
  routes: Route[];
  selectedRoute: Route | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive';
}

const initial: RoutesState = {
  routes: [],
  selectedRoute: null,
  loading: false,
  saving: false,
  error: null,
  successMessage: null,
  searchQuery: '',
  statusFilter: 'all',
};

export const RoutesStore = signalStore(
  { providedIn: 'root' },
  withState<RoutesState>(initial),

  withComputed(({ routes, selectedRoute, searchQuery, statusFilter }) => ({

    activeRoutes: computed(() => routes().filter((r) => r.isActive)),

    filteredRoutes: computed(() => {
      const q = searchQuery().toLowerCase().trim();
      const status = statusFilter();
      return routes().filter((route) => {
        if (status === 'active' && !route.isActive) return false;
        if (status === 'inactive' && route.isActive) return false;
        if (!q) return true;
        const inName = route.name.toLowerCase().includes(q);
        const inStops = (route.stops ?? []).some((s) =>
          s.cityName.toLowerCase().includes(q)
        );
        return inName || inStops;
      });
    }),

    hasActiveFilter: computed(() =>
      searchQuery().trim() !== '' || statusFilter() !== 'all'
    ),

    stopsOrdered: computed(() =>
      (selectedRoute()?.stops ?? []).slice().sort((a, b) => a.order - b.order),
    ),

    possibleSegments: computed(() => {
      const stops = (selectedRoute()?.stops ?? []).slice().sort((a, b) => a.order - b.order);
      const segments: Array<{ from: RouteStop; to: RouteStop; label: string }> = [];
      for (let i = 0; i < stops.length; i++) {
        for (let j = i + 1; j < stops.length; j++) {
          segments.push({
            from: stops[i],
            to: stops[j],
            label: `${stops[i].cityName} → ${stops[j].cityName}`,
          });
        }
      }
      return segments;
    }),
  })),

  withMethods((store, api = inject(RoutesApiService)) => ({

    async loadRoutes(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const routes = await firstValueFrom(api.getAll());
        patchState(store, { routes, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'Impossible de charger les routes' });
      }
    },

    async selectRoute(id: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const route = await firstValueFrom(api.getOne(id));
        patchState(store, { selectedRoute: route, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'Route introuvable' });
      }
    },

    async createRoute(name: string, description: string): Promise<Route | null> {
      patchState(store, { saving: true, error: null });
      try {
        const route = await firstValueFrom(api.create({ name, description }));
        patchState(store, {
          routes: [route, ...store.routes()],
          saving: false,
          successMessage: `Route "${route.name}" créée`,
        });
        return route;
      } catch {
        patchState(store, { saving: false, error: 'Erreur lors de la création' });
        return null;
      }
    },

    // ← nouveau : toggle actif/inactif avec rollback si erreur
    async toggleActive(routeId: string): Promise<void> {
      const route = store.routes().find((r) => r.id === routeId);
      if (!route) return;

      const newStatus = !route.isActive;

      // Mise à jour optimiste immédiate
      patchState(store, {
        routes: store.routes().map((r) =>
          r.id === routeId ? { ...r, isActive: newStatus } : r
        ),
      });

      try {
        await firstValueFrom(api.update(routeId, { isActive: newStatus }));
        patchState(store, {
          successMessage: newStatus ? 'Route activée' : 'Route désactivée',
        });
      } catch {
        // Rollback si l'API échoue
        patchState(store, {
          routes: store.routes().map((r) =>
            r.id === routeId ? { ...r, isActive: !newStatus } : r
          ),
          error: 'Impossible de modifier le statut',
        });
      }
    },

    async saveStops(routeId: string, stops: RouteStop[]): Promise<void> {
      patchState(store, { saving: true, error: null });
      try {
        const payload = stops.map(({ cityName, order, distanceFromStart }) => ({
          cityName,
          order,
          distanceFromStart: distanceFromStart ?? 0,
        }));
        await firstValueFrom(api.updateStops(routeId, payload));
        const updated = await firstValueFrom(api.getOne(routeId));
        patchState(store, {
          selectedRoute: updated,
          routes: store.routes().map((r) => (r.id === routeId ? updated : r)),
          saving: false,
          successMessage: 'Arrêts sauvegardés',
        });
      } catch {
        patchState(store, { saving: false, error: 'Erreur lors de la sauvegarde des arrêts' });
      }
    },

    async saveSegmentPrices(routeId: string, prices: SegmentPricePayload[]): Promise<void> {
      patchState(store, { saving: true, error: null });
      try {
        await firstValueFrom(api.saveSegmentPrices(routeId, prices));
        const updated = await firstValueFrom(api.getOne(routeId));
        patchState(store, {
          selectedRoute: updated,
          saving: false,
          successMessage: 'Grille de prix sauvegardée',
        });
      } catch (err: any) {
        const msg = err?.error?.message
          || (Array.isArray(err?.error?.message) ? err.error.message.join(', ') : null)
          || 'Erreur lors de la sauvegarde des prix';
        patchState(store, { saving: false, error: msg });
      }
    },

    async deleteRoute(routeId: string): Promise<void> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(api.delete(routeId));
        patchState(store, {
          routes: store.routes().filter((r) => r.id !== routeId),
          selectedRoute: null,
          saving: false,
          successMessage: 'Route supprimée',
        });
      } catch {
        patchState(store, { saving: false, error: 'Impossible de supprimer cette route' });
      }
    },

    setSearchQuery(q: string): void {
      patchState(store, { searchQuery: q });
    },

    setStatusFilter(status: 'all' | 'active' | 'inactive'): void {
      patchState(store, { statusFilter: status });
    },

    resetFilters(): void {
      patchState(store, { searchQuery: '', statusFilter: 'all' });
    },

    clearMessages(): void {
      patchState(store, { error: null, successMessage: null });
    },
  })),
);