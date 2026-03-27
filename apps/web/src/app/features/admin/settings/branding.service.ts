// apps/web/src/app/features/admin/settings/branding.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BrandingSettings {
  id: string;
  companyId: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  companyDisplayName: string;
  ticketFooter: string;
  supportContact: string;
  updatedAt: string;
}

export interface UpdateBrandingDto {
  primaryColor?: string;
  secondaryColor?: string;
  companyDisplayName?: string;
  ticketFooter?: string;
  supportContact?: string;
}

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly http = inject(HttpClient);
  // ✅ Aligné sur le pattern de tous les autres services du projet
  private readonly base = `${environment.apiUrl}/companies`;

  getSettings(): Observable<BrandingSettings> {
    return this.http.get<BrandingSettings>(`${this.base}/me/settings`);
  }

  updateSettings(dto: UpdateBrandingDto): Observable<BrandingSettings> {
    return this.http.patch<BrandingSettings>(`${this.base}/me/settings`, dto);
  }

  uploadLogo(file: File): Observable<BrandingSettings> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<BrandingSettings>(`${this.base}/me/logo`, formData);
  }

  deleteLogo(): Observable<BrandingSettings> {
    return this.http.delete<BrandingSettings>(`${this.base}/me/logo`);
  }
}
