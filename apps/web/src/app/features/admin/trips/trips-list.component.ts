/**
 * TripsListComponent v2
 *
 * Fichier : apps/web/src/app/features/admin/trips/trips-list.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] inline → trips-list.component.scss
 *   ✅ Toasts ✅ ⚠️ → ToastComponent
 *   ✅ Empty state ⏰ → EmptyStateComponent (variant 'schedules')
 *   ✅ Status pills .active/.inactive → StatusBadgeComponent
 *   ✅ Emojis ✏️ ⏸ ▶️ 🗑 🔒 → NavIconComponent + texte
 *   ✅ Titres dialog 🗑 → texte pur
 *   ✅ font-family: 'Sora' inline → var(--font)
 *   ✅ animation-delay style inline conservé (technique Angular valide)
 *
 * Logique métier : inchangée (TripsStore, RoutesStore, méthodes identiques)
 */
import {
  Component, ChangeDetectionStrategy, inject,
  OnInit, OnDestroy, signal, computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TripsStore } from './trips.store';
import { RoutesStore } from '../routes/routes.store';
import { Trip } from './services/trips.service';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';

interface ConfirmDialog {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void;
}

const SKELETON_ROWS = Array(5).fill(0);

@Component({
  selector: 'fas-trips-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NavIconComponent, EmptyStateComponent, StatusBadgeComponent, ToastComponent],
  template: `
    <div class="page-wrap">

      <!-- En-tête -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Horaires de Voyage</h1>
          <p class="page-sub">
            {{ store.filteredTrips().length }} horaire(s) · {{ store.activeTrips().length }} actif(s)
          </p>
        </div>
        <button class="btn-primary" (click)="openCreateModal()">
          <fas-nav-icon [path]="icons.plus" [size]="13" />
          Nouvel horaire
        </button>
      </div>

      <!-- ✅ ToastComponent — plus de ✅ ⚠️ inline -->
      <fas-toast type="success" [message]="store.successMessage()" />
      <fas-toast type="error"   [message]="store.error()" />

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="form-group filter-group">
          <label class="form-label">Route</label>
          <select class="form-control filter-select"
            [ngModel]="store.filterRouteId()"
            (ngModelChange)="store.setFilterRouteId($event)">
            <option value="">Toutes les routes</option>
            @for (r of activeRoutes(); track r.id) {
              <option [value]="r.id">{{ r.name }}</option>
            }
          </select>
        </div>

        <div class="status-tabs">
          @for (tab of activeTabs; track tab.key) {
            <button class="status-tab"
              [class.active]="store.filterActive() === tab.key"
              (click)="store.setFilterActive(tab.key)">
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      <!-- Skeleton -->
      @if (store.loading()) {
        <div class="card">
          <table class="trips-table">
            <thead>
              <tr><th>Route</th><th>Départ</th><th>Arrivée</th><th>Durée</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              @for (row of skeletonRows; track $index) {
                <tr class="sk-row" [style.animation-delay]="$index * 50 + 'ms'">
                  <td><div class="sk sk-route"></div></td>
                  <td><div class="sk sk-time"></div></td>
                  <td><div class="sk sk-time"></div></td>
                  <td><div class="sk sk-dur"></div></td>
                  <td><div class="sk sk-badge"></div></td>
                  <td><div class="sk sk-actions"></div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

      } @else {
        <div class="card">
          <table class="trips-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Départ</th>
                <th>Arrivée</th>
                <th>Durée</th>
                <th>Statut</th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (trip of store.filteredTrips(); track trip.id; let i = $index) {
                <tr class="trip-row" [class.inactive]="!trip.isActive"
                  [style.animation-delay]="i * 35 + 'ms'">

                  <td class="td-route">
                    <span class="route-name">{{ trip.route?.name ?? '—' }}</span>
                  </td>

                  <td class="td-time">
                    <span class="time-chip dep">{{ trip.departureTime }}</span>
                  </td>

                  <td class="td-time">
                    <span class="time-chip arr">{{ trip.arrivalTime }}</span>
                  </td>

                  <td class="td-dur">
                    <span class="dur-badge">{{ getDuration(trip) }}</span>
                  </td>

                  <td class="td-status">
                    <!-- ✅ StatusBadgeComponent — plus de <span class="status-pill active/inactive"> -->
                    <fas-status-badge
                      [variant]="trip.isActive ? 'success' : 'neutral'"
                      [label]="trip.isActive ? 'Actif' : 'Inactif'"
                    />
                  </td>

                  <td class="td-actions">
                    <!-- ✅ ✏️ → SVG icon -->
                    <button class="action-btn" (click)="openEditModal(trip)" title="Modifier">
                      <fas-nav-icon [path]="icons.settings" [size]="14" />
                    </button>
                    <!-- ✅ ⏸ ▶️ → SVG icon -->
                    <button class="action-btn" (click)="toggleActive(trip)"
                      [title]="trip.isActive ? 'Désactiver' : 'Activer'">
                      <fas-nav-icon
                        [path]="trip.isActive ? icons.warning : icons.check"
                        [size]="14"
                      />
                    </button>
                    <!-- ✅ 🗑 → SVG icon, bouton danger -->
                    <button class="action-btn action-btn--danger"
                      (click)="confirmDelete(trip)" title="Supprimer">
                      <fas-nav-icon [path]="icons.warning" [size]="14" />
                    </button>
                  </td>
                </tr>

              } @empty {
                <tr>
                  <td colspan="6" class="empty-cell">
                    <!-- ✅ EmptyStateComponent — plus de ⏰ emoji -->
                    @if (store.filterRouteId() || store.filterActive() !== 'ALL') {
                      <fas-empty-state
                        variant="search"
                        title="Aucun horaire trouvé"
                        subtitle="Essayez de changer les filtres."
                        ctaLabel="Réinitialiser"
                        ctaVariant="outline"
                        (ctaClick)="resetFilters()"
                      />
                    } @else {
                      <fas-empty-state
                        variant="schedules"
                        title="Aucun horaire configuré"
                        subtitle="Créez votre premier horaire de voyage."
                        ctaLabel="Nouvel horaire"
                        (ctaClick)="openCreateModal()"
                      />
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Modal Créer / Modifier -->
    @if (showFormModal()) {
      <div class="modal-backdrop" (click)="closeFormModal()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>{{ editingTrip() ? 'Modifier l\'horaire' : 'Nouvel horaire' }}</h2>
            <button class="modal-close" (click)="closeFormModal()" aria-label="Fermer">
              <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Route *</label>
              <select class="form-control"
                [ngModel]="formRouteId()"
                (ngModelChange)="formRouteId.set($event)"
                [disabled]="!!editingTrip()">
                <option value="">— Sélectionner une route —</option>
                @for (r of activeRoutes(); track r.id) {
                  <option [value]="r.id">{{ r.name }}</option>
                }
              </select>
              <!-- ✅ 🔒 → texte + icône SVG -->
              @if (editingTrip()) {
                <p class="form-hint">
                  <fas-nav-icon [path]="icons.info" [size]="12" color="var(--gray-400)" />
                  La route ne peut pas être modifiée
                </p>
              }
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Heure de départ *</label>
                <input class="form-control" type="time"
                  [ngModel]="formDepartureTime()"
                  (ngModelChange)="formDepartureTime.set($event)" />
              </div>
              <div class="form-group">
                <label class="form-label">Heure d'arrivée *</label>
                <input class="form-control" type="time"
                  [ngModel]="formArrivalTime()"
                  (ngModelChange)="formArrivalTime.set($event)" />
              </div>
            </div>

            @if (getFormDuration()) {
              <div class="duration-preview">
                <fas-nav-icon [path]="icons.clock" [size]="13" color="var(--brand)" />
                <span>Durée : {{ getFormDuration() }}</span>
                @if (isOvernightTrip()) {
                  <span class="overnight-tag">Voyage nocturne</span>
                }
              </div>
            }

            @if (formError()) {
              <p class="form-error">{{ formError() }}</p>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-ghost-md" (click)="closeFormModal()">Annuler</button>
            <button class="btn-primary" (click)="submitForm()"
              [disabled]="store.saving() || !isFormValid()">
              {{ store.saving() ? 'En cours…' : (editingTrip() ? 'Enregistrer' : 'Créer') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Confirmation -->
    @if (confirmDialog()) {
      <div class="modal-backdrop" (click)="cancelConfirm()">
        <div class="modal modal-sm" (click)="$event.stopPropagation()" role="alertdialog">
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
            <button [class]="confirmDialog()!.danger ? 'btn-danger-md' : 'btn-primary'"
              (click)="executeConfirm()" [disabled]="store.saving()">
              {{ store.saving() ? 'En cours…' : confirmDialog()!.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './trips-list.component.scss',
})
export class TripsListComponent implements OnInit, OnDestroy {
  protected readonly store      = inject(TripsStore);
  private  readonly routesStore = inject(RoutesStore);
  protected readonly icons      = ICONS;
  protected readonly skeletonRows = SKELETON_ROWS;

  protected showFormModal  = signal(false);
  protected editingTrip    = signal<Trip | null>(null);
  protected confirmDialog  = signal<ConfirmDialog | null>(null);

  protected formRouteId       = signal('');
  protected formDepartureTime = signal('');
  protected formArrivalTime   = signal('');

  protected readonly activeTabs = [
    { key: 'ALL'      as const, label: 'Tous'     },
    { key: 'ACTIVE'   as const, label: 'Actifs'   },
    { key: 'INACTIVE' as const, label: 'Inactifs' },
  ];

  protected activeRoutes = computed(() =>
    this.routesStore.routes().filter(r => r.isActive)
  );

  private messageTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.store.loadTrips();
    if (!this.routesStore.routes().length) this.routesStore.loadRoutes();
    this.messageTimer = setInterval(() => {
      if (this.store.successMessage() || this.store.error()) this.store.clearMessages();
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.messageTimer) clearInterval(this.messageTimer);
  }

  protected getDuration(trip: Trip): string {
    return this.calcDuration(trip.departureTime, trip.arrivalTime);
  }

  protected getFormDuration(): string {
    return this.calcDuration(this.formDepartureTime(), this.formArrivalTime());
  }

  protected isOvernightTrip(): boolean {
    const dep = this.formDepartureTime(), arr = this.formArrivalTime();
    if (!dep || !arr) return false;
    return arr <= dep;
  }

  private calcDuration(dep: string, arr: string): string {
    if (!dep || !arr) return '';
    const [dh, dm] = dep.split(':').map(Number);
    const [ah, am] = arr.split(':').map(Number);
    let minutes = (ah * 60 + am) - (dh * 60 + dm);
    if (minutes <= 0) minutes += 24 * 60;
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  }

  protected formError = computed(() => {
    if (!this.formRouteId())       return 'Sélectionnez une route';
    if (!this.formDepartureTime()) return "L'heure de départ est requise";
    if (!this.formArrivalTime())   return "L'heure d'arrivée est requise";
    return null;
  });

  protected isFormValid = computed(() => !this.formError());

  protected resetFilters(): void {
    this.store.setFilterRouteId('');
    this.store.setFilterActive('ALL');
  }

  protected openCreateModal(): void {
    this.editingTrip.set(null);
    this.formRouteId.set(this.store.filterRouteId() || '');
    this.formDepartureTime.set('');
    this.formArrivalTime.set('');
    this.showFormModal.set(true);
  }

  protected openEditModal(trip: Trip): void {
    this.editingTrip.set(trip);
    this.formRouteId.set(trip.routeId);
    this.formDepartureTime.set(trip.departureTime);
    this.formArrivalTime.set(trip.arrivalTime);
    this.showFormModal.set(true);
  }

  protected closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingTrip.set(null);
    this.formRouteId.set('');
    this.formDepartureTime.set('');
    this.formArrivalTime.set('');
  }

  protected async submitForm(): Promise<void> {
    if (!this.isFormValid()) return;
    const trip = this.editingTrip();
    if (trip) {
      const ok = await this.store.updateTrip(trip.id, {
        departureTime: this.formDepartureTime(),
        arrivalTime:   this.formArrivalTime(),
      });
      if (ok) this.closeFormModal();
    } else {
      const created = await this.store.createTrip({
        routeId:       this.formRouteId(),
        departureTime: this.formDepartureTime(),
        arrivalTime:   this.formArrivalTime(),
      });
      if (created) this.closeFormModal();
    }
  }

  protected async toggleActive(trip: Trip): Promise<void> {
    await this.store.updateTrip(trip.id, { isActive: !trip.isActive });
  }

  protected confirmDelete(trip: Trip): void {
    this.confirmDialog.set({
      title: 'Supprimer l\'horaire',
      message: `Supprimer l'horaire ${trip.departureTime}→${trip.arrivalTime} sur "${trip.route?.name}" ?\nLes schedules futurs liés seront affectés.`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        await this.store.deleteTrip(trip.id);
        this.confirmDialog.set(null);
      },
    });
  }

  protected executeConfirm(): void { this.confirmDialog()?.onConfirm(); }
  protected cancelConfirm():  void { this.confirmDialog.set(null); }
}
