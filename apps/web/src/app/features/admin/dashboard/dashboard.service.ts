// apps/web/src/app/features/admin/dashboard/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type PeriodPreset = 'today' | 'week' | 'month' | 'custom';

export interface PeriodStats {
  revenue: number;
  tickets: number;
  passengers: number;
  avgTicketPrice: number;
  cancelledTickets: number;
  occupancyRate: number;
}

export interface DashboardStats {
  period: { from: string; to: string; label: string };
  current: PeriodStats;
  previous: PeriodStats;
  fleet: { total: number; active: number; maintenance: number };
  network: { activeRoutes: number; scheduledTrips: number; completedTrips: number };
  paymentBreakdown: Array<{ method: string; count: number; amount: number }>;
  revenueTimeline: Array<{ date: string; revenue: number; tickets: number }>;
  topRoutes: Array<{ name: string; tickets: number; revenue: number }>;
}

export interface DashboardQuery {
  period: PeriodPreset;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dashboard`;

  getStats(query: DashboardQuery): Observable<DashboardStats> {
    let params = new HttpParams().set('period', query.period);
    if (query.period === 'custom' && query.from && query.to) {
      params = params.set('from', query.from).set('to', query.to);
    }
    return this.http.get<DashboardStats>(`${this.base}/stats`, { params });
  }
}
