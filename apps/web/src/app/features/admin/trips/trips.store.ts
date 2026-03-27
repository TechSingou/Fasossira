import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { TripsApiService, Trip, CreateTripPayload, UpdateTripPayload } from './services/trips.service';

interface TripsState {
    trips: Trip[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    successMessage: string | null;
    filterRouteId: string;
    filterActive: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

const initial: TripsState = {
    trips: [],
    loading: false,
    saving: false,
    error: null,
    successMessage: null,
    filterRouteId: '',
    filterActive: 'ALL',
};

export const TripsStore = signalStore(
    { providedIn: 'root' },
    withState<TripsState>(initial),

    withComputed(({ trips, filterRouteId, filterActive }) => ({

        filteredTrips: computed(() => {
            let result = trips();
            const routeId = filterRouteId();
            const active  = filterActive();
            if (routeId) result = result.filter((t) => t.routeId === routeId);
            if (active === 'ACTIVE')   result = result.filter((t) => t.isActive);
            if (active === 'INACTIVE') result = result.filter((t) => !t.isActive);
            return result;
        }),

        // Sélecteur curried — utilisé dans SchedulesListComponent pour filtrer par route
        tripsForRoute: computed(() => (routeId: string) =>
            trips().filter((t) => t.routeId === routeId && t.isActive)
        ),

        // Tous les trips actifs — utilisé dans les modals de planification
        activeTrips: computed(() => trips().filter((t) => t.isActive)),

        countByRoute: computed(() => {
            const map: Record<string, number> = {};
            trips().forEach((t) => {
                map[t.routeId] = (map[t.routeId] ?? 0) + 1;
            });
            return map;
        }),
    })),

    withMethods((store, api = inject(TripsApiService)) => ({

        async loadTrips(): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                const trips = await firstValueFrom(api.getAll());
                patchState(store, { trips, loading: false });
            } catch {
                patchState(store, { loading: false, error: 'Impossible de charger les horaires' });
            }
        },

        async createTrip(payload: CreateTripPayload): Promise<Trip | null> {
            patchState(store, { saving: true, error: null });
            try {
                const trip = await firstValueFrom(api.create(payload));
                patchState(store, {
                    trips: [...store.trips(), trip],
                    saving: false,
                    successMessage: `Horaire ${trip.departureTime}→${trip.arrivalTime} créé`,
                });
                return trip;
            } catch (err: any) {
                patchState(store, {
                    saving: false,
                    error: err?.error?.message ?? 'Erreur lors de la création',
                });
                return null;
            }
        },

        async updateTrip(id: string, payload: UpdateTripPayload): Promise<boolean> {
            patchState(store, { saving: true, error: null });
            try {
                const updated = await firstValueFrom(api.update(id, payload));
                patchState(store, {
                    trips: store.trips().map((t) => (t.id === id ? updated : t)),
                    saving: false,
                    successMessage: 'Horaire mis à jour',
                });
                return true;
            } catch (err: any) {
                patchState(store, {
                    saving: false,
                    error: err?.error?.message ?? 'Erreur lors de la mise à jour',
                });
                return false;
            }
        },

        async deleteTrip(id: string): Promise<void> {
            patchState(store, { saving: true, error: null });
            try {
                await firstValueFrom(api.remove(id));
                patchState(store, {
                    trips: store.trips().filter((t) => t.id !== id),
                    saving: false,
                    successMessage: 'Horaire supprimé',
                });
            } catch (err: any) {
                patchState(store, {
                    saving: false,
                    error: err?.error?.message ?? 'Impossible de supprimer cet horaire',
                });
            }
        },

        setFilterRouteId(routeId: string): void { patchState(store, { filterRouteId: routeId }); },
        setFilterActive(v: 'ALL' | 'ACTIVE' | 'INACTIVE'): void { patchState(store, { filterActive: v }); },
        clearMessages(): void { patchState(store, { error: null, successMessage: null }); },
    })),
);
