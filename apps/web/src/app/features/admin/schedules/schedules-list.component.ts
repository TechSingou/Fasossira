/**
 * SchedulesListComponent v2
 *
 * Fichier : apps/web/src/app/features/admin/schedules/schedules-list.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] inline → schedules-list.component.scss
 *   ✅ STATUS_CONFIG avec color/bg hardcodés → StatusBadgeComponent
 *   ✅ [style.color]/[style.background] sur .status-pill → StatusBadgeComponent
 *   ✅ Toasts ✅ ⚠️ → ToastComponent
 *   ✅ Empty state 📅 → EmptyStateComponent (variant 'schedules')
 *   ✅ Emojis 📅 ☰ 📋 ✏️ 🗑 → NavIconComponent + texte
 *   ✅ View toggle 📋 ☰ → NavIconComponent
 *   ✅ Bus icon 🚌 dans planning-bus → NavIconComponent
 *   ✅ Titres dialog ⏸ 🗑 → texte pur
 *
 * Logique métier : inchangée (toutes les méthodes identiques)
 */
import {
  Component, ChangeDetectionStrategy, inject,
  OnInit, signal, effect, DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SchedulesStore,
} from './schedules.store';
import {
  SchedulesApiService, AvailableBus, ScheduleStatus,
  GeneratePayload, TripSummary,
} from './services/schedules.service';
import { firstValueFrom } from 'rxjs';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent, BadgeVariant } from '../../../shared/components/status-badge/status-badge.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';

interface ConfirmDialog {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void;
}

/** ✅ Mapping status → BadgeVariant — remplace STATUS_CONFIG avec couleurs hardcodées */
const STATUS_BADGE: Record<ScheduleStatus, { variant: BadgeVariant; label: string }> = {
  SCHEDULED:   { variant: 'brand',   label: 'Planifié'  },
  IN_PROGRESS: { variant: 'warning', label: 'En cours'  },
  COMPLETED:   { variant: 'success', label: 'Terminé'   },
  CANCELLED:   { variant: 'neutral', label: 'Annulé'    },
};

const SKELETON_ROWS = Array(4).fill(0);

