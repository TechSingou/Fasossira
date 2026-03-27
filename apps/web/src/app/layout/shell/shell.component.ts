/**
 * ShellComponent v2
 *
 * Fichier : apps/web/src/app/layout/shell/shell.component.ts
 *
 * Changements vs v1 :
 *   ✅ Emojis → NavIconComponent (SVG Lucide)
 *   ✅ Breadcrumb dynamique → BreadcrumbComponent
 *   ✅ Logout unicode ↪ → SVG logout icon
 *   ✅ Notification bell 🔔 → SVG bell icon
 *   ✅ Toggle sidebar accessible sur desktop ET mobile
 *   ✅ Utilise ICONS depuis icons.ts (zéro emoji hardcodé)
 *   ✅ Interface NavItem strictement typée
 *   ✅ Styles inline → classes CSS depuis shell.component.scss
 *   ✅ Couleur signature unique (suppression brand-accent rouge)
 */
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Éclaircit (+) ou assombrit (-) une couleur hex de `amount` points (0-100).
 * Utilisé pour calculer les tokens dérivés (--brand-dark, --brand-lighter, etc.)
 * à partir de la couleur signature choisie par l'admin.
 */
function shadeHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(amount * 2.55)));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + Math.round(amount * 2.55)));
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(amount * 2.55)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}


import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { BrandingStore } from '../../features/admin/settings/branding.store';
import { UserRole } from '@fasossira/shared-types';
import { NavIconComponent } from '../../shared/components/nav-icon/nav-icon.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ICONS } from '../../shared/tokens/icons';

