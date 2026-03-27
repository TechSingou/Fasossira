// apps/web/src/app/core/services/quotas.service.ts
//
// Service HTTP pour récupérer les quotas du tenant connecté.
// Consomme GET /companies/me/quotas
// Utilisé par QuotasStore (signal store partagé).

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QuotaInfo {
  current:      number;
  /** -1 = illimité (plan Enterprise) */
  max:          number;
  /** -1 = illimité */
  remaining:    number;
  limitReached: boolean;
  planName:     string;
}

/** Helper : vrai si le plan est Enterprise (max = -1) */
export const isUnlimited = (quota: QuotaInfo): boolean => quota.max === -1;

export interface TenantQuotas {
  buses:    QuotaInfo;
  agencies: QuotaInfo;
  users:    QuotaInfo;
}

@Injectable({ providedIn: 'root' })
export class QuotasApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/companies/me/quotas`;

  getMyQuotas(): Observable<TenantQuotas> {
    return this.http.get<TenantQuotas>(this.base);
  }
}
