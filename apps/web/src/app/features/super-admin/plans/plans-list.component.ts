/**
 * PlansListComponent v2
 *
 * Fichier : apps/web/src/app/features/super-admin/plans/plans-list.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] avec variables locales (--B,--G,--R...) → plans-list.component.scss
 *   ✅ Empty state 💳 inline → EmptyStateComponent
 *   ✅ Toast inline → ToastComponent
 *   ✅ Limites 🚌 🏢 👤 → NavIconComponent
 *   ✅ SVG hardcodés stroke="#dc2626"/"#15803d" → NavIconComponent + color var
 *   ✅ Modal close ✕ → NavIconComponent
 *   ✅ Statuts .pon/.poff → StatusBadgeComponent
 *   ✅ Logique métier : inchangée (100%)
 */
import {
  Component, ChangeDetectionStrategy, inject, OnInit, signal, computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TenantsStore } from '../tenants/tenants.store';
import { TenantsService, SubscriptionPlan } from '../services/tenants.service';
import { firstValueFrom } from 'rxjs';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';

interface PlanForm {
  name: string; price: number | null;
  maxBuses: number | null; maxAgencies: number | null; maxUsers: number | null;
  features: string; isActive: boolean;
}

type Modal = 'none' | 'create' | 'edit';

/* SVG paths toggle plan */
const ICON_DISABLE = `<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>`;
const ICON_ENABLE  = `<circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>`;
const ICON_EDIT    = `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`;

