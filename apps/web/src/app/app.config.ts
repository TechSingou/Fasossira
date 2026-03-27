// apps/web/src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { APP_INITIALIZER } from '@angular/core';
import { AuthStore } from './core/auth/auth.store';
export const appConfig: ApplicationConfig = {
  providers: [
    // Zone.js optimisé
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router avec preloading + view transitions (Angular 17+)
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withViewTransitions(),
    ),

    // HTTP avec interceptors fonctionnels (pattern Angular 17+)
    provideHttpClient(
      withInterceptors([
        jwtInterceptor,    // Attache le Bearer token
        errorInterceptor,  // Gère 401 / refresh silencieux
      ]),
    ),

    // Animations
    provideAnimationsAsync(),

    {
      provide: APP_INITIALIZER,
      useFactory: (authStore: InstanceType<typeof AuthStore>) => () => authStore.restoreSession(),
      deps: [AuthStore],
      multi: true,
    },
  ],
};
