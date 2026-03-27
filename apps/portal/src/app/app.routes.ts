// apps/portal/src/app/app.routes.ts
import { Routes } from '@angular/router';

export const portalRoutes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },

  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search-page.component').then(m => m.SearchPageComponent),
    title: 'Rechercher un voyage — Fasossira',
  },
  {
    path: 'book/:scheduleId',
    loadComponent: () =>
      import('./features/booking/booking-page.component').then(m => m.BookingPageComponent),
    title: 'Réserver — Fasossira',
  },
  {
    path: 'confirm',
    loadComponent: () =>
      import('./features/confirmation/confirmation-page.component').then(m => m.ConfirmationPageComponent),
    title: 'Confirmation — Fasossira',
  },
  {
    path: 'my-ticket',
    loadComponent: () =>
      import('./features/my-ticket/my-ticket-page.component').then(m => m.MyTicketPageComponent),
    title: 'Mes billets — Fasossira',
  },

  { path: '**', redirectTo: 'search' },
];
