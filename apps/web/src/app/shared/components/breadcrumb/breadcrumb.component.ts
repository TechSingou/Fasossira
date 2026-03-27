/**
 * BreadcrumbComponent
 *
 * Fichier : apps/web/src/app/shared/components/breadcrumb/breadcrumb.component.ts
 *
 * Breadcrumb entièrement dynamique, construit depuis :
 *   1. Les données de route (route.data['breadcrumb'])
 *   2. En fallback : le segment d'URL humanisé
 *
 * Remplace le hardcode "Dashboard" dans shell.component.ts.
 *
 * Usage dans shell.component.ts :
 *   <fas-breadcrumb />
 *
 * Usage dans les routes (admin.routes.ts) pour personnaliser :
 *   {
 *     path: 'routes/:id',
 *     data: { breadcrumb: 'Détail route' },
 *     ...
 *   }
 */
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { NavIconComponent } from '../nav-icon/nav-icon.component';
import { ICONS } from '../../tokens/icons';

export interface BreadcrumbItem {
  label: string;
  url: string | null; /* null = dernier item (non cliquable) */
}

@Component({
  selector: 'fas-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavIconComponent],
  template: `
    <nav class="breadcrumb" aria-label="Fil d'Ariane">

      <!-- Icône home cliquable -->
      <a class="bc-home" [routerLink]="homeRoute()" aria-label="Accueil">
        <fas-nav-icon [path]="icons.home" [size]="13" />
      </a>

      @for (item of crumbs(); track item.url; let last = $last) {
        <span class="bc-sep" aria-hidden="true">›</span>

        @if (!last && item.url) {
          <a class="bc-link" [routerLink]="item.url">{{ item.label }}</a>
        } @else {
          <span class="bc-current" aria-current="page">{{ item.label }}</span>
        }
      }

    </nav>
  `,
  styles: [`
    :host { display: block; }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: .78rem;
      color: var(--gray-400);
      flex: 1;
    }

    .bc-home {
      color: var(--gray-500);
      text-decoration: none;
      display: flex;
      align-items: center;
      padding: 2px;
      border-radius: var(--radius-xs);
      transition: color .12s;

      &:hover { color: var(--brand); }
    }

    .bc-sep {
      color: var(--gray-300);
      font-size: 11px;
      user-select: none;
    }

    .bc-link {
      color: var(--gray-500);
      text-decoration: none;
      font-weight: 500;
      border-radius: var(--radius-xs);
      padding: 1px 3px;
      transition: color .12s;

      &:hover { color: var(--brand); }
    }

    .bc-current {
      color: var(--gray-800);
      font-weight: 600;
    }
  `],
})
export class BreadcrumbComponent implements OnInit {
  protected readonly icons = ICONS;

  private readonly router        = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef    = inject(DestroyRef);

  protected readonly crumbs    = signal<BreadcrumbItem[]>([]);
  protected readonly homeRoute = signal<string>('/');

  ngOnInit(): void {
    /* Build immédiatement au chargement */
    this.build();

    /* Rebuild à chaque navigation */
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.build());
  }

  private build(): void {
    const items: BreadcrumbItem[] = [];
    let route: ActivatedRoute | null = this.activatedRoute.root;
    let url = '';

    while (route) {
      const children = route.children;

      for (const child of children) {
        /* On ne traite que la route active */
        const segments = child.snapshot.url;
        if (!segments.length) {
          route = child;
          break;
        }

        url += '/' + segments.map(s => s.path).join('/');

        /* Label : data['breadcrumb'] > segment humanisé */
        const rawLabel: string =
          child.snapshot.data['breadcrumb'] ||
          this.humanize(segments[segments.length - 1].path);

        items.push({ label: rawLabel, url });

        route = child;
        break;
      }

      /* Plus d'enfants — on sort */
      if (!children.length) break;
    }

    /* Détermine la route "home" selon le rôle (premier segment d'URL) */
    const firstSegment = this.router.url.split('/')[1] ?? 'admin';
    this.homeRoute.set(`/${firstSegment}/dashboard`);

    this.crumbs.set(items);
  }

  /**
   * Transforme un segment d'URL en label lisible :
   *   "ticket-office"  → "Ticket office"
   *   "admin"          → "Admin"
   *   "on-route"       → "On route"
   */
  private humanize(segment: string): string {
    return segment
      .replace(/-/g, ' ')
      .replace(/^./, c => c.toUpperCase());
  }
}
