/**
 * SUPER_ADMIN_ROUTES — avec données breadcrumb
 * Fichier : apps/web/src/app/features/super-admin/super-admin.routes.ts
 */
import { Routes } from '@angular/router';

export const SUPER_ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'dashboard',
    data: { breadcrumb: 'Vue globale' },
    loadComponent: () =>
      import('./dashboard/super-admin-dashboard.component')
        .then(m => m.SuperAdminDashboardComponent),
  },
  {
    path: 'tenants',
    data: { breadcrumb: 'Tenants' },
    loadComponent: () =>
      import('./tenants/tenants.component')
        .then(m => m.TenantsComponent),
  },
  {
    path: 'plans',
    data: { breadcrumb: 'Plans SaaS' },
    loadComponent: () =>
      import('./plans/plans-list.component')
        .then(m => m.PlansListComponent),
  },
];
