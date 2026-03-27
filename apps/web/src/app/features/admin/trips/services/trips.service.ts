import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface TripRoute {
    id: string;
    name: string;
}

export interface Trip {
    id: string;
    companyId: string;
    routeId: string;
    departureTime: string; // "HH:mm"
    arrivalTime: string;   // "HH:mm"
    isActive: boolean;
    createdAt: string;
    route?: TripRoute;
}

export interface CreateTripPayload {
    routeId: string;
    departureTime: string;
    arrivalTime: string;
}

export interface UpdateTripPayload {
    departureTime?: string;
    arrivalTime?: string;
    isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TripsApiService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiUrl}/trips`;

    getAll(): Observable<Trip[]> {
        return this.http.get<Trip[]>(this.base);
    }

    create(payload: CreateTripPayload): Observable<Trip> {
        return this.http.post<Trip>(this.base, payload);
    }

    update(id: string, payload: UpdateTripPayload): Observable<Trip> {
        return this.http.patch<Trip>(`${this.base}/${id}`, payload);
    }

    remove(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/${id}`);
    }
}
