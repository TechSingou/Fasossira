// apps/web/src/app/features/admin/routes/services/routes.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface RouteStop {
  id?: string;
  cityName: string;
  order: number;
  distanceFromStart: number;
}

// export interface SegmentPrice {
//   id?: string;
//   fromStopOrder: number;
//   toStopOrder: number;
//   price: number;
//   currency: string;
// }

//  Utiliser pour recevoir les reponses de l'API, pas pour envoyer les données
export interface SegmentPrice {
  id?: string;
  fromStopOrder: number;
  toStopOrder: number;
  price: number;
  currency: string
}

//  Utiliser pour envoyer les données à l'API, pas pour recevoir les réponses (sans le champ curryency)
export interface SegmentPricePayload {
  fromStopOrder: number;
  toStopOrder: number;
  price: number;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  stops: RouteStop[];
  segmentPrices: SegmentPrice[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RoutesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/routes`;

  getAll(): Observable<Route[]> {
    return this.http.get<Route[]>(this.base);
  }

  getOne(id: string): Observable<Route> {
    return this.http.get<Route>(`${this.base}/${id}`);
  }

  create(data: { name: string; description?: string }): Observable<Route> {
    return this.http.post<Route>(this.base, data);
  }

  update(id: string, data: Partial<Route>): Observable<Route> {
    return this.http.patch<Route>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  updateStops(id: string, stops: RouteStop[]): Observable<RouteStop[]> {
    return this.http.put<RouteStop[]>(`${this.base}/${id}/stops`, { stops });
  }

  getSegmentPrices(id: string): Observable<SegmentPrice[]> {
    return this.http.get<SegmentPrice[]>(`${this.base}/${id}/segment-prices`);
  }

  saveSegmentPrices(id: string, prices: SegmentPricePayload[]): Observable<SegmentPrice[]> {
    return this.http.put<SegmentPrice[]>(`${this.base}/${id}/segment-prices`, { prices });
  }
}
