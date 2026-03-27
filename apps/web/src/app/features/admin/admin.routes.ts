/**
 * ADMIN_ROUTES — avec données breadcrumb
 *
 * Fichier : apps/web/src/app/features/admin/admin.routes.ts
 *
 * Changement vs v1 :
 *   ✅ Ajout data: { breadcrumb: '...' } sur chaque route
 *      → utilisé par BreadcrumbComponent pour afficher le label correct
 *
 * Convention de nommage breadcrumb :
 *   - Nom de la page tel qu'affiché dans le <h1> de la page
 *   - Français, pas de majuscules superflues
 */
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    data: { breadcrumb: 'Tableau de bord' },
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'routes',
    data: { breadcrumb: 'Routes & Arrêts' },
    loadComponent: () =>
      import('./routes/routes-list.component').then(m => m.RoutesListComponent),
  },
  {
    path: 'routes/:id',
    data: { breadcrumb: 'Détail route' },
    loadComponent: () =>
      import('./routes/route-detail.component').then(m => m.RouteDetailComponent),
  },
  {
    path: 'fleet',
    data: { breadcrumb: 'Flotte Bus' },
    loadComponent: () =>
      import('./fleet/fleet-list.component').then(m => m.FleetListComponent),
  },
  {
    path: 'trips',
    data: { breadcrumb: 'Horaires' },
    loadComponent: () =>
      import('./trips/trips-list.component').then(m => m.TripsListComponent),
  },
  {
    path: 'schedules',
    data: { breadcrumb: 'Voyages Planifiés' },
    loadComponent: () =>
      import('./schedules/schedules-list.component').then(m => m.SchedulesListComponent),
  },
  {
    path: 'agencies',
    data: { breadcrumb: 'Agences & Agents' },
    loadComponent: () =>
      import('./agencies/agencies-list.component').then(m => m.AgenciesListComponent),
  },
  {
    path: 'reservations',
    data: { breadcrumb: 'Réservations' },
    /* TODO étape 4 — loadComponent quand le composant existe */
    loadComponent: () =>
      import('./agencies/agencies-list.component').then(m => m.AgenciesListComponent),
  },
  {
    path: 'passengers',
    data: { breadcrumb: 'Passagers' },
    /* TODO étape 4 */
    loadComponent: () =>
      import('./agencies/agencies-list.component').then(m => m.AgenciesListComponent),
  },
  {
    path: 'settings',
    data: { breadcrumb: 'Paramètres' },
    loadComponent: () =>
      import('./settings/branding.component').then(m => m.BrandingComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
