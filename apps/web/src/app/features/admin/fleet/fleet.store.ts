import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { FleetApiService, Bus, CreateBusPayload, UpdateBusPayload, BusStatus } from './services/fleet.service';

interface FleetState {
    buses: Bus[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    successMessage: string | null;
    statusFilter: 'ALL' | BusStatus;
    searchQuery: string;
}

const initial: FleetState = {
    buses: [],
    loading: false,
    saving: false,
    error: null,
    successMessage: null,
    statusFilter: 'ALL',
    searchQuery: '',
};

export const FleetStore = signalStore(
    { providedIn: 'root' },
    withState<FleetState>(initial),

    withComputed(({ buses, statusFilter, searchQuery }) => ({

        activeBuses: computed(() =>
            buses().filter((b) => b.status === 'ACTIVE')
        ),

        filteredBuses: computed(() => {
            const q = searchQuery().toLowerCase().trim();
            const status = statusFilter();
            return buses().filter((b) => {
                if (status !== 'ALL' && b.status !== status) return false;
                if (!q) return true;
                return (
                    b.plate.toLowerCase().includes(q) ||
                    b.brand.toLowerCase().includes(q) ||
                    b.model.toLowerCase().includes(q)
                );
            });
        }),

        countByStatus: computed(() => ({
            ALL: buses().length,
            ACTIVE: buses().filter((b) => b.status === 'ACTIVE').length,
            MAINTENANCE: buses().filter((b) => b.status === 'MAINTENANCE').length,
            RETIRED: buses().filter((b) => b.status === 'RETIRED').length,
        })),

        hasActiveFilter: computed(() =>
            statusFilter() !== 'ALL' || searchQuery().trim() !== ''
        ),
    })),

    withMethods((store, api = inject(FleetApiService)) => ({

        async loadBuses(): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                const buses = await firstValueFrom(api.getAll());
                patchState(store, { buses, loading: false });
            } catch {
                patchState(store, { loading: false, error: 'Impossible de charger la flotte' });
            }
        },

        async createBus(payload: CreateBusPayload): Promise<Bus | null> {
            patchState(store, { saving: true, error: null });
            try {
                console.log(payload);

                const bus = await firstValueFrom(api.create(payload));
                patchState(store, {
                    buses: [bus, ...store.buses()],
                    saving: false,
                    successMessage: `Bus ${bus.plate} ajouté à la flotte`,
                });
                return bus;
            } catch (err: any) {
                patchState(store, {
                    saving: false,
                    error: err?.error?.message ?? 'Erreur lors de la création',
                });
                return null;
            }
        },

        async updateBus(id: string, payload: UpdateBusPayload): Promise<boolean> {
            patchState(store, { saving: true, error: null });
            try {
                const updated = await firstValueFrom(api.update(id, payload));
                patchState(store, {
                    buses: store.buses().map((b) => (b.id === id ? updated : b)),
                    saving: false,
                    successMessage: 'Bus mis à jour',
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

        async deleteBus(id: string): Promise<void> {
            patchState(store, { saving: true, error: null });
            try {
                await firstValueFrom(api.remove(id));
                patchState(store, {
                    buses: store.buses().filter((b) => b.id !== id),
                    saving: false,
                    successMessage: 'Bus supprimé',
                });
            } catch {
                patchState(store, { saving: false, error: 'Impossible de supprimer ce bus' });
            }
        },

        setStatusFilter(status: 'ALL' | BusStatus): void {
            patchState(store, { statusFilter: status });
        },

        setSearchQuery(q: string): void {
            patchState(store, { searchQuery: q });
        },

        resetFilters(): void {
            patchState(store, { statusFilter: 'ALL', searchQuery: '' });
        },

        clearMessages(): void {
            patchState(store, { error: null, successMessage: null });
        },
    })),
);