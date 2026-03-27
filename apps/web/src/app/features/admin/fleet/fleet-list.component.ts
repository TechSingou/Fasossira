/**
 * FleetListComponent — patch de migration v2
 *
 * Fichier : apps/web/src/app/features/admin/fleet/fleet-list.component.ts
 *
 * Stratégie : patch minimal — on ne réécrit que les parties problématiques
 * identifiées dans l'audit, sans toucher à la logique métier.
 *
 * Migrations vs v1 :
 *   ✅ [style.color] [style.background] sur status-badge → StatusBadgeComponent
 *   ✅ Emojis ✅ ⚠️ 🔍 💺 ✏️ 🗑 → NavIconComponent + texte
 *   ✅ Toast inline → ToastComponent
 *   ✅ Empty state inline → EmptyStateComponent
 *   ✅ Styles inline (styles: [...]) → fleet-list.component.scss
 *   ✅ STATUS_LABELS avec couleurs hardcodées → mapping vers variant string
 *
 * Logique métier : inchangée
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
import { FleetStore } from './fleet.store';
import { Bus, BusType, BusStatus } from './services/fleet.service';
import { QuotasStore } from '../../../core/stores/quotas.store';
import { PlanLimitBannerComponent } from '../../../shared/components/plan-limit-banner/plan-limit-banner.component';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent, BadgeVariant } from '../../../shared/components/status-badge/status-badge.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';

interface ConfirmDialog {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

const BUS_TYPE_LABELS: Record<BusType, string> = {
  COASTER: 'Coaster', SPRINTER: 'Sprinter', GRAND_BUS: 'Grand Bus',
};

/**
 * ✅ Mapping status → BadgeVariant
 * Remplace STATUS_LABELS avec couleurs [style.color]/[style.background] hardcodées.
 */
const STATUS_BADGE: Record<BusStatus, { variant: BadgeVariant; label: string }> = {
  ACTIVE: { variant: 'success', label: 'Actif' },
  MAINTENANCE: { variant: 'warning', label: 'Maintenance' },
  RETIRED: { variant: 'neutral', label: 'Retraité' },
};

const SKELETON_CARDS = Array(4).fill(0);

