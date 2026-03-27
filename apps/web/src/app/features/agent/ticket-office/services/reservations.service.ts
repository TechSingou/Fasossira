import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SaleChannel, PaymentMethod, ReservationStatus } from '@fasossira/shared-types';

// ─── Types ────────────────────────────────────────────────────

export interface SeatInfo {
    seatNumber: number;
    status: 'free' | 'taken';
}

export interface SeatMapResult {
    scheduleId: string;
    totalSeats: number;
    fromStopOrder: number;
    toStopOrder: number;
    seats: SeatInfo[];
    availableCount: number;
}

export interface RouteStop {
    id: string;
    order: number;
    cityName: string;
}

export interface ScheduleForSale {
    id: string;
    date: string;
    departureDateTime: string;
    arrivalDateTime: string;
    status: string;
    totalSeats: number;
    availableSeats: number;
    trip: {
        departureTime: string;
        arrivalTime: string;
        route: {
            id: string;
            name: string;
            stops: RouteStop[];
        };
    };
    bus: { plate: string; capacity: number };
}

export interface Reservation {
    id: string;
    reference: string;
    scheduleId: string;
    seatNumber: number;
    fromStopOrder: number;
    toStopOrder: number;
    fromCityName: string;
    toCityName: string;
    passengerName: string;
    passengerPhone: string;
    amount: number;
    currency: string;
    saleChannel: SaleChannel;
    status: ReservationStatus;
    createdAt: string;
    schedule?: ScheduleForSale;
}

export interface TicketDto {
    reference: string;
    passengerName: string;
    passengerPhone: string;
    seatNumber: number;
    fromCityName: string;
    toCityName: string;
    departureDateTime: string;
    arrivalDateTime: string;
    busPlate: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    saleChannel: string;
    status: string;
    createdAt: string;
}

// ─── Payloads ─────────────────────────────────────────────────

export interface PassengerPayload {
    seatNumber: number;
    passengerName: string;
    passengerPhone: string;
}

export interface CreateReservationPayload {
    scheduleId: string;
    seatNumber: number;
    fromStopOrder: number;
    toStopOrder: number;
    passengerName: string;
    passengerPhone: string;
    saleChannel: SaleChannel;
    paymentMethod: PaymentMethod;
    externalRef?: string;
}

export interface CreateBulkPayload {
    scheduleId: string;
    fromStopOrder: number;
    toStopOrder: number;
    saleChannel: SaleChannel;
    paymentMethod: PaymentMethod;
    externalRef?: string;
    passengers: PassengerPayload[];
}

export interface BulkResult {
    created: number;
    totalAmount: number;
    currency: string;
    reservations: Reservation[];
}

export interface ReservationFilters {
    scheduleId?: string;
    date?: string;
    status?: ReservationStatus;
    search?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationsApiService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiUrl}/reservations`;
    private readonly ticketsBase = `${environment.apiUrl}/tickets`;
    private readonly schedulesBase = `${environment.apiUrl}/schedules`;

    // ─── Schedules ────────────────────────────────────────────

    getSchedulesForSale(params: {
        date: string;
        fromStopName?: string;
        toStopName?: string;
    }): Observable<ScheduleForSale[]> {
        const p: any = { date: params.date };
        if (params.fromStopName) p['fromStop'] = params.fromStopName;
        if (params.toStopName) p['toStop'] = params.toStopName;
        return this.http.get<ScheduleForSale[]>(`${this.schedulesBase}/for-sale`, { params: p });
    }

    // ─── Seat Map ─────────────────────────────────────────────

    getSeatMap(scheduleId: string, from: number, to: number): Observable<SeatMapResult> {
        return this.http.get<SeatMapResult>(`${this.base}/seat-map/${scheduleId}`, {
            params: { from: from.toString(), to: to.toString() },
        });
    }

    // ─── Réservation simple ───────────────────────────────────

    create(payload: CreateReservationPayload): Observable<Reservation> {
        return this.http.post<Reservation>(this.base, payload);
    }

    // ─── Réservation groupée ──────────────────────────────────

    createBulk(payload: CreateBulkPayload): Observable<BulkResult> {
        return this.http.post<BulkResult>(`${this.base}/bulk`, payload);
    }

    // ─── Liste ────────────────────────────────────────────────

    findAll(filters: ReservationFilters = {}): Observable<Reservation[]> {
        const params: any = {};
        if (filters.scheduleId) params['scheduleId'] = filters.scheduleId;
        if (filters.date) params['date'] = filters.date;
        if (filters.status) params['status'] = filters.status;
        if (filters.search) params['search'] = filters.search;
        return this.http.get<Reservation[]>(this.base, { params });
    }

    cancel(id: string): Observable<{ message: string; reference: string }> {
        return this.http.delete<{ message: string; reference: string }>(`${this.base}/${id}`);
    }

    // ─── Tickets ──────────────────────────────────────────────

    getTicket(reference: string): Observable<TicketDto> {
        return this.http.get<TicketDto>(`${this.ticketsBase}/${reference}`);
    }
}
