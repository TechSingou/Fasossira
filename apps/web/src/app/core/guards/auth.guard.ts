import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';

export const authGuard: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Toujours tenter de restaurer la session d'abord
  authStore.restoreSession();

  if (!authStore.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Token expiré → refresh silencieux
  if (authStore.isTokenExpired()) {
    const refreshed = await authStore.refreshTokens();
    if (!refreshed) {
      router.navigate(['/auth/login']);
      return false;
    }
  }

  return true;
};
