// apps/web/src/app/core/auth/auth.store.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  signalStore, withState, withMethods, withComputed,
  patchState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthTokens, UserRole, JwtPayload } from '@fasossira/shared-types';
import { StoreResetService } from '../services/store-reset.service';

// ─── State Shape ───────────────────────────────────────────────
interface AuthState {
  user: AuthTokens['user'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

// ─── Store ─────────────────────────────────────────────────────
export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState<AuthState>(initialState),

  // ─── Computed ────────────────────────────────────────────────
  withComputed(({ user, accessToken }) => ({
    isAuthenticated: computed(() => !!accessToken() && !!user()),
    isAdmin: computed(() => user()?.role === UserRole.ADMIN),
    isSuperAdmin: computed(() => user()?.role === UserRole.SUPER_ADMIN),
    isAgent: computed(() => user()?.role === UserRole.AGENT),
    companyId: computed(() => user()?.companyId || null),
    // Décode expiry depuis le token (sans lib externe)
    isTokenExpired: computed(() => {
      const token = accessToken();
      if (!token) return true;
      try {
        const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
        return payload.exp! * 1000 < Date.now();
      } catch {
        return true;
      }
    }),
  })),

  // ─── Methods ─────────────────────────────────────────────────
  withMethods((store, authService = inject(AuthService), router = inject(Router), storeReset = inject(StoreResetService)) => ({

    // ─── Login ───────────────────────────────────────────────
    async login(email: string, password: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const tokens = await firstValueFrom(authService.login({ email, password }));
        // ✅ Reset tous les stores AVANT de charger le nouveau tenant
        // Évite que les données du tenant précédent soient visibles un instant
        storeReset.resetAll();

        localStorage.setItem('fasossira_access', tokens.accessToken);
        localStorage.setItem('fasossira_refresh', tokens.refreshToken);
        patchState(store, {
          user: tokens.user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          loading: false,
          error: null,
        });
        // Redirection selon le rôle
        const role = tokens.user.role;
        if (role === UserRole.SUPER_ADMIN) router.navigate(['/super-admin/dashboard']);
        else if (role === UserRole.ADMIN) router.navigate(['/admin/dashboard']);
        else if (role === UserRole.AGENT) router.navigate(['/agent/ticket-office']);
      } catch (err: any) {
        const message = err?.error?.message || 'Identifiants incorrects';
        patchState(store, { loading: false, error: message });
      }
    },

    // ─── Refresh silencieux ─────────────────────────────────
    async refreshTokens(): Promise<boolean> {
      const refreshToken = store.refreshToken() || localStorage.getItem('fasossira_refresh');
      if (!refreshToken) return false;
      try {
        const tokens = await firstValueFrom(authService.refresh({ refreshToken }));
        localStorage.setItem('fasossira_access', tokens.accessToken);
        localStorage.setItem('fasossira_refresh', tokens.refreshToken);
        patchState(store, {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: tokens.user,
        });
        return true;
      } catch {
        this.logout();
        return false;
      }
    },

    // ─── Restaurer session depuis localStorage ──────────────
    restoreSession(): void {
      const token = localStorage.getItem('fasossira_access');
      const refresh = localStorage.getItem('fasossira_refresh');
      if (!token || !refresh) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
        if (payload.exp! * 1000 < Date.now()) return;
        patchState(store, {
          accessToken: token,
          refreshToken: refresh,
          user: {
            id: payload.sub,
            name: '',       // Sera rechargé par /auth/me
            email: payload.email,
            role: payload.role,
            companyId: payload.companyId,
          },
        });
      } catch { /* token invalide */ }
    },

    // ─── Logout ─────────────────────────────────────────────
    logout(): void {
      // ✅ Reset de TOUS les stores métier avant de vider l'auth
      // Garantit qu'aucune donnée tenant ne survit au logout
      storeReset.resetAll();

      localStorage.removeItem('fasossira_access');
      localStorage.removeItem('fasossira_refresh');
      patchState(store, initialState);
      router.navigate(['/auth/login']);
    },

    // ─── Clear error ────────────────────────────────────────
    clearError(): void {
      patchState(store, { error: null });
    },
  })),
);
