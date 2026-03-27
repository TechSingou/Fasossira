/**
 * TenantsComponent v2
 *
 * Fichier : apps/web/src/app/features/super-admin/tenants/tenants.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] avec variables locales → tenants.component.scss
 *   ✅ Toasts ✅ ⚠️ → ToastComponent
 *   ✅ KPI icons 🏗 ✅ ⏸ 💰 ✨ → NavIconComponent
 *   ✅ Search icon 🔍 → NavIconComponent
 *   ✅ Empty state 🏗 → EmptyStateComponent
 *   ✅ Expiration ⚠️ → NavIconComponent
 *   ✅ Statut badges → StatusBadgeComponent
 *   ✅ SVG hardcodés stroke="#dc2626"/"#15803d" → NavIconComponent + color var
 *   ✅ Modal close ✕ → NavIconComponent
 *   ✅ Plan preview 📋 🚌 🏢 👤 → NavIconComponent
 *   ✅ Mot de passe modal ✅ 📋 ⚠️ → NavIconComponent + tokens
 *   ✅ style inline background:#d1fae5... → classes CSS avec tokens
 *   ✅ Logique métier : inchangée (100%)
 */
import {
  Component, ChangeDetectionStrategy, inject, OnInit, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TenantsStore } from './tenants.store';
import { Tenant } from '../services/tenants.service';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';

type Modal = 'none' | 'create-tenant' | 'assign-plan' | 'show-password';

interface ConfirmDialog {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void;
}

interface CreateForm {
  name: string; slug: string; city: string; phone: string;
  planId: string; adminName: string; adminEmail: string; adminPassword: string;
}

/* SVG paths pour actions tenant (inline dans ibtn) */
const ICON_LAYERS = `<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>`;
const ICON_PAUSE  = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
const ICON_ENABLE = `<circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>`;