@Component({
  selector: 'fas-plans-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NavIconComponent, EmptyStateComponent, StatusBadgeComponent, ToastComponent],
  template: `
<div class="pg">

  <div class="page-header">
    <div>
      <h1 class="page-title">Plans SaaS</h1>
      <p class="page-sub">{{ store.allPlans().length }} plan(s) configurés</p>
    </div>
    <button class="btn-primary" (click)="openCreate()">
      <fas-nav-icon [path]="icons.plus" [size]="13" />
      Nouveau Plan
    </button>
  </div>

  <!-- ✅ ToastComponent -->
  <fas-toast type="success" [message]="toast()" />
  <fas-toast type="error"   [message]="toastErrMsg()" />

  <!-- Cards plans -->
  <div class="plans-grid">
    @if (store.loading()) {
      @for (_ of sk; track $index) {
        <div class="plan-card sk-card anim-row" [style.animation-delay]="$index * 60 + 'ms'">
          <div class="s sl"></div>
          <div class="s sm" style="margin:8px 0"></div>
          @for (__ of [1,2,3]; track $index) { <div class="s ss" style="margin-bottom:6px"></div> }
          <div class="s sb" style="margin-top:12px"></div>
        </div>
      }

    <!-- ✅ EmptyStateComponent — plus de 💳 emoji -->
    } @else if (!store.allPlans().length) {
      <div class="empty-full">
        <fas-empty-state
          variant="generic"
          title="Aucun plan configuré"
          ctaLabel="Créer le premier plan"
          (ctaClick)="openCreate()"
        />
      </div>

    } @else {
      @for (p of store.allPlans(); track p.id; let i = $index) {
        <div class="plan-card anim-row"
          [class.card-off]="!p.isActive"
          [style.animation-delay]="i * 60 + 'ms'"
          [class]="'plan-card plan-' + p.name.toLowerCase()">

          <div class="pcard-top">
            <span class="plan-name">{{ p.name }}</span>
            <!-- ✅ StatusBadgeComponent — plus de .pon/.poff hardcodés -->
            <fas-status-badge
              [variant]="p.isActive ? 'success' : 'neutral'"
              [label]="p.isActive ? 'Actif' : 'Désactivé'"
            />
          </div>

          <div class="plan-price">
            {{ fcfa(p.price) }}<span class="price-unit">/mois</span>
          </div>

          <div class="plan-limits">
            <!-- ✅ 🚌 🏢 👤 → NavIconComponent -->
            <div class="plim">
              <fas-nav-icon [path]="icons.bus" [size]="13" color="var(--gray-500)" />
              <span>{{ p.maxBuses === -1 ? 'Illimité' : p.maxBuses + ' bus' }}</span>
            </div>
            <div class="plim">
              <fas-nav-icon [path]="icons.building" [size]="13" color="var(--gray-500)" />
              <span>{{ p.maxAgencies === -1 ? 'Illimité' : p.maxAgencies + ' agences' }}</span>
            </div>
            <div class="plim">
              <fas-nav-icon [path]="icons.users" [size]="13" color="var(--gray-500)" />
              <span>{{ p.maxUsers === -1 ? 'Illimité' : p.maxUsers + ' utilisateurs' }}</span>
            </div>
          </div>

          @if (p.features?.length) {
            <div class="plan-features">
              @for (f of p.features; track f) {
                <span class="feat">
                  <fas-nav-icon [path]="icons.check" [size]="10" color="var(--success)" />
                  {{ f }}
                </span>
              }
            </div>
          }

          <div class="pcard-footer">
            <div class="pcard-usage">
              @if (planUsage(p.id) !== null) {
                <span>{{ planUsage(p.id) }} tenant{{ planUsage(p.id)! > 1 ? 's' : '' }}</span>
              }
            </div>
            <div class="pcard-actions">
              <!-- ✅ SVG hardcodés → NavIconComponent -->
              <button class="ibtn" title="Modifier" (click)="openEdit(p)">
                <fas-nav-icon [path]="iconEdit" [size]="13" color="currentColor" />
              </button>
              <button class="ibtn" [title]="p.isActive ? 'Désactiver' : 'Activer'" (click)="togglePlan(p)">
                <fas-nav-icon
                  [path]="p.isActive ? iconDisable : iconEnable"
                  [size]="13"
                  [color]="p.isActive ? 'var(--danger)' : 'var(--success)'"
                />
              </button>
            </div>
          </div>
        </div>
      }
    }
  </div>

  <!-- ══ MODALE create/edit ══ -->
  @if (modal() !== 'none') {
    <div class="backdrop" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="mh">
          <h2>{{ modal() === 'create' ? 'Nouveau Plan' : 'Modifier le plan' }}</h2>
          <button class="mclose" (click)="closeModal()" aria-label="Fermer">
            <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
          </button>
        </div>
        <div class="mb">
          <div class="fg2">
            <div class="fld col2">
              <label>Nom du plan <span class="req">*</span></label>
              <input type="text" [(ngModel)]="form.name" placeholder="ex: Pro" />
            </div>
            <div class="fld col2">
              <label>Prix mensuel (FCFA) <span class="req">*</span></label>
              <input type="number" [(ngModel)]="form.price" placeholder="ex: 75000" min="0" />
            </div>
            <div class="fld">
              <label>Max Bus <span class="req">*</span></label>
              <input type="number" [(ngModel)]="form.maxBuses" placeholder="-1 = illimité" />
            </div>
            <div class="fld">
              <label>Max Agences <span class="req">*</span></label>
              <input type="number" [(ngModel)]="form.maxAgencies" placeholder="-1 = illimité" />
            </div>
            <div class="fld col2">
              <label>Max Utilisateurs <span class="req">*</span></label>
              <input type="number" [(ngModel)]="form.maxUsers" placeholder="-1 = illimité" />
            </div>
            <div class="fld col2">
              <label>Fonctionnalités (une par ligne)</label>
              <textarea [(ngModel)]="form.features" rows="4"
                placeholder="Vente guichet&#10;Rapports avancés&#10;Multi-agences"></textarea>
            </div>
          </div>
        </div>
        <div class="mf">
          @if (modalErr()) { <div class="merr">{{ modalErr() }}</div> }
          <button class="btn-ghost-md" (click)="closeModal()">Annuler</button>
          <button class="btn-primary" [disabled]="saving() || !formValid()" (click)="submitForm()">
            {{ saving() ? 'Enregistrement…' : (modal() === 'create' ? 'Créer' : 'Enregistrer') }}
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styleUrl: './plans-list.component.scss',
})
export class PlansListComponent implements OnInit {
  protected readonly store = inject(TenantsStore);
  private  readonly svc   = inject(TenantsService);
  protected readonly icons = ICONS;

  protected readonly iconEdit    = ICON_EDIT;
  protected readonly iconDisable = ICON_DISABLE;
  protected readonly iconEnable  = ICON_ENABLE;

  readonly sk = Array(3).fill(0);

  modal    = signal<Modal>('none');
  modalErr = signal<string | null>(null);
  saving   = signal(false);
  toast    = signal<string | null>(null);
  toastErrMsg = signal<string | null>(null);
  editPlan = signal<SubscriptionPlan | null>(null);

  form: PlanForm = this.emptyForm();

  formValid = computed(() =>
    !!this.form.name &&
    this.form.price !== null && this.form.price >= 0 &&
    this.form.maxBuses !== null &&
    this.form.maxAgencies !== null &&
    this.form.maxUsers !== null,
  );

  ngOnInit(): void {
    if (!this.store.allPlans().length && !this.store.loading()) {
      this.store.loadAll();
    }
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.editPlan.set(null);
    this.modalErr.set(null);
    this.modal.set('create');
  }

  openEdit(p: SubscriptionPlan): void {
    this.form = {
      name:        p.name,
      price:       p.price,
      maxBuses:    p.maxBuses,
      maxAgencies: p.maxAgencies,
      maxUsers:    p.maxUsers,
      features:    (p.features ?? []).join('\n'),
      isActive:    p.isActive,
    };
    this.editPlan.set(p);
    this.modalErr.set(null);
    this.modal.set('edit');
  }

  closeModal(): void { this.modal.set('none'); this.modalErr.set(null); }

  async submitForm(): Promise<void> {
    this.saving.set(true);
    this.modalErr.set(null);
    const payload: Partial<SubscriptionPlan> = {
      name:        this.form.name,
      price:       this.form.price!,
      maxBuses:    this.form.maxBuses!,
      maxAgencies: this.form.maxAgencies!,
      maxUsers:    this.form.maxUsers!,
      features:    this.form.features.split('\n').map(f => f.trim()).filter(Boolean),
      isActive:    this.form.isActive,
    };

    try {
      if (this.modal() === 'create') {
        await firstValueFrom(this.svc.createPlan(payload));
        this.showToast('Plan créé avec succès', false);
      } else {
        await firstValueFrom(this.svc.updatePlan(this.editPlan()!.id, payload));
        this.showToast('Plan mis à jour', false);
      }
      await this.store.loadAll();
      this.closeModal();
    } catch (e: any) {
      this.modalErr.set(e?.error?.message ?? 'Erreur lors de l\'enregistrement');
    } finally {
      this.saving.set(false);
    }
  }

  async togglePlan(p: SubscriptionPlan): Promise<void> {
    await this.store.togglePlan(p);
  }

  planUsage(planId: string): number | null {
    const row = this.store.planStats()?.byPlan.find(r => r.planId === planId);
    return row ? row.count : null;
  }

  fcfa(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0,
    }).format(n);
  }

  private showToast(msg: string, err: boolean): void {
    if (err) { this.toastErrMsg.set(msg); setTimeout(() => this.toastErrMsg.set(null), 3000); }
    else      { this.toast.set(msg);       setTimeout(() => this.toast.set(null), 3000); }
  }

  private emptyForm(): PlanForm {
    return { name: '', price: null, maxBuses: null, maxAgencies: null, maxUsers: null, features: '', isActive: true };
  }
}
