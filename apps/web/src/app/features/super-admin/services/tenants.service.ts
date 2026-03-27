// apps/web/src/app/features/super-admin/services/tenants.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SubscriptionStatus } from '@fasossira/shared-types';

// ─── Interfaces locales (miroir des types backend) ────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  maxBuses: number;
  maxAgencies: number;
  maxUsers: number;
  features: string[];
  isActive: boolean;
}

export interface TenantSubscription {
  id: string;
  companyId: string;
  planId: string;
  plan?: SubscriptionPlan;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
}

export interface TenantUsage {
  buses: number;     agencies: number;    users: number;
  maxBuses: number;  maxAgencies: number; maxUsers: number;
}

export interface TenantSettings {
  primaryColor: string;
  companyDisplayName: string;
  logoUrl?: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  city: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: TenantSettings | null;
  activePlan: SubscriptionPlan | null;
  subscription: TenantSubscription | null;
  usage: TenantUsage;
}

export interface GlobalStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  mrr: number;
  newThisMonth: number;
}

export interface PlanStats {
  mrr: number;
  totalActiveSubs: number;
  byPlan: Array<{
    planId: string;
    planName: string;
    price: number;
    count: number;
    revenue: number;
  }>;
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  city: string;
  phone: string;
  planId: string;
  adminEmail: string;
  adminName: string;
}

// ─── Service ──────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private readonly http       = inject(HttpClient);
  private readonly baseUrl    = `${environment.apiUrl}/companies`;
  private readonly plansUrl   = `${environment.apiUrl}/plans`;

  // ── Tenants ──────────────────────────────────────────────────

  getAll(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(this.baseUrl);
  }

  getOne(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.baseUrl}/${id}`);
  }

  getGlobalStats(): Observable<GlobalStats> {
    return this.http.get<GlobalStats>(`${this.baseUrl}/stats`);
  }

  create(payload: CreateTenantPayload): Observable<{ company: Tenant; tempPassword: string }> {
    return this.http.post<{ company: Tenant; tempPassword: string }>(this.baseUrl, payload);
  }

  suspend(id: string): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.baseUrl}/${id}/suspend`, {});
  }

  activate(id: string): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.baseUrl}/${id}/activate`, {});
  }

  assignPlan(companyId: string, planId: string): Observable<TenantSubscription> {
    return this.http.patch<TenantSubscription>(`${this.baseUrl}/${companyId}/plan`, { planId });
  }

  // ── Plans ────────────────────────────────────────────────────

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(this.plansUrl);
  }

  getActivePlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.plansUrl}/active`);
  }

  getPlanStats(): Observable<PlanStats> {
    return this.http.get<PlanStats>(`${this.plansUrl}/stats`);
  }

  createPlan(payload: Partial<SubscriptionPlan>): Observable<SubscriptionPlan> {
    return this.http.post<SubscriptionPlan>(this.plansUrl, payload);
  }

  updatePlan(id: string, payload: Partial<SubscriptionPlan>): Observable<SubscriptionPlan> {
    return this.http.patch<SubscriptionPlan>(`${this.plansUrl}/${id}`, payload);
  }

  togglePlan(id: string): Observable<SubscriptionPlan> {
    return this.http.patch<SubscriptionPlan>(`${this.plansUrl}/${id}/toggle`, {});
  }
}