/* ── Types stricts ──────────────────────────────────────── */
interface NavItem {
  /** Clé dans ICONS — plus d'emoji, plus de string libre */
  iconKey: keyof typeof ICONS;
  label:   string;
  route:   string;
  badge?:  string | number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'fas-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NavIconComponent,
    BreadcrumbComponent,
  ],
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="sidebarCollapsed()" [class.sidebar-open]="sidebarOpen()">

      <!-- Backdrop mobile — ferme la sidebar au clic -->
      <div class="sidebar-backdrop" (click)="sidebarOpen.set(false)" aria-hidden="true"></div>

      <!-- ══════════════════════════════════════════════════
           SIDEBAR
      ══════════════════════════════════════════════════ -->
      <aside class="sidebar"
             [class.collapsed]="sidebarCollapsed()"
             [style.background]="isTenantUser() ? brandingStore.primaryColor() : null">

        <!-- Logo -->
        <div class="sidebar-logo">
          @if (isTenantUser() && brandingStore.hasLogo()) {
            <img [src]="brandingStore.logoUrl()"
                 alt="Logo" class="sidebar-logo-img" />
          } @else {
            <div class="logo-mark">Fs</div>
          }
          @if (!sidebarCollapsed() && !(isTenantUser() && brandingStore.hasLogo())) {
            <div class="logo-text-wrap">
              <span class="logo-text">
                {{ isTenantUser() ? brandingStore.displayName() || 'Fasossira' : 'Fasossira' }}
              </span>
              <span class="logo-sub">Transport SaaS</span>
            </div>
          }
        </div>

        <!-- Tenant badge (admin + agent seulement) -->
        @if (!authStore.isSuperAdmin() && !sidebarCollapsed()) {
          <div class="tenant-pill">
            <div class="tenant-pill-name">{{ authStore.user()?.name }}</div>
            <div class="tenant-pill-role">{{ roleLabel() }}</div>
          </div>
        }

        <!-- Navigation -->
        <nav class="sidebar-nav" aria-label="Navigation principale">
          @for (section of navSections(); track section.label) {
            <div class="nav-section">
              @if (!sidebarCollapsed()) {
                <div class="nav-section-label">{{ section.label }}</div>
              }
              @for (item of section.items; track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  class="nav-item"
                  [title]="sidebarCollapsed() ? item.label : ''"
                  [attr.aria-label]="item.label"
                >
                  <span class="nav-icon-wrap">
                    <fas-nav-icon
                      [path]="icons[item.iconKey]"
                      [size]="16"
                    />
                  </span>
                  @if (!sidebarCollapsed()) {
                    <span class="nav-label">{{ item.label }}</span>
                    @if (item.badge) {
                      <span class="nav-badge">{{ item.badge }}</span>
                    }
                  }
                </a>
              }
            </div>
          }
        </nav>

        <!-- Footer user -->
        <div class="sidebar-footer">
          <div class="user-row">
            <div class="user-avatar" aria-hidden="true">{{ userInitials() }}</div>
            @if (!sidebarCollapsed()) {
              <div class="user-info">
                <div class="user-name">{{ authStore.user()?.name || 'Utilisateur' }}</div>
                <div class="user-email">{{ authStore.user()?.email }}</div>
              </div>
              <!-- ✅ SVG logout icon — plus de ↪ unicode -->
              <button
                class="logout-btn"
                (click)="logout($event)"
                title="Déconnexion"
                aria-label="Se déconnecter"
              >
                <fas-nav-icon [path]="icons.logout" [size]="15" />
              </button>
            }
          </div>
        </div>
      </aside>

      <!-- ══════════════════════════════════════════════════
           TOPBAR
      ══════════════════════════════════════════════════ -->
      <header class="topbar">

        <!-- ✅ Toggle visible sur desktop ET mobile -->
        <button
          class="sidebar-toggle"
          (click)="onToggleSidebar()"
          [attr.aria-expanded]="!sidebarCollapsed() || sidebarOpen()"
          aria-label="Toggle navigation"
        >
          <fas-nav-icon [path]="icons.menu" [size]="18" />
        </button>

        <!-- ✅ Breadcrumb dynamique — plus de "Dashboard" hardcodé -->
        <fas-breadcrumb />


      </header>

      <!-- ══════════════════════════════════════════════════
           MAIN CONTENT
      ══════════════════════════════════════════════════ -->
      <main class="main-content">
        <!--
          ⚠️  NE PAS mettre overflow:hidden ici — crée un stacking context
              qui piège les position:fixed (modales, dropdowns) dans le grid.
              Le scroll est géré par .main-content-scroll.
        -->
        <div class="main-content-scroll">
          <router-outlet />
        </div>
      </main>

    </div>
  `,
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  protected readonly authStore     = inject(AuthStore);
  protected readonly brandingStore = inject(BrandingStore);
  protected readonly icons         = ICONS;
  private   readonly platformId    = inject(PLATFORM_ID);

  protected sidebarCollapsed = signal(false);
  /** Signal dédié pour l'overlay mobile — indépendant de sidebarCollapsed (desktop) */
  protected sidebarOpen      = signal(false);

  /** Vrai pour ADMIN et AGENT — voient le branding tenant */
  protected readonly isTenantUser = computed(
    () => this.authStore.isAdmin() || this.authStore.isAgent(),
  );

  /** TODO étape 6 : brancher sur un store notifications */
  protected readonly hasNotifications = signal(true);

  constructor() {
    /**
     * ✅ FIX : Synchronise primaryColor → CSS custom properties sur :root
     *
     * Problème : --brand est défini statiquement dans styles.scss (#0B3D91).
     * Quand l'admin choisit une autre couleur, la sidebar change via
     * [style.background] mais tous les composants qui utilisent var(--brand)
     * restent en bleu — car --brand n'est jamais mis à jour.
     *
     * Solution : effect() qui écoute primaryColor() et met à jour --brand
     * et ses dérivés sur document.documentElement à chaque changement.
     */
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      if (!this.isTenantUser()) return;

      const hex = this.brandingStore.primaryColor();
      if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return;

      const root = document.documentElement;
      root.style.setProperty('--brand',         hex);
      root.style.setProperty('--brand-dark',    shadeHex(hex, -10));
      root.style.setProperty('--brand-mid',     shadeHex(hex, +15));
      root.style.setProperty('--brand-light',   shadeHex(hex, +35));
      root.style.setProperty('--brand-lighter', shadeHex(hex, +70));
    });
  }

  /**
   * Toggle sidebar :
   * - Desktop (>900px) : collapse/expand inline
   * - Mobile  (<900px) : ouvre/ferme l'overlay
   * Détecté via window.innerWidth — simple et sans imports supplémentaires.
   */
  protected onToggleSidebar(): void {
    if (isPlatformBrowser(this.platformId) && window.innerWidth <= 900) {
      this.sidebarOpen.update(v => !v);
    } else {
      this.sidebarCollapsed.update(v => !v);
    }
  }

  ngOnInit(): void {
    const isTenantUser = this.authStore.isAdmin() || this.authStore.isAgent();
    if (isTenantUser) {
      this.brandingStore.loadSettings(this.authStore.companyId());
    }
  }

  protected userInitials(): string {
    return (this.authStore.user()?.name || '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  protected roleLabel(): string {
    const map: Record<string, string> = {
      ADMIN:       'Administrateur',
      AGENT:       'Agent',
      SUPER_ADMIN: 'Super Admin',
    };
    return map[this.authStore.user()?.role ?? ''] ?? '';
  }

  protected navSections(): NavSection[] {
    const role = this.authStore.user()?.role;
    if (role === UserRole.SUPER_ADMIN) return this.superAdminNav;
    if (role === UserRole.ADMIN)       return this.adminNav;
    return this.agentNav;
  }

  protected logout(event: Event): void {
    event.stopPropagation();
    this.authStore.logout();
  }

  /* ── Navigation configs ──────────────────────────────── */
  private readonly superAdminNav: NavSection[] = [
    {
      label: 'Plateforme',
      items: [
        { iconKey: 'dashboard',   label: 'Vue globale',  route: '/super-admin/dashboard' },
        { iconKey: 'globe',       label: 'Tenants',      route: '/super-admin/tenants' },
        { iconKey: 'creditCard',  label: 'Plans SaaS',   route: '/super-admin/plans' },
      ],
    },
  ];

  private readonly adminNav: NavSection[] = [
    {
      label: 'Principal',
      items: [
        { iconKey: 'dashboard', label: 'Tableau de bord', route: '/admin/dashboard' },
      ],
    },
    {
      label: 'Exploitation',
      items: [
        { iconKey: 'clock',    label: 'Horaires',           route: '/admin/trips' },
        { iconKey: 'calendar', label: 'Voyages Planifiés',  route: '/admin/schedules' },
      ],
    },
    {
      label: 'Réseau',
      items: [
        { iconKey: 'map', label: 'Routes & Arrêts', route: '/admin/routes' },
        { iconKey: 'bus', label: 'Flotte Bus',      route: '/admin/fleet' },
      ],
    },
    {
      label: 'Vente',
      items: [
        { iconKey: 'ticket', label: 'Réservations', route: '/admin/reservations' },
        { iconKey: 'users',  label: 'Passagers',    route: '/admin/passengers' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { iconKey: 'building', label: 'Agences & Agents', route: '/admin/agencies' },
        { iconKey: 'settings', label: 'Paramètres',       route: '/admin/settings' },
      ],
    },
  ];

  private readonly agentNav: NavSection[] = [
    {
      label: 'Vente',
      items: [
        { iconKey: 'ticket',        label: 'Vente Guichet',  route: '/agent/ticket-office' },
        { iconKey: 'smartphone',    label: 'Vente en Route', route: '/agent/on-route' },
      ],
    },
    {
      label: 'Suivi',
      items: [
        { iconKey: 'clipboardList', label: 'Mes réservations', route: '/agent/reservations' },
      ],
    },
  ];
}
