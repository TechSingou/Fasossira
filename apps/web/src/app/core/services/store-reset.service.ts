// apps/web/src/app/core/services/store-reset.service.ts
import { Injectable, inject } from '@angular/core';
import { BrandingStore } from '../../features/admin/settings/branding.store';
import { DashboardStore } from '../../features/admin/dashboard/dashboard.store';

@Injectable({ providedIn: 'root' })
export class StoreResetService {
  private readonly brandingStore  = inject(BrandingStore);
  private readonly dashboardStore = inject(DashboardStore);

  resetAll(): void {
    this.brandingStore.reset();
    this.dashboardStore.reset();
  }
}
