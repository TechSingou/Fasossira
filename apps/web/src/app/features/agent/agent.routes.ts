/**
 * AGENT_ROUTES — avec données breadcrumb
 * Fichier : apps/web/src/app/features/agent/agent.routes.ts
 */
import { Routes } from '@angular/router';

export const AGENT_ROUTES: Routes = [
  {
    path: 'ticket-office',
    data: { breadcrumb: 'Vente Guichet' },
    loadComponent: () =>
      import('./ticket-office/ticket-office.component')
        .then(m => m.TicketOfficeComponent),
  },
  {
    path: 'on-route',
    data: { breadcrumb: 'Vente en Route' },
    loadComponent: () =>
      import('./on-route/on-route.component')
        .then(m => m.OnRouteComponent),
  },
  {
    path: 'reservations',
    data: { breadcrumb: 'Mes réservations' },
    loadComponent: () =>
      import('./reservations/reservations-list.component')
        .then(m => m.ReservationsListComponent),
  },
  { path: '', redirectTo: 'ticket-office', pathMatch: 'full' },
];