@Component({
  selector: 'fas-schedules-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NavIconComponent, EmptyStateComponent, StatusBadgeComponent, ToastComponent],
  template: `
    <div class="page-wrap">

      <!-- En-tête -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Voyages & Schedules</h1>
          <p class="page-sub">Planning et gestion des départs</p>
        </div>
        <div class="header-actions">
          <!-- ✅ 📅 → NavIconComponent -->
          <button class="btn-ghost-md" (click)="openGenerateModal()">
            <fas-nav-icon [path]="icons.calendar" [size]="14" />
            Générer en série
          </button>
          <button class="btn-primary" (click)="openCreateModal()">
            <fas-nav-icon [path]="icons.plus" [size]="13" />
            Planifier un voyage
          </button>
        </div>
      </div>

      <!-- ✅ ToastComponent -->
      <fas-toast type="success" [message]="store.successMessage()" />
      <fas-toast type="error"   [message]="store.error()" />

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="date-nav">
          <button class="date-btn" (click)="changeDate(-1)" aria-label="Jour précédent">
            <fas-nav-icon [path]="icons.chevronRight" [size]="14" style="transform:rotate(180deg)" />
          </button>
          <input class="date-input" type="date"
            [ngModel]="store.filterDate()"
            (ngModelChange)="onDateChange($event)" />
          <button class="date-btn" (click)="changeDate(1)" aria-label="Jour suivant">
            <fas-nav-icon [path]="icons.chevronRight" [size]="14" />
          </button>
          <button class="btn-today" (click)="goToday()">Aujourd'hui</button>
        </div>

        <div class="status-tabs">
          <button class="status-tab"
            [class.active]="store.filterStatus() === ''"
            (click)="onStatusChange('')">Tous</button>
          @for (entry of statusEntries; track entry.key) {
            <button class="status-tab"
              [class.active]="store.filterStatus() === entry.key"
              (click)="onStatusChange(entry.key)">
              {{ entry.label }}
            </button>
          }
        </div>

        <!-- ✅ View toggle : 📋 ☰ → NavIconComponent -->
        <div class="view-toggle">
          <button class="view-btn"
            [class.active]="store.viewMode() === 'planning'"
            (click)="switchView('planning')" title="Vue Planning">
            <fas-nav-icon [path]="icons.clipboardList" [size]="15" />
          </button>
          <button class="view-btn"
            [class.active]="store.viewMode() === 'list'"
            (click)="switchView('list')" title="Vue Liste">
            <fas-nav-icon [path]="icons.menu" [size]="15" />
          </button>
        </div>
      </div>

      <!-- Stats (vue planning) -->
      @if (store.viewMode() === 'planning') {
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">{{ store.planningStats().total }}</div>
            <div class="stat-label">Voyages</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ store.planningStats().scheduled }}</div>
            <div class="stat-label">Planifiés</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ store.planningStats().inProgress }}</div>
            <div class="stat-label">En cours</div>
          </div>
          <div class="stat-card stat-card--accent">
            <div class="stat-value">{{ store.planningStats().availableSeats }}</div>
            <div class="stat-label">Sièges dispo</div>
          </div>
        </div>
      }

      <!-- Skeleton -->
      @if (store.loading()) {
        <div class="skeleton-wrap">
          @for (row of skeletonRows; track $index) {
            <div class="sk-row" [style.animation-delay]="$index * 60 + 'ms'">
              <div class="sk sk-time"></div>
              <div class="sk-group">
                <div class="sk sk-title"></div>
                <div class="sk sk-sub"></div>
              </div>
              <div class="sk sk-bar"></div>
              <div class="sk sk-badge"></div>
              <div class="sk sk-actions"></div>
            </div>
          }
        </div>

      } @else {

        <!-- Vue Planning -->
        @if (store.viewMode() === 'planning') {
          <div class="view-pane" [class.slide-left]="slideDir === 'left'"
            [class.slide-right]="slideDir === 'right'"
            [class.view-fade]="slideDir === 'fade'">
            <div class="planning-list">
              @for (entry of store.filteredPlanning(); track entry.id; let i = $index) {
                <div class="planning-row" [class.cancelled]="entry.status === 'CANCELLED'"
                  [style.animation-delay]="i * 40 + 'ms'">

                  <div class="time-block">
                    <div class="time-dep">{{ entry.departureTime }}</div>
                    <div class="time-line"></div>
                    <div class="time-arr">{{ entry.arrivalTime }}</div>
                  </div>

                  <div class="planning-info">
                    <div class="planning-route">{{ entry.route }}</div>
                    <!-- ✅ 🚌 → NavIconComponent -->
                    <div class="planning-bus">
                      <fas-nav-icon [path]="icons.bus" [size]="13" color="var(--gray-400)" />
                      {{ entry.bus.plate }}
                    </div>
                  </div>

                  <div class="planning-seats">
                    <div class="seats-bar-wrap">
                      <div class="seats-bar" [style.width.%]="getOccupancyPct(entry)"></div>
                    </div>
                    <span class="seats-label">
                      {{ entry.availableSeats }} / {{ entry.totalSeats }} libres
                    </span>
                  </div>

                  <div class="planning-status">
                    <!-- ✅ StatusBadgeComponent — plus de [style.color]/[style.background] -->
                    <fas-status-badge
                      [variant]="statusBadge(entry.status).variant"
                      [label]="statusBadge(entry.status).label"
                    />
                  </div>

                  <div class="planning-actions">
                    @if (entry.status === 'SCHEDULED') {
                      <!-- ✅ ✏️ → NavIconComponent -->
                      <button class="action-btn" (click)="openEditModal(entry)" title="Modifier">
                        <fas-nav-icon [path]="icons.settings" [size]="13" />
                      </button>
                      <button class="action-btn" (click)="confirmCancel(entry.id, entry.route)">
                        Annuler
                      </button>
                    }
                    <!-- ✅ 🗑 → NavIconComponent -->
                    <button class="action-btn action-btn--danger"
                      (click)="confirmDelete(entry.id, entry.route)">
                      <fas-nav-icon [path]="icons.warning" [size]="13" />
                    </button>
                  </div>
                </div>

              } @empty {
                <!-- ✅ EmptyStateComponent — plus de 📅 emoji -->
                <fas-empty-state
                  variant="schedules"
                  [title]="store.filterStatus()
                    ? 'Aucun voyage &quot;' + statusBadge(store.filterStatus()!).label + '&quot; ce jour'
                    : 'Aucun voyage ce jour'"
                  subtitle="Planifiez un voyage ou générez une série."
                  ctaLabel="Planifier un voyage"
                  (ctaClick)="openCreateModal()"
                />
              }
            </div>
          </div>
        }

        <!-- Vue Liste -->
        @if (store.viewMode() === 'list') {
          <div class="view-pane view-fade">
            <div class="table-card">
              <table class="schedule-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Route</th><th>Départ</th><th>Arrivée</th>
                    <th>Bus</th><th>Sièges</th><th>Statut</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of store.filteredSchedules(); track s.id; let i = $index) {
                    <tr class="schedule-row" [class.row-cancelled]="s.status === 'CANCELLED'"
                      [style.animation-delay]="i * 30 + 'ms'">
                      <td class="td-mono">{{ s.date }}</td>
                      <td class="td-route">{{ s.trip?.route?.name ?? '—' }}</td>
                      <td class="td-mono">{{ s.trip?.departureTime }}</td>
                      <td class="td-mono">{{ s.trip?.arrivalTime }}</td>
                      <td class="td-mono">{{ s.bus?.plate }}</td>
                      <td>{{ s.totalSeats }}</td>
                      <td>
                        <!-- ✅ StatusBadgeComponent -->
                        <fas-status-badge
                          [variant]="statusBadge(s.status).variant"
                          [label]="statusBadge(s.status).label"
                        />
                      </td>
                      <td class="td-actions">
                        @if (s.status === 'SCHEDULED') {
                          <button class="action-btn" (click)="openEditModal(s)" title="Modifier">
                            <fas-nav-icon [path]="icons.settings" [size]="13" />
                          </button>
                          <button class="action-btn" (click)="confirmCancel(s.id, s.trip?.route?.name)">
                            Annuler
                          </button>
                        }
                        <button class="action-btn action-btn--danger"
                          (click)="confirmDelete(s.id, s.trip?.route?.name)">
                          <fas-nav-icon [path]="icons.warning" [size]="13" />
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="empty-cell">
                        <fas-empty-state
                          variant="search"
                          title="Aucun schedule trouvé"
                          subtitle="Essayez de changer la date ou les filtres."
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>

    <!-- Modal : Créer schedule -->
    @if (showCreateModal()) {
      <div class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>Planifier un voyage</h2>
            <button class="modal-close" (click)="closeCreateModal()" aria-label="Fermer">
              <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Horaire *</label>
              <select class="form-control" [(ngModel)]="createForm.tripId" (ngModelChange)="onTripChange()">
                <option value="">— Sélectionner un horaire —</option>
                @for (t of availableTrips(); track t.id) {
                  <option [value]="t.id">{{ t.routeName }} · {{ t.departureTime }}→{{ t.arrivalTime }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input class="form-control" type="date"
                [(ngModel)]="createForm.date" (ngModelChange)="onCreateDateChange()" />
            </div>
            <div class="form-group">
              <label class="form-label">Bus *</label>
              <select class="form-control" [(ngModel)]="createForm.busId"
                [disabled]="loadingBuses() || !createForm.tripId || !createForm.date">
                <option value="">
                  {{ loadingBuses() ? 'Chargement…' : '— Sélectionner un bus —' }}
                </option>
                @for (b of availableBuses(); track b.id) {
                  <option [value]="b.id">{{ b.plate }} · {{ b.capacity }} sièges</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost-md" (click)="closeCreateModal()">Annuler</button>
            <button class="btn-primary" (click)="submitCreate()"
              [disabled]="store.saving() || !createForm.tripId || !createForm.date || !createForm.busId">
              {{ store.saving() ? 'En cours…' : 'Planifier' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal : Modifier schedule -->
    @if (showEditModal()) {
      <div class="modal-backdrop" (click)="closeEditModal()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>Modifier le voyage</h2>
            <button class="modal-close" (click)="closeEditModal()" aria-label="Fermer">
              <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
            </button>
          </div>
          <div class="modal-body">
            @if (editError()) {
              <div class="alert-error">
                <fas-nav-icon [path]="icons.warning" [size]="14" color="currentColor" />
                {{ editError() }}
              </div>
            }
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-control" type="date"
                [(ngModel)]="editForm.date" (ngModelChange)="onEditDateChange()" />
            </div>
            <div class="form-group">
              <label class="form-label">Bus</label>
              <select class="form-control" [(ngModel)]="editForm.busId"
                [disabled]="loadingEditBuses()">
                <option value="">
                  {{ loadingEditBuses() ? 'Chargement…' : '— Sélectionner un bus —' }}
                </option>
                @for (b of editAvailableBuses(); track b.id) {
                  <option [value]="b.id">{{ b.plate }} · {{ b.capacity }} sièges</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost-md" (click)="closeEditModal()">Annuler</button>
            <button class="btn-primary" (click)="submitEdit()" [disabled]="store.saving()">
              {{ store.saving() ? 'En cours…' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal : Générer en série -->
    @if (showGenerateModal()) {
      <div class="modal-backdrop" (click)="closeGenerateModal()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>Générer des voyages en série</h2>
            <button class="modal-close" (click)="closeGenerateModal()" aria-label="Fermer">
              <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
            </button>
          </div>
          <div class="modal-body">
            @if (generateResult()) {
              <div class="generate-result">
                <fas-nav-icon [path]="icons.check" [size]="20" color="var(--success)" />
                <div>
                  <div class="result-title">{{ generateResult()!.created }} voyage(s) créés</div>
                  @if (generateResult()!.skipped.length) {
                    <div class="result-skipped">
                      {{ generateResult()!.skipped.length }} ignoré(s) : {{ generateResult()!.skipped.join(', ') }}
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="form-group">
                <label class="form-label">Horaire *</label>
                <select class="form-control" [(ngModel)]="generateForm.tripId">
                  <option value="">— Sélectionner un horaire —</option>
                  @for (t of availableTrips(); track t.id) {
                    <option [value]="t.id">{{ t.routeName }} · {{ t.departureTime }}→{{ t.arrivalTime }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Bus *</label>
                <select class="form-control" [(ngModel)]="generateForm.busId">
                  <option value="">— Sélectionner un bus —</option>
                  @for (b of allBuses(); track b.id) {
                    <option [value]="b.id">{{ b.plate }} · {{ b.capacity }} sièges</option>
                  }
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Date début *</label>
                  <input class="form-control" type="date" [(ngModel)]="generateForm.startDate" />
                </div>
                <div class="form-group">
                  <label class="form-label">Date fin *</label>
                  <input class="form-control" type="date" [(ngModel)]="generateForm.endDate" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Jours de la semaine *</label>
                <div class="weekdays-row">
                  @for (d of weekDays; track d.iso) {
                    <button type="button" class="day-btn"
                      [class.active]="generateForm.weekDays.includes(d.iso)"
                      (click)="toggleDay(d.iso)">
                      {{ d.label }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-ghost-md" (click)="closeGenerateModal()">
              {{ generateResult() ? 'Fermer' : 'Annuler' }}
            </button>
            @if (!generateResult()) {
              <button class="btn-primary" (click)="submitGenerate()"
                [disabled]="store.saving() || !isGenerateValid()">
                {{ store.saving() ? 'Génération…' : 'Générer' }}
              </button>
            }
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
  styleUrl: './schedules-list.component.scss',
})
export class SchedulesListComponent implements OnInit {
  protected readonly store      = inject(SchedulesStore);
  private  readonly api         = inject(SchedulesApiService);
  private  readonly destroyRef  = inject(DestroyRef);
  protected readonly icons      = ICONS;
  protected readonly skeletonRows = SKELETON_ROWS;

  protected showCreateModal   = signal(false);
  protected showEditModal     = signal(false);
  protected showGenerateModal = signal(false);
  protected confirmDialog     = signal<ConfirmDialog | null>(null);
  protected availableTrips    = signal<TripSummary[]>([]);
  protected availableBuses    = signal<AvailableBus[]>([]);
  protected editAvailableBuses = signal<AvailableBus[]>([]);
  protected editError         = signal<string | null>(null);
  protected allBuses          = signal<AvailableBus[]>([]);
  protected loadingBuses      = signal(false);
  protected loadingEditBuses  = signal(false);
  protected generateResult    = signal<{ created: number; skipped: string[] } | null>(null);
  protected editingSchedule   = signal<any | null>(null);

  protected slideDir: 'left' | 'right' | 'fade' = 'fade';

  protected createForm   = { tripId: '', busId: '', date: '' };
  protected editForm     = { date: '', busId: '' };
  protected generateForm: GeneratePayload & { weekDays: number[] } = {
    tripId: '', busId: '', startDate: '', endDate: '', weekDays: [1, 2, 3, 4, 5],
  };

  protected readonly weekDays = [
    { iso: 1, label: 'Lun' }, { iso: 2, label: 'Mar' }, { iso: 3, label: 'Mer' },
    { iso: 4, label: 'Jeu' }, { iso: 5, label: 'Ven' }, { iso: 6, label: 'Sam' }, { iso: 7, label: 'Dim' },
  ];

  protected readonly statusEntries = Object.entries(STATUS_BADGE).map(
    ([key, val]) => ({ key: key as ScheduleStatus, label: val.label }),
  );

  /** ✅ Méthode pure — remplace STATUS_CONFIG avec couleurs hardcodées */
  protected statusBadge(status: ScheduleStatus | string) {
    return STATUS_BADGE[status as ScheduleStatus] ?? { variant: 'neutral' as BadgeVariant, label: status };
  }

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const hasMessage = !!(this.store.successMessage() || this.store.error());
      if (this.toastTimer) { clearTimeout(this.toastTimer); this.toastTimer = null; }
      if (hasMessage) {
        this.toastTimer = setTimeout(() => this.store.clearMessages(), 5000);
      }
    });
    this.destroyRef.onDestroy(() => {
      if (this.toastTimer) clearTimeout(this.toastTimer);
    });
  }

  ngOnInit(): void {
    this.store.loadPlanning();
    this.loadTrips();
    this.loadAllBuses();
  }

  private reloadCurrentView(date?: string): void {
    const d = date ?? this.store.filterDate();
    const status = this.store.filterStatus() || undefined;
    if (this.store.viewMode() === 'planning') {
      this.store.loadPlanning(d);
    } else {
      this.store.loadSchedules({ date: d, status });
    }
  }

  protected onDateChange(date: string): void {
    const prev = this.store.filterDate();
    this.slideDir = date > prev ? 'left' : 'right';
    this.store.setFilterDate(date);
    this.reloadCurrentView(date);
  }

  protected changeDate(offset: number): void {
    const d = new Date(this.store.filterDate());
    d.setDate(d.getDate() + offset);
    this.onDateChange(d.toISOString().split('T')[0]);
  }

  protected goToday(): void {
    this.slideDir = 'fade';
    this.onDateChange(new Date().toISOString().split('T')[0]);
  }

  protected switchView(mode: 'planning' | 'list'): void {
    this.slideDir = 'fade';
    this.store.setViewMode(mode);
    this.reloadCurrentView();
  }

  protected onStatusChange(status: ScheduleStatus | ''): void {
    this.store.setFilterStatus(status);
    if (this.store.viewMode() === 'list') this.reloadCurrentView();
  }

  private async loadTrips(): Promise<void> {
    try {
      const trips = await firstValueFrom(this.api.getTrips());
      this.availableTrips.set(trips.filter(t => t.isActive));
    } catch { /* silencieux */ }
  }

  private async loadAllBuses(): Promise<void> {
    try {
      const buses = await firstValueFrom(this.api.getActiveBuses());
      this.allBuses.set(buses);
    } catch { /* silencieux */ }
  }

  protected async onTripChange(): Promise<void> {
    this.createForm.busId = '';
    await this.refreshAvailableBuses();
  }

  protected async onCreateDateChange(): Promise<void> {
    this.createForm.busId = '';
    await this.refreshAvailableBuses();
  }

  private async refreshAvailableBuses(): Promise<void> {
    if (!this.createForm.tripId || !this.createForm.date) return;
    this.loadingBuses.set(true);
    try {
      const buses = await firstValueFrom(this.api.getAvailableBuses(this.createForm.tripId, this.createForm.date));
      this.availableBuses.set(buses);
    } catch { this.availableBuses.set([]); }
    finally { this.loadingBuses.set(false); }
  }

  protected openCreateModal(): void {
    this.createForm = { tripId: '', busId: '', date: this.store.filterDate() };
    this.availableBuses.set([]);
    this.showCreateModal.set(true);
  }
  protected closeCreateModal(): void { this.showCreateModal.set(false); }

  protected async submitCreate(): Promise<void> {
    const ok = await this.store.createSchedule(this.createForm);
    if (ok) { this.closeCreateModal(); this.reloadCurrentView(); }
  }

  protected openEditModal(entry: any): void {
    this.editingSchedule.set(entry);
    this.editForm = { date: entry.date ?? this.store.filterDate(), busId: entry.bus?.id ?? '' };
    this.editAvailableBuses.set([]);
    this.editError.set(null);
    this.showEditModal.set(true);
    this.refreshEditBuses(this.editForm.date);
  }

  protected closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingSchedule.set(null);
    this.editError.set(null);
  }

  protected async onEditDateChange(): Promise<void> {
    this.editForm.busId = '';
    this.editError.set(null);
    await this.refreshEditBuses(this.editForm.date);
  }

  private async refreshEditBuses(date: string): Promise<void> {
    const schedule = this.editingSchedule();
    if (!schedule || !date) return;
    this.loadingEditBuses.set(true);
    try {
      const tripId = schedule.tripId ?? schedule.trip?.id;
      const buses = await firstValueFrom(this.api.getAvailableBuses(tripId, date));
      const currentBus = schedule.bus;
      const alreadyIn = buses.some((b: AvailableBus) => b.id === currentBus?.id);
      this.editAvailableBuses.set(alreadyIn ? buses : [currentBus, ...buses].filter(Boolean));
    } catch { this.editAvailableBuses.set([]); }
    finally { this.loadingEditBuses.set(false); }
  }

  protected async submitEdit(): Promise<void> {
    const schedule = this.editingSchedule();
    if (!schedule) return;
    const payload: { date?: string; busId?: string } = {};
    if (this.editForm.date !== schedule.date) payload.date = this.editForm.date;
    if (this.editForm.busId !== (schedule.bus?.id ?? '')) payload.busId = this.editForm.busId;
    if (!Object.keys(payload).length) { this.closeEditModal(); return; }
    this.editError.set(null);
    const ok = await this.store.updateSchedule(schedule.id, payload);
    if (ok) { this.closeEditModal(); }
    else { this.editError.set(this.store.error() ?? 'Erreur'); this.store.clearMessages(); }
  }

  protected openGenerateModal(): void {
    this.generateResult.set(null);
    this.generateForm = { tripId: '', busId: '', startDate: '', endDate: '', weekDays: [1, 2, 3, 4, 5] };
    this.showGenerateModal.set(true);
  }

  protected closeGenerateModal(): void {
    this.showGenerateModal.set(false);
    if (this.generateResult()) this.reloadCurrentView();
  }

  protected toggleDay(iso: number): void {
    const days = this.generateForm.weekDays;
    const idx = days.indexOf(iso);
    this.generateForm = {
      ...this.generateForm,
      weekDays: idx >= 0 ? days.filter(d => d !== iso) : [...days, iso].sort(),
    };
  }

  protected isGenerateValid(): boolean {
    return !!(this.generateForm.tripId && this.generateForm.busId &&
      this.generateForm.startDate && this.generateForm.endDate &&
      this.generateForm.weekDays.length > 0);
  }

  protected async submitGenerate(): Promise<void> {
    const result = await this.store.generateSchedules(this.generateForm);
    if (result) this.generateResult.set(result);
  }

  protected confirmCancel(id: string, route?: string): void {
    this.confirmDialog.set({
      title: 'Annuler le voyage',
      message: `Annuler le voyage "${route ?? ''}" ? L'opération est réversible.`,
      confirmLabel: 'Annuler le voyage',
      onConfirm: async () => { await this.store.cancelSchedule(id); this.confirmDialog.set(null); },
    });
  }

  protected confirmDelete(id: string, route?: string): void {
    this.confirmDialog.set({
      title: 'Supprimer le voyage',
      message: `Supprimer définitivement le voyage "${route ?? ''}" ?`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => { await this.store.deleteSchedule(id); this.confirmDialog.set(null); },
    });
  }

  protected executeConfirm(): void { this.confirmDialog()?.onConfirm(); }
  protected cancelConfirm():  void { this.confirmDialog.set(null); }

  protected getOccupancyPct(entry: any): number {
    if (!entry.totalSeats) return 0;
    return Math.round(((entry.totalSeats - entry.availableSeats) / entry.totalSeats) * 100);
  }
}
