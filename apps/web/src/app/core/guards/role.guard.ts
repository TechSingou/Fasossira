import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { UserRole } from '../../../../../../libs/shared-types/src/index';

export const roleGuard = (requiredRole: UserRole): CanActivateFn => {
  return () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    // Restaurer la session si le store est vide
    authStore.restoreSession();

    const userRole = authStore.user()?.role;

    if (!userRole) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (userRole === requiredRole) return true;

    // Rediriger vers le bon espace selon le rôle réel
    if (userRole === UserRole.SUPER_ADMIN) router.navigate(['/super-admin/tenants']);
    else if (userRole === UserRole.ADMIN) router.navigate(['/admin/dashboard']);
    else if (userRole === UserRole.AGENT) router.navigate(['/agent/ticket-office']);
    else router.navigate(['/auth/login']);

    return false;
  };
};
