import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

// ✅ PATTERN CORRECT — token refresh avec lock
let isRefreshing = false;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/') && !isRefreshing) {
        isRefreshing = true;
        return from(authStore.refreshTokens()).pipe(
          switchMap((success) => {
            isRefreshing = false;
            if (success) {
              const newToken = authStore.accessToken();
              return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
            }
            return throwError(() => error);
          }),
          catchError((err) => { isRefreshing = false; return throwError(() => err); }),
        );
      }
      return throwError(() => error);
    }),
  );
};