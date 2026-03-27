import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export type ScheduleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ScheduleTrip {
    id: string; departureTime: string; arrivalTime: string;
    route: { id: string; name: string };
}
export interface ScheduleBus { id: string; plate: string; capacity: number; }

export interface Schedule {
    id: string; companyId: string; tripId: string; busId: string;
    date: string; departureDateTime: string; arrivalDateTime: string;
    totalSeats: number; status: ScheduleStatus;
    trip: ScheduleTrip; bus: ScheduleBus;
}

export interface PlanningEntry {
    id: string; date: string; departureTime: string; arrivalTime: string;
    route: string; tripId: string;
    bus: { id: string; plate: string; capacity: number };
    totalSeats: number; availableSeats: number; status: ScheduleStatus;
}

export interface GeneratePayload {
    tripId: string; busId: string; startDate: string; endDate: string; weekDays: number[];
}
export interface GenerateResult { created: number; skipped: string[]; }

export interface AvailableBus {
    id: string; plate: string; brand: string; model: string; capacity: number;
}

// Trip tel que retourné par GET /trips (avec route populée)
export interface TripSummary {
    id: string;
    routeId: string;
    departureTime: string;
    arrivalTime: string;
    isActive: boolean;
    route: { id: string; name: string };
}

export interface ScheduleFilters {
    date?: string; routeId?: string; busId?: string; status?: ScheduleStatus;
}

@Injectable({ providedIn: 'root' })
export class SchedulesApiService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiUrl}/schedules`;
    private readonly tripsBase = `${environment.apiUrl}/trips`;
    private readonly busesBase = `${environment.apiUrl}/buses`;

    // ─── Schedules ────────────────────────────────────────────

    getPlanning(date?: string): Observable<PlanningEntry[]> {
        const params = date ? new HttpParams().set('date', date) : undefined;
        return this.http.get<PlanningEntry[]>(`${this.base}/planning`, { params });
    }

    getAll(filters: ScheduleFilters = {}): Observable<Schedule[]> {
        let params = new HttpParams();
        if (filters.date)    params = params.set('date',    filters.date);
        if (filters.routeId) params = params.set('routeId', filters.routeId);
        if (filters.busId)   params = params.set('busId',   filters.busId);
        if (filters.status)  params = params.set('status',  filters.status);
        return this.http.get<Schedule[]>(this.base, { params });
    }

    create(payload: { tripId: string; busId: string; date: string }): Observable<Schedule> {
        return this.http.post<Schedule>(this.base, payload);
    }

    generate(payload: GeneratePayload): Observable<GenerateResult> {
        return this.http.post<GenerateResult>(`${this.base}/generate`, payload);
    }

    update(id: string, payload: {
        busId?: string; date?: string; status?: ScheduleStatus;
    }): Observable<Schedule> {
        return this.http.patch<Schedule>(`${this.base}/${id}`, payload);
    }

    remove(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/${id}`);
    }

    getAvailableBuses(tripId: string, date: string): Observable<AvailableBus[]> {
        const params = new HttpParams().set('tripId', tripId).set('date', date);
        return this.http.get<AvailableBus[]>(`${this.base}/buses/available`, { params });
    }

    // ─── Trips (modals création / génération) ─────────────────

    /**
     * Retourne tous les trips de la compagnie avec leur route populée.
     * Utilisé pour les selects "Trip (Route + Horaire)".
     */
    getTrips(): Observable<TripSummary[]> {
        return this.http.get<TripSummary[]>(this.tripsBase);
    }

    /**
     * Crée un nouveau trip (route + horaire fixe).
     * Utilisé depuis SchedulesFormComponent pour créer un horaire
     * à la volée sans quitter la page de planification.
     */
    createTrip(payload: {
        routeId: string;
        departureTime: string;
        arrivalTime: string;
    }): Observable<TripSummary> {
        return this.http.post<TripSummary>(this.tripsBase, payload);
    }

    // ─── Bus (modal génération en série) ──────────────────────

    /**
     * Retourne les bus ACTIVE.
     * Utilisé pour la génération en série où il n'y a pas de créneau
     * précis permettant de filtrer par disponibilité.
     */
    getActiveBuses(): Observable<AvailableBus[]> {
        return this.http.get<AvailableBus[]>(`${this.busesBase}/active`);
    }
}
