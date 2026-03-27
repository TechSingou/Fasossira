import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import {
    SchedulesApiService, Schedule, PlanningEntry,
    ScheduleFilters, GeneratePayload, GenerateResult, ScheduleStatus,
    TripSummary,
} from './services/schedules.service';

interface SchedulesState {
    schedules: Schedule[];
    planning: PlanningEntry[];
    // Trips chargés pour les modals (création schedule / form)
    trips: TripSummary[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    successMessage: string | null;
    filterDate: string;
    filterStatus: ScheduleStatus | '';
    viewMode: 'planning' | 'list';
}

const todayISO = () => new Date().toISOString().split('T')[0];

/**
 * Extrait un message lisible depuis une HttpErrorResponse Angular.
 *
 * NestJS peut retourner :
 *  - { message: string }          → ConflictException, NotFoundException, etc.
 *  - { message: string[] }        → BadRequestException avec class-validator
 *  - { message: string, error: string, statusCode: number }
 *
 * Sans cette fonction, Array.toString() produit "[object Object]" dans le template.
 */
function extractErrorMessage(err: any, fallback = 'Une erreur est survenue'): string {
    // err.error = body JSON de la réponse HTTP NestJS
    // err.error.message = string | string[] selon le type d'exception
    const msg = err?.error?.message;
    if (!msg) return fallback;
    if (Array.isArray(msg)) return msg.join(' · ');
    if (typeof msg === 'string') return msg;
    return fallback;
}

const initial: SchedulesState = {
    schedules: [],
    planning: [],
    trips: [],
    loading: false,
    saving: false,
    error: null,
    successMessage: null,
    filterDate: todayISO(),
    filterStatus: '',
    viewMode: 'planning',
};

export const SchedulesStore = signalStore(
    { providedIn: 'root' },
    withState<SchedulesState>(initial),

    withComputed(({ schedules, planning, filterStatus, trips }) => ({

        // Vue liste — filtrée par statut localement
        filteredSchedules: computed(() => {
            const status = filterStatus();
            if (!status) return schedules();
            return schedules().filter((s) => s.status === status);
        }),

        // Vue planning — filtrée par statut localement (pas d'appel API supplémentaire)
        filteredPlanning: computed(() => {
            const status = filterStatus();
            const p = planning();
            if (!status) return p;
            return p.filter((s) => s.status === status);
        }),

        // Stats basées sur le planning COMPLET (non filtré) — chiffres du jour entier
        planningStats: computed(() => {
            const p = planning();
            return {
                total: p.length,
                scheduled: p.filter((s) => s.status === 'SCHEDULED').length,
                inProgress: p.filter((s) => s.status === 'IN_PROGRESS').length,
                completed: p.filter((s) => s.status === 'COMPLETED').length,
                cancelled: p.filter((s) => s.status === 'CANCELLED').length,
                totalSeats: p.reduce((acc, s) => acc + s.totalSeats, 0),
                availableSeats: p.reduce((acc, s) => acc + s.availableSeats, 0),
            };
        }),

        // Trips actifs — utilisés dans les selects des modals
        activeTrips: computed(() => trips().filter((t) => t.isActive)),

        // Sélecteur curried — retourne les trips actifs d'une route donnée.
        // Usage dans le template : store.tripsForRoute()(selectedRouteId)
        tripsForRoute: computed(() => (routeId: string) =>
            trips().filter((t) => t.routeId === routeId && t.isActive)
        ),
    })),

    withMethods((store, api = inject(SchedulesApiService)) => ({

        // ─── Trips (utilisés dans SchedulesFormComponent) ──────────
        // Chargés ici pour éviter d'injecter TripsStore dans un composant
        // qui appartient au domaine "schedules".

        async loadTrips(): Promise<void> {
            try {
                const trips = await firstValueFrom(api.getTrips());
                patchState(store, { trips });
            } catch {
                // Silencieux — les trips sont secondaires (selects de formulaire)
            }
        },

        async createTrip(payload: {
            routeId: string;
            departureTime: string;
            arrivalTime: string;
        }): Promise<TripSummary | null> {
            patchState(store, { saving: true, error: null });
            try {
                const trip = await firstValueFrom(api.createTrip(payload));
                patchState(store, {
                    trips: [...store.trips(), trip],
                    saving: false,
                    successMessage: `Horaire ${trip.departureTime}→${trip.arrivalTime} créé`,
                });
                return trip;
            } catch (err: any) {
                patchState(store, {
                    saving: false,
                    error: extractErrorMessage(err, 'Erreur lors de la création du trip'),
                });
                return null;
            }
        },

        async loadPlanning(date?: string): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                const planning = await firstValueFrom(api.getPlanning(date ?? store.filterDate()));
                patchState(store, { planning, loading: false });
            } catch {
                patchState(store, { loading: false, error: 'Impossible de charger le planning' });
            }
        },

        async loadSchedules(filters?: ScheduleFilters): Promise<void> {
            patchState(store, { loading: true, error: null });
            try {
                const schedules = await firstValueFrom(api.getAll(filters ?? {}));
                patchState(store, { schedules, loading: false });
            } catch {
                patchState(store, { loading: false, error: 'Impossible de charger les schedules' });
            }
        },

        async createSchedule(payload: { tripId: string; busId: string; date: string }): Promise<boolean> {
            patchState(store, { saving: true, error: null });
            try {
                await firstValueFrom(api.create(payload));
                patchState(store, { saving: false, successMessage: 'Voyage planifié' });
                return true;
            } catch (err: any) {
                patchState(store, {
                    saving: false,
                    error: extractErrorMessage(err, 'Erreur lors de la planification'),
                });
                return false;
            }
        },

        async generateSchedules(payload: GeneratePayload): Promise<GenerateResult | null> {
            patchState(store, { saving: true, error: null });
            try {
                const result = await firstValueFrom(api.generate(payload));
                const msg = result.skipped.length > 0
                    ? `${result.created} voyage(s) créé(s) — ${result.skipped.length} conflit(s) ignoré(s)`
                    : `${result.created} voyage(s) créé(s) avec succès`;
                patchState(store, { saving: false, successMessage: msg });
                return result;
            } catch (err: any) {
                patchState(store, {
                    saving: false,
                    error: extractErrorMessage(err, 'Erreur lors de la génération'),
                });
                return null;
            }
        },

        // ─── TODO Étape 4 — RÉSERVATIONS ────────────────────────────────────────────
        // updateSchedule() modifie la date ou le bus d'un schedule SCHEDULED.
        //
        // Quand les réservations seront implémentées, il faudra :
        //   - Modification de DATE  → BLOQUER si des billets ont déjà été vendus
        //     (les passagers ont une date/heure précise sur leur billet, modifier
        //     sans les notifier créerait une incohérence grave)
        //   - Modification de BUS   → AVERTIR si la nouvelle capacité est inférieure
        //     au nombre de réservations existantes (risque d'overbooking)
        //
        // Implémenter dans schedules.service.ts backend :
        //   const reservationCount = await this.reservationsService.countActive(companyId, id);
        //   if (dto.date && reservationCount > 0) throw new ConflictException('...');
        //   if (dto.busId && newBus.capacity < reservationCount) throw new ConflictException('...');
        // ────────────────────────────────────────────────────────────────────────────
        async updateSchedule(
            id: string,
            payload: { date?: string; busId?: string },
        ): Promise<boolean> {
            patchState(store, { saving: true, error: null });
            try {
                await firstValueFrom(api.update(id, payload));

                // Rechargement complet du planning/liste depuis l'API.
                // Un merge superficiel { ...planningEntry, ...schedule } est dangereux :
                // PlanningEntry et Schedule ont des structures différentes (champs plats vs
                // objets imbriqués), ce qui laisse des champs obsolètes après le spread.
                const filterDate = store.filterDate();
                const [planning, schedules] = await Promise.all([
                    firstValueFrom(api.getPlanning(filterDate)),
                    firstValueFrom(api.getAll({ date: filterDate })),
                ]);

                patchState(store, {
                    planning,
                    schedules,
                    saving: false,
                    successMessage: 'Voyage mis à jour',
                });
                return true;
            } catch (err: any) {
                patchState(store, {
                    saving: false,
                    error: extractErrorMessage(err, 'Erreur lors de la mise à jour'),
                });
                return false;
            }
        },

        async cancelSchedule(id: string): Promise<void> {
            patchState(store, { saving: true, error: null });
            try {
                await firstValueFrom(api.update(id, { status: 'CANCELLED' }));
                patchState(store, {
                    planning: store.planning().map((s) =>
                        s.id === id ? { ...s, status: 'CANCELLED' as ScheduleStatus } : s
                    ),
                    schedules: store.schedules().map((s) =>
                        s.id === id ? { ...s, status: 'CANCELLED' as ScheduleStatus } : s
                    ),
                    saving: false,
                    successMessage: 'Voyage annulé',
                });
            } catch {
                patchState(store, { saving: false, error: "Impossible d'annuler ce voyage" });
            }
        },

        async deleteSchedule(id: string): Promise<void> {
            patchState(store, { saving: true, error: null });
            try {
                await firstValueFrom(api.remove(id));
                patchState(store, {
                    planning: store.planning().filter((s) => s.id !== id),
                    schedules: store.schedules().filter((s) => s.id !== id),
                    saving: false,
                    successMessage: 'Voyage supprimé',
                });
            } catch {
                patchState(store, { saving: false, error: 'Impossible de supprimer ce voyage' });
            }
        },

        setFilterDate(date: string): void { patchState(store, { filterDate: date }); },
        setFilterStatus(s: ScheduleStatus | ''): void { patchState(store, { filterStatus: s }); },
        setViewMode(mode: 'planning' | 'list'): void { patchState(store, { viewMode: mode }); },
        clearMessages(): void { patchState(store, { error: null, successMessage: null }); },
    })),
);