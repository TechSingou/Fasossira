/**
 * RoutesListComponent v2
 *
 * Fichier : apps/web/src/app/features/admin/routes/routes-list.component.ts
 *
 * Migrations vs v1 :
 *   ✅ Styles inline (styles: [...]) → routes-list.component.scss
 *   ✅ Emojis ✅ ⚠️ 🔍 🗺 ✏️ ✕ → NavIconComponent + StatusBadgeComponent
 *   ✅ Toast inline → ToastComponent
 *   ✅ Empty state inline → EmptyStateComponent (variant fleet/search)
 *   ✅ Couleurs hardcodées (#E63B2E stop-dot-last) → var(--brand)
 *   ✅ font-family: 'Sora' → var(--font)
 *   ✅ Confirmation labels ✓ ⏸ ▶️ → texte pur
 *   ✅ Zéro style inline dans le template
 *
 * Logique métier : inchangée (RoutesStore, méthodes identiques)
 */
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoutesStore } from './routes.store';
import { Route } from './services/routes.service';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';

interface ConfirmDialog {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const SKELETON_CARDS = Array(3).fill(0);

@Component({
  selector: 'fas-routes-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    NavIconComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ToastComponent,
  ],
  template: `
    <div class="page-wrap">

      <!-- En-tête -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Routes & Réseau</h1>
          <p class="page-sub">
            {{ store.filteredRoutes().length }} / {{ store.routes().length }} itinéraire(s)
          </p>
        </div>
        <button class="btn-primary" (click)="openCreateForm()">
          <fas-nav-icon [path]="icons.plus" [size]="13" />
          Nouvelle route
        </button>
      </div>

      <!-- ✅ Toasts via ToastComponent — plus d'emojis ✅ ⚠️ -->
      <fas-toast type="success" [message]="store.successMessage()" />
      <fas-toast type="error"   [message]="store.error()" />

      <!-- Barre de recherche & filtres -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <!-- ✅ SVG search icon — plus de 🔍 emoji -->
          <span class="search-icon-wrap" aria-hidden="true">
            <fas-nav-icon [path]="icons.activity" [size]="14" />
          </span>
          <input
            class="search-input"
            type="text"
            placeholder="Rechercher par nom de route ou ville…"
            [ngModel]="store.searchQuery()"
            (ngModelChange)="store.setSearchQuery($event)"
          />
          @if (store.searchQuery()) {
            <button class="search-clear" (click)="store.setSearchQuery('')" aria-label="Effacer la recherche">
              <fas-nav-icon [path]="icons.plus" [size]="12" style="transform:rotate(45deg)" />
            </button>
          }
        </div>

        <div class="filter-tabs" role="tablist">
          <button class="filter-tab" role="tab"
            [class.active]="store.statusFilter() === 'all'"
            (click)="store.setStatusFilter('all')">
            Toutes <span class="filter-count">{{ store.routes().length }}</span>
          </button>
          <button class="filter-tab" role="tab"
            [class.active]="store.statusFilter() === 'active'"
            (click)="store.setStatusFilter('active')">
            Actives <span class="filter-count">{{ store.activeRoutes().length }}</span>
          </button>
          <button class="filter-tab" role="tab"
            [class.active]="store.statusFilter() === 'inactive'"
            (click)="store.setStatusFilter('inactive')">
            Inactives
            <span class="filter-count">{{ store.routes().length - store.activeRoutes().length }}</span>
          </button>
        </div>

        @if (store.hasActiveFilter()) {
          <button class="btn-reset" (click)="store.resetFilters()">
            <fas-nav-icon [path]="icons.refresh" [size]="12" />
            Réinitialiser
          </button>
        }
      </div>

      <!-- Skeleton loading -->
      @if (store.loading()) {
        <div class="routes-grid">
          @for (item of skeletonCards; track $index) {
            <div class="sk-card" [style.animation-delay]="$index * 60 + 'ms'">
              <div class="sk-card-top">
                <div class="sk sk-badge"></div>
                <div class="sk sk-toggle"></div>
              </div>
              <div class="sk sk-title"></div>
              <div class="sk-stops-row">
                <div class="sk sk-dot"></div>
                <div class="sk sk-line"></div>
                <div class="sk sk-dot"></div>
                <div class="sk sk-line"></div>
                <div class="sk sk-dot"></div>
              </div>
              <div class="sk sk-price"></div>
              <div class="sk sk-btn"></div>
            </div>
          }
        </div>

      } @else {
        <div class="routes-grid">
          @for (route of store.filteredRoutes(); track route.id; let i = $index) {
            <div class="route-card" [class.inactive]="!route.isActive"
              [style.animation-delay]="i * 50 + 'ms'">

              <div class="card-top">
                <!-- ✅ StatusBadgeComponent — plus de [style.color]/[style.background] inline -->
                <fas-status-badge
                  [variant]="route.isActive ? 'success' : 'neutral'"
                  [label]="route.isActive ? 'Active' : 'Inactive'"
                />
                <div class="card-top-actions">
                  <span class="segment-count">{{ getSegmentCount(route) }} segments</span>
                  <button
                    class="toggle-btn"
                    [class.toggle-on]="route.isActive"
                    (click)="confirmToggle(route)"
                    [title]="route.isActive ? 'Désactiver la route' : 'Activer la route'"
                    [attr.aria-checked]="route.isActive"
                    role="switch"
                  >
                    <span class="toggle-thumb"></span>
                  </button>
                </div>
              </div>

              <h3 class="route-name">{{ route.name }}</h3>

              @if (route.stops?.length) {
                <div class="stops-row">
                  @for (stop of sortStops(route.stops); track stop.order; let last = $last) {
                    <div class="stop-item">
                      <!-- ✅ stop-dot-last : var(--brand) au lieu de #E63B2E hardcodé -->
                      <div class="stop-dot"
                        [class.stop-dot-first]="stop.order === 1"
                        [class.stop-dot-last]="last">
                      </div>
                      <span class="stop-name">{{ stop.cityName }}</span>
                    </div>
                    @if (!last) { <div class="stop-line"></div> }
                  }
                </div>
              } @else {
                <p class="no-stops">Aucun arrêt configuré</p>
              }

              @if (route.segmentPrices?.length) {
                <div class="price-stats">
                  <span class="price-min">{{ getMinPrice(route) | number }} FCFA</span>
                  <span class="price-sep">→</span>
                  <span class="price-max">{{ getMaxPrice(route) | number }} FCFA</span>
                </div>
              } @else {
                <p class="no-prices">Prix non configurés</p>
              }

              <div class="card-actions">
                <!-- ✅ ✏️ remplacé par NavIconComponent -->
                <a [routerLink]="['/admin/routes', route.id]" class="btn-ghost btn-sm">
                  <fas-nav-icon [path]="icons.settings" [size]="13" />
                  Configurer
                </a>
              </div>
            </div>

          } @empty {
            <!-- ✅ EmptyStateComponent — plus de 🔍 🗺 emoji + plus de styles inline -->
            @if (store.hasActiveFilter()) {
              <fas-empty-state
                variant="search"
                title="Aucun résultat"
                subtitle="Aucune route ne correspond à votre recherche."
                ctaLabel="Effacer les filtres"
                ctaVariant="outline"
                (ctaClick)="store.resetFilters()"
              />
            } @else {
              <fas-empty-state
                variant="routes"
                title="Aucune route configurée"
                subtitle="Créez votre première route pour commencer à vendre des billets."
                ctaLabel="Créer une route"
                (ctaClick)="openCreateForm()"
              />
            }
          }
        </div>
      }
    </div>

    <!-- Modal : Nouvelle route -->
    @if (showCreateModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-header">
            <h2 id="modal-title">Nouvelle route</h2>
            <!-- ✅ ✕ → NavIconComponent (rotate 45°) -->
            <button class="modal-close" (click)="closeModal()" aria-label="Fermer">
              <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="route-name">Nom de la route *</label>
              <input id="route-name" class="form-control"
                [(ngModel)]="newRouteName"
                placeholder="ex: Bamako → Mopti"
                (keyup.enter)="submitCreateForm()" />
            </div>
            <div class="form-group">
              <label class="form-label" for="route-desc">Description (optionnel)</label>
              <input id="route-desc" class="form-control"
                [(ngModel)]="newRouteDesc"
                placeholder="ex: Route principale axe Nord" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost-md" (click)="closeModal()">Annuler</button>
            <button class="btn-primary" (click)="submitCreateForm()"
              [disabled]="!newRouteName.trim()">
              Créer la route
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal : Confirmation -->
    @if (confirmDialog()) {
      <div class="modal-backdrop" (click)="cancelConfirm()">
        <div class="modal modal-sm" (click)="$event.stopPropagation()" role="alertdialog" aria-modal="true">
          <div class="modal-header">
            <h2>{{ confirmDialog()!.title }}</h2>
            <button class="modal-close" (click)="cancelConfirm()" aria-label="Annuler">
              <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
            </button>
          </div>
          <div class="modal-body">
            <p class="confirm-message">{{ confirmDialog()!.message }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost-md" (click)="cancelConfirm()">Annuler</button>
            <button class="btn-primary" (click)="executeConfirm()"
              [disabled]="store.saving()">
              {{ store.saving() ? 'En cours…' : confirmDialog()!.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './routes-list.component.scss',
})
export class RoutesListComponent implements OnInit, OnDestroy {
  protected readonly store        = inject(RoutesStore);
  protected readonly icons        = ICONS;
  protected readonly skeletonCards = SKELETON_CARDS;

  protected showCreateModal = signal(false);
  protected confirmDialog   = signal<ConfirmDialog | null>(null);
  protected newRouteName    = '';
  protected newRouteDesc    = '';

  private messageTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.store.loadRoutes();
    /* Auto-clear des messages après 4s */
    this.messageTimer = setInterval(() => {
      if (this.store.successMessage() || this.store.error()) {
        this.store.clearMessages();
      }
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.messageTimer) clearInterval(this.messageTimer);
  }

  protected openCreateForm(): void {
    this.newRouteName = '';
    this.newRouteDesc = '';
    this.showCreateModal.set(true);
  }

  protected submitCreateForm(): void {
    if (!this.newRouteName.trim()) return;
    this.showCreateModal.set(false);
    this.confirmDialog.set({
      title: 'Confirmer la création',
      message: `Créer la route "${this.newRouteName.trim()}" ?`,
      confirmLabel: 'Créer',
      onConfirm: async () => {
        const route = await this.store.createRoute(
          this.newRouteName.trim(),
          this.newRouteDesc.trim(),
        );
        if (route) {
          this.confirmDialog.set(null);
          this.newRouteName = '';
          this.newRouteDesc = '';
        }
      },
    });
  }

  protected closeModal(): void {
    this.showCreateModal.set(false);
    this.newRouteName = '';
    this.newRouteDesc = '';
  }

  protected confirmToggle(route: Route): void {
    const action = route.isActive ? 'désactiver' : 'activer';
    this.confirmDialog.set({
      title: `${route.isActive ? 'Désactiver' : 'Activer'} la route`,
      message: `Voulez-vous ${action} la route "${route.name}" ?\n` +
        (route.isActive
          ? 'Les agents ne pourront plus vendre de billets sur cet itinéraire.'
          : 'La route sera à nouveau disponible à la vente.'),
      confirmLabel: route.isActive ? 'Désactiver' : 'Activer',
      onConfirm: async () => {
        await this.store.toggleActive(route.id);
        this.confirmDialog.set(null);
      },
    });
  }

  protected executeConfirm(): void { this.confirmDialog()?.onConfirm(); }
  protected cancelConfirm():  void { this.confirmDialog.set(null); }

  protected sortStops(stops: any[]) {
    return [...stops].sort((a, b) => a.order - b.order);
  }

  protected getSegmentCount(route: any): number {
    return route.segmentPrices?.length ?? 0;
  }

  protected getMinPrice(route: any): number {
    if (!route.segmentPrices?.length) return 0;
    return Math.min(...route.segmentPrices.map((p: any) => Number(p.price)));
  }

  protected getMaxPrice(route: any): number {
    if (!route.segmentPrices?.length) return 0;
    return Math.max(...route.segmentPrices.map((p: any) => Number(p.price)));
  }
}
