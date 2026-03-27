import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export type BusStatus = 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
export type BusType = 'COASTER' | 'SPRINTER' | 'GRAND_BUS';

export interface Bus {
    id: string;
    companyId: string;
    plate: string;
    brand: string;
    model: string;
    capacity: number;
    type: BusType;
    status: BusStatus;
    createdAt: string;
}

export interface CreateBusPayload {
    plate: string;
    brand: string;
    model: string;
    capacity: number;
    type: BusType;
}

export interface UpdateBusPayload {
    plate?: string;
    brand?: string;
    model?: string;
    capacity?: number;
    type?: BusType;
    status?: BusStatus;
}

@Injectable({ providedIn: 'root' })
export class FleetApiService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiUrl}/buses`;

    getAll(): Observable<Bus[]> {
        return this.http.get<Bus[]>(this.base);
    }

    getActive(): Observable<Bus[]> {
        return this.http.get<Bus[]>(`${this.base}/active`);
    }

    create(payload: CreateBusPayload): Observable<Bus> {
        console.log(payload);

        return this.http.post<Bus>(this.base, payload);
    }

    update(id: string, payload: UpdateBusPayload): Observable<Bus> {
        return this.http.patch<Bus>(`${this.base}/${id}`, payload);
    }

    remove(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/${id}`);
    }
}