@Component({
  selector: 'fas-tenants',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NavIconComponent, EmptyStateComponent, StatusBadgeComponent, ToastComponent],
  template: `
<div class="pg">

  <!-- En-tête -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Gestion des Tenants</h1>
      <p class="page-sub">{{ store.countByStatus().ALL }} compagnies sur la plateforme</p>
    </div>
    <button class="btn-primary" (click)="openCreate()">
      <fas-nav-icon [path]="icons.plus" [size]="13" />
      Nouveau Tenant
    </button>
  </div>

  <!-- ✅ ToastComponent -->
  <fas-toast type="success" [message]="store.successMessage()" />
  <fas-toast type="error"   [message]="store.error()" />

  <!-- ✅ KPI cards : 🏗 ✅ ⏸ 💰 ✨ → NavIconComponent -->
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-icon kpi-icon--blue">
        <fas-nav-icon [path]="icons.layers" [size]="16" color="currentColor" />
      </div>
      <div><div class="kpi-n">{{ store.countByStatus().ALL }}</div><div class="kpi-l">Total</div></div>
    </div>
    <div class="kpi">
      <div class="kpi-icon kpi-icon--green">
        <fas-nav-icon [path]="icons.check" [size]="16" color="currentColor" />
      </div>
      <div><div class="kpi-n">{{ store.countByStatus().ACTIVE }}</div><div class="kpi-l">Actifs</div></div>
    </div>
    <div class="kpi">
      <div class="kpi-icon kpi-icon--red">
        <fas-nav-icon [path]="icons.warning" [size]="16" color="currentColor" />
      </div>
      <div><div class="kpi-n">{{ store.countByStatus().SUSPENDED }}</div><div class="kpi-l">Suspendus</div></div>
    </div>
    <div class="kpi">
      <div class="kpi-icon kpi-icon--purple">
        <fas-nav-icon [path]="icons.dollarSign" [size]="16" color="currentColor" />
      </div>
      <div>
        <div class="kpi-n kpi-mrr">{{ fcfa(store.globalStats()?.mrr ?? 0) }}</div>
        <div class="kpi-l">MRR / mois</div>
      </div>
    </div>
    <div class="kpi">
      <div class="kpi-icon kpi-icon--amber">
        <fas-nav-icon [path]="icons.trendingUp" [size]="16" color="currentColor" />
      </div>
      <div><div class="kpi-n">{{ store.globalStats()?.newThisMonth ?? 0 }}</div><div class="kpi-l">Ce mois</div></div>
    </div>
  </div>

  <!-- Table card -->
  <div class="card">

    <!-- Filtres -->
    <div class="fbar">
      <div class="search-wrap">
        <!-- ✅ 🔍 → NavIconComponent -->
        <fas-nav-icon [path]="icons.activity" [size]="14" color="var(--gray-400)" />
        <input type="search" placeholder="Nom, slug, ville…"
          [ngModel]="store.searchQuery()"
          (ngModelChange)="store.setSearch($event)" />
        @if (store.searchQuery()) {
          <button class="clr" (click)="store.setSearch('')" aria-label="Effacer">
            <fas-nav-icon [path]="icons.plus" [size]="11" style="transform:rotate(45deg)" />
          </button>
        }
      </div>

      <div class="status-tabs">
        @for (t of statusTabs; track t.key) {
          <button class="tab" [class.active]="store.statusFilter() === t.key"
            (click)="store.setStatusFilter(t.key)">
            {{ t.label }}<span class="tcnt">{{ store.countByStatus()[t.key] }}</span>
          </button>
        }
      </div>

      @if (store.plans().length) {
        <select class="fsel"
          [ngModel]="store.planFilter()"
          (ngModelChange)="store.setPlanFilter($event)">
          <option value="">Tous les plans</option>
          @for (p of store.plans(); track p.id) {
            <option [value]="p.id">{{ p.name }}</option>
          }
        </select>
      }

      @if (store.hasActiveFilter()) {
        <button class="btn-reset" (click)="store.resetFilters()">
          <fas-nav-icon [path]="icons.refresh" [size]="12" />
          Reset
        </button>
      }
    </div>

    <!-- Skeleton -->
    @if (store.loading()) {
      <table class="tbl">
        <thead><tr>
          <th>Tenant</th><th>Plan</th><th>Usage</th>
          <th>Expiration</th><th>Statut</th><th>Créé</th><th></th>
        </tr></thead>
        <tbody>
          @for (_ of sk; track $index) {
            <tr class="anim-row" [style.animation-delay]="$index * 50 + 'ms'">
              <td><div class="s sl"></div><div class="s ss" style="margin-top:4px"></div></td>
              <td><div class="s sb"></div></td>
              <td><div class="s sp"></div></td>
              <td><div class="s sm"></div></td>
              <td><div class="s sb" style="margin:0 auto"></div></td>
              <td><div class="s sm"></div></td>
              <td><div class="s sa" style="margin-left:auto"></div></td>
            </tr>
          }
        </tbody>
      </table>

    <!-- ✅ EmptyStateComponent — plus de 🏗 emoji -->
    } @else if (!store.filteredTenants().length) {
      <fas-empty-state
        variant="generic"
        title="Aucun tenant trouvé"
        [subtitle]="store.hasActiveFilter() ? 'Modifiez vos filtres' : 'Créez votre premier tenant'"
        [ctaLabel]="store.hasActiveFilter() ? 'Réinitialiser' : 'Nouveau Tenant'"
        [ctaVariant]="store.hasActiveFilter() ? 'outline' : 'primary'"
        (ctaClick)="store.hasActiveFilter() ? store.resetFilters() : openCreate()"
      />

    } @else {
      <table class="tbl">
        <thead><tr>
          <th>Tenant</th><th>Plan</th><th>Usage</th>
          <th>Expiration</th><th class="tc">Statut</th>
          <th>Créé</th><th class="tr">Actions</th>
        </tr></thead>
        <tbody>
          @for (t of store.filteredTenants(); track t.id; let i = $index) {
            <tr class="anim-row" [class.row-off]="!t.isActive"
              [style.animation-delay]="i * 40 + 'ms'">

              <td>
                <div class="trow">
                  <div class="tav" [style.background]="t.settings?.primaryColor ?? 'var(--brand)'">
                    {{ t.name.slice(0,2).toUpperCase() }}
                  </div>
                  <div>
                    <div class="cell-b">{{ t.name }}</div>
                    <div class="cell-s">{{ t.slug }} · {{ t.city }}</div>
                  </div>
                </div>
              </td>

              <td>
                @if (t.activePlan) {
                  <span class="plan-badge" [class]="'pb-' + t.activePlan.name.toLowerCase()">
                    {{ t.activePlan.name }}
                  </span>
                  <div class="cell-s">{{ fcfa(t.activePlan.price) }}/mois</div>
                } @else {
                  <fas-status-badge variant="neutral" label="Sans plan" />
                }
              </td>

              <!-- Barres d'usage -->
              <td>
                <div class="ubars">
                  <div class="urow">
                    <span class="ulbl">Bus</span>
                    <div class="uwrap">
                      <div class="ubar"
                        [style.width]="pct(t.usage.buses, t.usage.maxBuses) + '%'"
                        [class.uwarn]="pct(t.usage.buses, t.usage.maxBuses) > 80">
                      </div>
                    </div>
                    <span class="uval">{{ t.usage.buses }}/{{ lim(t.usage.maxBuses) }}</span>
                  </div>
                  <div class="urow">
                    <span class="ulbl">Agents</span>
                    <div class="uwrap">
                      <div class="ubar"
                        [style.width]="pct(t.usage.users, t.usage.maxUsers) + '%'"
                        [class.uwarn]="pct(t.usage.users, t.usage.maxUsers) > 80">
                      </div>
                    </div>
                    <span class="uval">{{ t.usage.users }}/{{ lim(t.usage.maxUsers) }}</span>
                  </div>
                  <div class="urow">
                    <span class="ulbl">Agences</span>
                    <div class="uwrap">
                      <div class="ubar"
                        [style.width]="pct(t.usage.agencies, t.usage.maxAgencies) + '%'"
                        [class.uwarn]="pct(t.usage.agencies, t.usage.maxAgencies) > 80">
                      </div>
                    </div>
                    <span class="uval">{{ t.usage.agencies }}/{{ lim(t.usage.maxAgencies) }}</span>
                  </div>
                </div>
              </td>

              <td>
                @if (t.subscription) {
                  <div class="cell-s">{{ fmtDate(t.subscription.endDate) }}</div>
                  <!-- ✅ ⚠️ Expire bientôt → NavIconComponent -->
                  @if (expireSoon(t.subscription.endDate)) {
                    <div class="warn-tag">
                      <fas-nav-icon [path]="icons.warning" [size]="11" color="currentColor" />
                      Expire bientôt
                    </div>
                  }
                } @else {
                  <span class="cell-s">—</span>
                }
              </td>

              <td class="tc">
                <!-- ✅ StatusBadgeComponent — plus de badge-on/badge-off hardcodés -->
                <fas-status-badge
                  [variant]="t.isActive ? 'success' : 'neutral'"
                  [label]="t.isActive ? 'Actif' : 'Suspendu'"
                />
              </td>

              <td class="cell-date">{{ fmtDate(t.createdAt) }}</td>

              <td class="tr">
                <div class="acts">
                  <!-- ✅ NavIconComponent plan icon -->
                  <button class="ibtn" title="Changer le plan" (click)="openAssignPlan(t)">
                    <fas-nav-icon [path]="iconLayers" [size]="14" color="currentColor" />
                  </button>
                  <!-- ✅ SVG stroke="#dc2626"/"#15803d" → NavIconComponent + color var -->
                  <button class="ibtn"
                    [title]="t.isActive ? 'Suspendre' : 'Réactiver'"
                    (click)="askToggle(t)">
                    <fas-nav-icon
                      [path]="t.isActive ? iconPause : iconEnable"
                      [size]="14"
                      [color]="t.isActive ? 'var(--danger)' : 'var(--success)'"
                    />
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </div>

  <!-- ══ MODALE : Créer tenant ══ -->
  @if (modal() === 'create-tenant') {
    <div class="backdrop" (click)="closeModal()">
      <div class="modal modal-lg" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="mh">
          <h2>Nouveau Tenant</h2>
          <!-- ✅ ✕ → NavIconComponent -->
          <button class="mclose" (click)="closeModal()" aria-label="Fermer">
            <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
          </button>
        </div>
        <div class="mb">
          <p class="hint">Un compte administrateur et une souscription seront créés automatiquement.</p>

          <div class="fsec">
            <div class="fsec-t">Informations de la compagnie</div>
            <div class="fg3">
              <div class="fld col2">
                <label>Nom <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.name" (ngModelChange)="autoSlug($event)"
                  placeholder="ex: Sotrama Bamako" />
              </div>
              <div class="fld">
                <label>Slug (URL) <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.slug" placeholder="ex: sotrama-bamako" />
                <span class="fhint">Minuscules, chiffres et tirets</span>
              </div>
              <div class="fld">
                <label>Ville <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.city" placeholder="ex: Bamako" />
              </div>
              <div class="fld">
                <label>Téléphone <span class="req">*</span></label>
                <input type="tel" [(ngModel)]="form.phone" placeholder="+223 20 XX XX XX" />
              </div>
              <div class="fld">
                <label>Plan SaaS <span class="req">*</span></label>
                <select [(ngModel)]="form.planId">
                  <option value="">— Sélectionner —</option>
                  @for (p of store.plans(); track p.id) {
                    <option [value]="p.id">{{ p.name }} — {{ fcfa(p.price) }}/mois</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <div class="fsec" style="margin-top:18px">
            <div class="fsec-t">Compte Administrateur</div>
            <div class="fg2">
              <div class="fld">
                <label>Nom complet <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.adminName" placeholder="ex: Koné Traoré" />
              </div>
              <div class="fld">
                <label>Email <span class="req">*</span></label>
                <input type="email" [(ngModel)]="form.adminEmail" placeholder="admin@compagnie.ml" />
              </div>
              <div class="fld col2">
                <label>Mot de passe <span class="fhint-inline">(optionnel)</span></label>
                <input type="password" [(ngModel)]="form.adminPassword"
                  placeholder="Laissez vide pour générer automatiquement"
                  autocomplete="new-password" />
                <span class="fhint">Min. 8 caractères. Si vide, un mot de passe temporaire sera généré.</span>
              </div>
            </div>
          </div>

          <!-- ✅ Plan preview : 📋 🚌 🏢 👤 → NavIconComponent -->
          @if (selectedPlan()) {
            <div class="plan-prev">
              <div class="pp-t">
                <fas-nav-icon [path]="icons.clipboardList" [size]="14" color="var(--brand)" />
                Limites du plan <strong>{{ selectedPlan()!.name }}</strong>
              </div>
              <div class="pp-lims">
                <span>
                  <fas-nav-icon [path]="icons.bus" [size]="12" color="currentColor" />
                  {{ lim(selectedPlan()!.maxBuses) === '∞' ? 'Bus illimités' : selectedPlan()!.maxBuses + ' bus max' }}
                </span>
                <span>
                  <fas-nav-icon [path]="icons.building" [size]="12" color="currentColor" />
                  {{ lim(selectedPlan()!.maxAgencies) === '∞' ? 'Agences illimitées' : selectedPlan()!.maxAgencies + ' agences max' }}
                </span>
                <span>
                  <fas-nav-icon [path]="icons.users" [size]="12" color="currentColor" />
                  {{ lim(selectedPlan()!.maxUsers) === '∞' ? 'Utilisateurs illimités' : selectedPlan()!.maxUsers + ' utilisateurs max' }}
                </span>
              </div>
            </div>
          }
        </div>
        <div class="mf">
          @if (modalErr()) { <div class="merr">{{ modalErr() }}</div> }
          <button class="btn-ghost-md" (click)="closeModal()">Annuler</button>
          <button class="btn-primary" [disabled]="store.saving() || !formValid()" (click)="submitCreate()">
            {{ store.saving() ? 'Création…' : 'Créer le Tenant' }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ══ MODALE : Mot de passe temporaire ══ -->
  @if (modal() === 'show-password') {
    <div class="backdrop">
      <div class="modal modal-sm" role="dialog" aria-modal="true">
        <div class="mh">
          <div class="modal-success-header">
            <fas-nav-icon [path]="icons.check" [size]="16" color="var(--success)" />
            <h2>Tenant créé !</h2>
          </div>
        </div>
        <div class="mb">
          @if (store.lastCreatedPassword()) {
            <p class="hint">Communiquez ce mot de passe temporaire à l'administrateur. Il ne sera plus affiché.</p>
            <div class="pwd-box">
              <span class="pwd-val">{{ store.lastCreatedPassword() }}</span>
              <button class="copy-btn" (click)="copyPassword()">
                <!-- ✅ ✅ 📋 → NavIconComponent -->
                <fas-nav-icon
                  [path]="copied() ? icons.check : icons.clipboardList"
                  [size]="14"
                  [color]="copied() ? 'var(--success)' : 'var(--gray-500)'"
                />
              </button>
            </div>
            <!-- ✅ ⚠️ → NavIconComponent -->
            <div class="pwd-warn">
              <fas-nav-icon [path]="icons.warning" [size]="13" color="var(--warning)" />
              Notez ce mot de passe avant de fermer.
            </div>
          } @else {
            <p class="hint">Le tenant a été créé avec le mot de passe que vous avez défini.</p>
            <!-- ✅ style="background:#d1fae5..." → classe CSS avec tokens -->
            <div class="pwd-ok">
              <fas-nav-icon [path]="icons.check" [size]="14" color="var(--success)" />
              Mot de passe personnalisé enregistré.
            </div>
          }
        </div>
        <div class="mf">
          <button class="btn-primary" (click)="closeModal()">Fermer</button>
        </div>
      </div>
    </div>
  }

  <!-- ══ MODALE : Changer de plan ══ -->
  @if (modal() === 'assign-plan') {
    <div class="backdrop" (click)="closeModal()">
      <div class="modal modal-sm" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="mh">
          <h2>Changer le plan</h2>
          <button class="mclose" (click)="closeModal()" aria-label="Fermer">
            <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
          </button>
        </div>
        <div class="mb">
          <p class="hint-info">Tenant : <strong>{{ selTenant()?.name }}</strong></p>
          <p class="hint-info" style="margin-top:4px">Plan actuel : <strong>{{ selTenant()?.activePlan?.name ?? 'Aucun' }}</strong></p>
          <div class="fld" style="margin-top:16px">
            <label>Nouveau plan <span class="req">*</span></label>
            <select [(ngModel)]="newPlanId">
              <option value="">— Sélectionner —</option>
              @for (p of store.plans(); track p.id) {
                <option [value]="p.id" [disabled]="p.id === selTenant()?.activePlan?.id">
                  {{ p.name }} — {{ fcfa(p.price) }}/mois{{ p.id === selTenant()?.activePlan?.id ? ' (actuel)' : '' }}
                </option>
              }
            </select>
          </div>
        </div>
        <div class="mf">
          @if (modalErr()) { <div class="merr">{{ modalErr() }}</div> }
          <button class="btn-ghost-md" (click)="closeModal()">Annuler</button>
          <button class="btn-primary"
            [disabled]="store.saving() || !newPlanId || newPlanId === selTenant()?.activePlan?.id"
            (click)="submitAssignPlan()">
            {{ store.saving() ? 'Mise à jour…' : 'Changer le plan' }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ══ CONFIRM DIALOG ══ -->
  @if (confirm()) {
    <div class="backdrop" (click)="cancelConfirm()">
      <div class="modal modal-sm" (click)="$event.stopPropagation()" role="alertdialog">
        <div class="mh">
          <h2>{{ confirm()!.title }}</h2>
          <button class="mclose" (click)="cancelConfirm()" aria-label="Annuler">
            <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
          </button>
        </div>
        <div class="mb">
          <p class="confirm-msg">{{ confirm()!.message }}</p>
        </div>
        <div class="mf">
          <button class="btn-ghost-md" (click)="cancelConfirm()">Annuler</button>
          <button
            [class]="confirm()!.danger ? 'btn-danger-md' : 'btn-primary'"
            [disabled]="store.saving()"
            (click)="doConfirm()">
            {{ store.saving() ? 'En cours…' : confirm()!.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styleUrl: './tenants.component.scss',
})
export class TenantsComponent implements OnInit {
  protected readonly store = inject(TenantsStore);
  protected readonly icons = ICONS;

  /* ✅ Icônes SVG actions — remplacent les SVG hardcodés avec stroke="#dc2626" */
  protected readonly iconLayers = ICON_LAYERS;
  protected readonly iconPause  = ICON_PAUSE;
  protected readonly iconEnable = ICON_ENABLE;

  readonly sk = Array(5).fill(0);
  readonly statusTabs: Array<{ key: 'ALL' | 'ACTIVE' | 'SUSPENDED'; label: string }> = [
    { key: 'ALL',       label: 'Tous'      },
    { key: 'ACTIVE',    label: 'Actifs'    },
    { key: 'SUSPENDED', label: 'Suspendus' },
  ];

  modal    = signal<Modal>('none');
  modalErr = signal<string | null>(null);
  confirm  = signal<ConfirmDialog | null>(null);
  copied   = signal(false);

  selTenant = signal<Tenant | null>(null);
  newPlanId = '';
  form: CreateForm = this.emptyForm();

  selectedPlan() {
    return this.store.plans().find(p => p.id === this.form.planId) ?? null;
  }

  formValid(): boolean {
    return !!this.form.name && !!this.form.slug && !!this.form.city &&
      !!this.form.phone && !!this.form.planId && !!this.form.adminName && !!this.form.adminEmail;
  }

  ngOnInit(): void { this.store.loadAll(); }

  openCreate(): void {
    this.form = this.emptyForm();
    this.modalErr.set(null);
    this.modal.set('create-tenant');
  }

  openAssignPlan(t: Tenant): void {
    this.selTenant.set(t);
    this.newPlanId = t.activePlan?.id ?? '';
    this.modalErr.set(null);
    this.modal.set('assign-plan');
  }

  closeModal(): void {
    this.modal.set('none');
    this.modalErr.set(null);
    this.store.clearSuccess();
    this.copied.set(false);
  }

  askToggle(t: Tenant): void {
    this.confirm.set({
      title: t.isActive ? 'Suspendre le tenant' : 'Réactiver le tenant',
      message: t.isActive
        ? `Suspendre "${t.name}" bloquera l'accès de tous ses utilisateurs.`
        : `Réactiver "${t.name}" rétablira l'accès à tous ses utilisateurs.`,
      confirmLabel: t.isActive ? 'Suspendre' : 'Réactiver',
      danger: t.isActive,
      onConfirm: () => this.doToggle(t),
    });
  }

  doConfirm():    void { this.confirm()?.onConfirm(); }
  cancelConfirm(): void { this.confirm.set(null); }

  async submitCreate(): Promise<void> {
    const payload = { ...this.form };
    if (!payload.adminPassword) delete (payload as any).adminPassword;
    const ok = await this.store.createTenant(payload);
    if (ok) this.modal.set('show-password');
    else    this.modalErr.set(this.store.error());
  }

  async submitAssignPlan(): Promise<void> {
    const t = this.selTenant();
    if (!t) return;
    const ok = await this.store.assignPlan(t, this.newPlanId);
    if (ok) this.closeModal();
    else    this.modalErr.set(this.store.error());
  }

  private async doToggle(t: Tenant): Promise<void> {
    await this.store.toggleTenant(t);
    this.confirm.set(null);
  }

  async copyPassword(): Promise<void> {
    const pwd = this.store.lastCreatedPassword();
    if (pwd) {
      await navigator.clipboard.writeText(pwd);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  autoSlug(name: string): void {
    this.form.slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  fcfa(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0,
    }).format(n);
  }

  fmtDate(d: string | Date): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  pct(used: number, max: number): number {
    if (max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  }

  lim(max: number): string { return max === -1 ? '∞' : String(max); }

  expireSoon(end: string): boolean {
    const diff = new Date(end).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  }

  private emptyForm(): CreateForm {
    return { name: '', slug: '', city: '', phone: '', planId: '', adminName: '', adminEmail: '', adminPassword: '' };
  }
}