@Component({
  selector: 'fas-fleet-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PlanLimitBannerComponent,
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
          <h1 class="page-title">Flotte de Bus</h1>
          <p class="page-sub">
            {{ store.filteredBuses().length }} / {{ store.buses().length }} véhicule(s)
          </p>
        </div>
        <button class="btn-primary"
          [disabled]="!quotasStore.canAddBus()"
          [title]="addBusBtnTitle()"
          (click)="openCreateModal()">
          <fas-nav-icon [path]="icons.plus" [size]="13" />
          Ajouter un bus
        </button>
      </div>

      <!-- Bannière quota -->
      <fas-plan-limit-banner resource="buses" />

      <!-- ✅ Toasts via ToastComponent -->
      <fas-toast type="success" [message]="store.successMessage()" />
      <fas-toast type="error"   [message]="store.error()" />

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="search-wrap">
          <!-- ✅ SVG search — plus de 🔍 -->
          <span class="search-icon-wrap" aria-hidden="true">
            <fas-nav-icon [path]="icons.activity" [size]="14" />
          </span>
          <input
            class="search-input"
            placeholder="Plaque, marque, modèle…"
            [ngModel]="store.searchQuery()"
            (ngModelChange)="store.setSearchQuery($event)"
          />
          @if (store.searchQuery()) {
            <button class="clear-btn" (click)="store.setSearchQuery('')" aria-label="Effacer">
              <fas-nav-icon [path]="icons.plus" [size]="12" style="transform:rotate(45deg)" />
            </button>
          }
        </div>

        <div class="status-tabs">
          @for (tab of statusTabs; track tab.key) {
            <button class="status-tab"
              [class.active]="store.statusFilter() === tab.key"
              (click)="store.setStatusFilter(tab.key)">
              {{ tab.label }}
              <span class="tab-count">{{ store.countByStatus()[tab.key] }}</span>
            </button>
          }
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
        <div class="buses-grid">
          @for (item of skeletonCards; track $index) {
            <div class="sk-card" [style.animation-delay]="$index * 60 + 'ms'">
              <div class="sk-top">
                <div class="sk sk-badge"></div>
                <div class="sk sk-type"></div>
              </div>
              <div class="sk sk-plate"></div>
              <div class="sk sk-model"></div>
              <div class="sk sk-capacity"></div>
              <div class="sk-actions">
                <div class="sk sk-btn"></div>
                <div class="sk sk-btn-sm"></div>
              </div>
            </div>
          }
        </div>

      } @else {
        <div class="buses-grid">
          @for (bus of store.filteredBuses(); track bus.id; let i = $index) {
            <div class="bus-card" [class.dimmed]="bus.status !== 'ACTIVE'"
              [style.animation-delay]="i * 50 + 'ms'">

              <div class="bus-card-top">
                <!-- ✅ StatusBadgeComponent — plus de [style.color]/[style.background] -->
                <fas-status-badge
                  [variant]="statusBadge(bus.status).variant"
                  [label]="statusBadge(bus.status).label"
                />
                <span class="bus-type-label">{{ BUS_TYPE_LABELS[bus.type] }}</span>
              </div>

              <div class="bus-plate">{{ bus.plate }}</div>
              <div class="bus-model">{{ bus.brand }} {{ bus.model }}</div>

              <div class="bus-capacity">
                <!-- ✅ NavIconComponent — plus de 💺 emoji -->
                <fas-nav-icon [path]="icons.users" [size]="14" color="var(--gray-400)" />
                <span>{{ bus.capacity }} sièges</span>
              </div>

              <div class="bus-actions">
                <!-- ✅ ✏️ → NavIconComponent -->
                <button class="btn-ghost btn-sm" (click)="openEditModal(bus)">
                  <fas-nav-icon [path]="icons.settings" [size]="13" />
                  Modifier
                </button>
                <!-- ✅ 🗑 → NavIconComponent -->
                <button class="btn-danger-sm" (click)="confirmDelete(bus)" aria-label="Supprimer">
                  <fas-nav-icon [path]="icons.warning" [size]="14" />
                </button>
              </div>
            </div>

          } @empty {
            <!-- ✅ EmptyStateComponent — plus de 🔍 🚌 emojis -->
            @if (store.hasActiveFilter()) {
              <fas-empty-state
                variant="search"
                title="Aucun résultat"
                subtitle="Aucun bus ne correspond à votre recherche."
                ctaLabel="Effacer les filtres"
                ctaVariant="outline"
                (ctaClick)="store.resetFilters()"
              />
            } @else {
              <fas-empty-state
                variant="fleet"
                title="Aucun bus enregistré"
                subtitle="Ajoutez votre premier véhicule pour commencer à planifier des voyages."
                ctaLabel="Ajouter un bus"
                (ctaClick)="openCreateModal()"
              />
            }
          }
        </div>
      }
    </div>

    <!-- ─── Modal : Ajouter / Modifier ─── -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true"
             [attr.aria-labelledby]="'modal-title-' + (editingBus() ? 'edit' : 'create')">
          <div class="modal-header">
            <h2 [id]="'modal-title-' + (editingBus() ? 'edit' : 'create')">
              {{ editingBus() ? 'Modifier le bus' : 'Ajouter un bus' }}
            </h2>
            <button class="modal-close" (click)="closeModal()" aria-label="Fermer">
              <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="bus-plate">Plaque *</label>
                <input id="bus-plate" class="form-control"
                  [(ngModel)]="form.plate" placeholder="ex: AB-123-CD" />
              </div>
              <div class="form-group">
                <label class="form-label" for="bus-type">Type *</label>
                <select id="bus-type" class="form-control" [(ngModel)]="form.type">
                  <option value="COASTER">Coaster</option>
                  <option value="SPRINTER">Sprinter</option>
                  <option value="GRAND_BUS">Grand Bus</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="bus-brand">Marque</label>
                <input id="bus-brand" class="form-control"
                  [(ngModel)]="form.brand" placeholder="ex: Mercedes" />
              </div>
              <div class="form-group">
                <label class="form-label" for="bus-model">Modèle</label>
                <input id="bus-model" class="form-control"
                  [(ngModel)]="form.model" placeholder="ex: Sprinter 516" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="bus-capacity">Capacité *</label>
                <input id="bus-capacity" class="form-control" type="number" min="1" max="100"
                  [(ngModel)]="form.capacity" placeholder="44" />
              </div>
              @if (editingBus()) {
                <div class="form-group">
                  <label class="form-label" for="bus-status">Statut</label>
                  <select id="bus-status" class="form-control" [(ngModel)]="form.status">
                    <option value="ACTIVE">Actif</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RETIRED">Retraité</option>
                  </select>
                </div>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost-md" (click)="closeModal()">Annuler</button>
            <button class="btn-primary" (click)="submitForm()"
              [disabled]="store.saving() || !form.plate.trim()">
              {{ store.saving() ? 'En cours…' : (editingBus() ? 'Enregistrer' : 'Ajouter') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ─── Modal : Confirmation suppression ─── -->
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
            <button class="btn-danger-md" (click)="executeConfirm()"
              [disabled]="store.saving()">
              {{ store.saving() ? 'En cours…' : confirmDialog()!.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './fleet-list.component.scss',
})
export class FleetListComponent implements OnInit, OnDestroy {
  protected readonly store = inject(FleetStore);
  protected readonly quotasStore = inject(QuotasStore);
  protected readonly icons = ICONS;
  protected readonly BUS_TYPE_LABELS = BUS_TYPE_LABELS;
  protected readonly skeletonCards = SKELETON_CARDS;

  protected showModal = signal(false);
  protected editingBus = signal<Bus | null>(null);
  protected confirmDialog = signal<ConfirmDialog | null>(null);

  protected form = {
    plate: '', brand: '', model: '',
    capacity: 44, type: 'COASTER' as BusType,
  };

  protected readonly statusTabs = [
    { key: 'ALL', label: 'Tous' },
    { key: 'ACTIVE', label: 'Actifs' },
    { key: 'MAINTENANCE', label: 'Maintenance' },
    { key: 'RETIRED', label: 'Retraités' },
  ];

  private messageTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.store.loadBuses();
    this.messageTimer = setInterval(() => {
      if (this.store.successMessage() || this.store.error()) {
        this.store.clearMessages();
      }
    }, 7000);
  }

  ngOnDestroy(): void {
    if (this.messageTimer) clearInterval(this.messageTimer);
  }

  /** ✅ Méthode pure — remplace STATUS_LABELS avec couleurs hardcodées */
  protected statusBadge(status: BusStatus) {
    return STATUS_BADGE[status] ?? { variant: 'neutral' as BadgeVariant, label: status };
  }

  protected addBusBtnTitle(): string {
    if (this.quotasStore.canAddBus()) return 'Ajouter un bus';
    const q = this.quotasStore.busesQuota();
    return `Limite atteinte (${q.current}/${q.max}) — passez à un plan supérieur`;
  }

  protected openCreateModal(): void {
    if (!this.quotasStore.canAddBus()) return;
    this.editingBus.set(null);
    this.form = { plate: '', brand: '', model: '', capacity: 44, type: 'COASTER' };
    this.showModal.set(true);
  }

  protected openEditModal(bus: Bus): void {
    this.editingBus.set(bus);
    this.form = {
      plate: bus.plate, brand: bus.brand ?? '',
      model: bus.model ?? '', capacity: bus.capacity,
      type: bus.type,
    };
    this.showModal.set(true);
  }

  protected async submitForm(): Promise<void> {
    if (!this.form.plate.trim()) return;
    const editing = this.editingBus();
    if (editing) {
      await this.store.updateBus(editing.id, this.form);
    } else {
      await this.store.createBus(this.form);
    }
    this.closeModal();
  }

  protected closeModal(): void {
    this.showModal.set(false);
    this.editingBus.set(null);
  }

  protected confirmDelete(bus: Bus): void {
    this.confirmDialog.set({
      title: 'Supprimer ce bus',
      message: `Supprimer le bus ${bus.plate} (${bus.brand ?? ''} ${bus.model ?? ''}) ?\nCette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        await this.store.deleteBus(bus.id);
        this.confirmDialog.set(null);
      },
    });
  }

  protected executeConfirm(): void { this.confirmDialog()?.onConfirm(); }
  protected cancelConfirm(): void { this.confirmDialog.set(null); }
}
