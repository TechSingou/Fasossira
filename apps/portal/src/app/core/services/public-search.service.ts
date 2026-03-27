// apps/portal/src/app/core/services/public-search.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── Types ────────────────────────────────────────────────

export interface CompanyInfo {
  id:           string;
  name:         string;
  slug:         string;
  city:         string;
  primaryColor: string;
  logoUrl:      string | null;
}

export interface RouteStop {
  id:       string;
  order:    number;
  cityName: string;
}

export interface PublicSchedule {
  scheduleId:        string;
  date:              string;
  departureDateTime: string;
  arrivalDateTime:   string;
  status:            string;
  totalSeats:        number;
  availableSeats:    number;
  company:           CompanyInfo;
  trip: {
    departureTime: string;
    arrivalTime:   string;
    route: { id: string; name: string; stops: RouteStop[] };
  };
  bus: { plate: string; capacity: number };
}

export interface SeatInfo {
  seatNumber: number;
  status:     'free' | 'taken';
}

export interface SeatMapResult {
  scheduleId:     string;
  totalSeats:     number;
  fromStopOrder:  number;
  toStopOrder:    number;
  seats:          SeatInfo[];
  availableCount: number;
}

/** Un passager dans le payload de réservation */
export interface PublicPassenger {
  seatNumber:     number;
  passengerName:  string;
  passengerPhone: string;
}

/** Payload vers POST /public/reservations */
export interface PublicReservationPayload {
  scheduleId:     string;
  fromStopOrder:  number;
  toStopOrder:    number;
  paymentMethod:  string;
  externalRef?:   string;
  passengers:     PublicPassenger[];   // ← tableau, plus un seul passager
}

/** Un billet dans la réponse bulk */
export interface CreatedTicket {
  reference:      string;
  passengerName:  string;
  passengerPhone: string;
  seatNumber:     number;
  amount:         number;
  currency:       string;
  status:         string;
  createdAt:      string;
}

/** Réponse de POST /public/reservations */
export interface PublicReservationResult {
  count:        number;
  totalAmount:  number;
  currency:     string;
  fromCityName: string;
  toCityName:   string;
  reservations: CreatedTicket[];
}

/** Billet récupéré par référence — inclut maintenant le branding compagnie */
export interface PublicTicket {
  reference:         string;
  passengerName:     string;
  passengerPhone:    string;
  seatNumber:        number;
  fromCityName:      string;
  toCityName:        string;
  departureDateTime: string;
  arrivalDateTime:   string;
  busPlate:          string;
  amount:            number;
  currency:          string;
  paymentMethod:     string;
  status:            string;
  createdAt:         string;
  company: {          // ← nouveau
    name:         string;
    primaryColor: string;
    logoUrl:      string | null;
  };
}

// ─── Service ──────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PublicSearchService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/public`;

  search(params: {
    date: string; fromStop?: string; toStop?: string; companySlug?: string;
  }): Observable<PublicSchedule[]> {
    let p = new HttpParams().set('date', params.date);
    if (params.fromStop)    p = p.set('fromStop',    params.fromStop);
    if (params.toStop)      p = p.set('toStop',      params.toStop);
    if (params.companySlug) p = p.set('companySlug', params.companySlug);
    return this.http.get<PublicSchedule[]>(`${this.base}/search`, { params: p });
  }

  getSeatMap(scheduleId: string, from: number, to: number): Observable<SeatMapResult> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<SeatMapResult>(`${this.base}/seat-map/${scheduleId}`, { params });
  }

  createReservation(payload: PublicReservationPayload): Observable<PublicReservationResult> {
    return this.http.post<PublicReservationResult>(`${this.base}/reservations`, payload);
  }

  getTicket(reference: string, phone: string): Observable<PublicTicket> {
    const params = new HttpParams().set('phone', phone);
    return this.http.get<PublicTicket>(`${this.base}/ticket/${reference}`, { params });
  }
}
