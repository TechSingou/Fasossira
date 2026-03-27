// apps/web/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from '@fasossira/shared-types';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },

  // ─── Auth (public) ──────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ─── Admin ──────────────────────────────────────────────────
  // Shell comme parent, routes admin comme enfants
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },

  // ─── Super Admin ────────────────────────────────────────────
  {
    path: 'super-admin',
    canActivate: [authGuard, roleGuard(UserRole.SUPER_ADMIN)],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/super-admin/super-admin.routes').then(
            (m) => m.SUPER_ADMIN_ROUTES,
          ),
      },
    ],
  },

  // ─── Agent ──────────────────────────────────────────────────
  {
    path: 'agent',
    canActivate: [authGuard, roleGuard(UserRole.AGENT)],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/agent/agent.routes').then((m) => m.AGENT_ROUTES),
      },
    ],
  },

  // Wildcard
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
