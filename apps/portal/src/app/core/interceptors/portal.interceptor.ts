// apps/portal/src/app/core/interceptors/portal.interceptor.ts
//
// Toutes les requêtes vers /api/v1/public/* partent sans JWT.
// Si un token est présent (utilisateur optionnellement connecté),
// il est injecté sur les autres routes (/auth/me, etc.).
import { HttpInterceptorFn } from '@angular/common/http';

const PUBLIC_PREFIXES = ['/public/', '/auth/login', '/auth/refresh', '/auth/register'];

export const portalInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublic = PUBLIC_PREFIXES.some(p => req.url.includes(p));
  if (isPublic) return next(req);

  const token = localStorage.getItem('portal_access_token');
  if (!token) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
