/**
 * AgenciesListComponent — CORRIGÉ
 *
 * Fichier : apps/web/src/app/features/admin/agencies/agencies-list.component.ts
 *
 * Fix 1 : Angular n'accepte pas la virgule dans un ternaire de template
 *   INVALIDE : (ctaClick)="agSearch() || onlyActive()
 *              ? (agSearch.set(''), onlyActive.set(false))
 *              : openCreate()"
 *   CORRECT  : (ctaClick)="resetAgencyFiltersOrCreate()"
 *              → méthode dédiée dans la classe
 *
 * Fix 2 : Même pattern pour le empty state users
 *   (ctaClick)="openCreate()" — déjà correct, mais les
 *   bindings [subtitle] et [ctaLabel] avec ternaires complexes
 *   sont extraits en getters computed pour la lisibilité.
 *
 * Le reste du fichier est identique à agencies-list.component.ts v2.
 */
import {
  Component, ChangeDetectionStrategy, inject, OnInit,
  signal, computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AgenciesUsersApiService,
  Agency, CreateAgencyPayload, User,
} from './services/agencies-users.service';
import { UserRole } from '@fasossira/shared-types';
import { QuotasStore } from '../../../core/stores/quotas.store';
import { PlanLimitBannerComponent } from '../../../shared/components/plan-limit-banner/plan-limit-banner.component';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent, BadgeVariant } from '../../../shared/components/status-badge/status-badge.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';

type Modal = 'none' | 'agency-create' | 'agency-edit' | 'user-create' | 'user-edit' | 'user-reset-pwd';

interface ConfirmDialog {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void;
}

const ICON_DISABLE = `<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>`;
const ICON_ENABLE  = `<circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>`;
const ICON_LOCK    = `<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`;
const ICON_TRASH   = `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>`;
const ICON_EDIT    = `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`;

@Component({
  selector: 'fas-agencies-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, RouterLink,
    PlanLimitBannerComponent,
    NavIconComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ToastComponent,
  ],
  template: `
<div class="pg-wrap">

  <!-- ── En-tête ── -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Agences &amp; Agents</h1>
      <p class="page-sub">Gestion des points de vente et des agents</p>
    </div>
    <div class="pg-actions">
      <button class="tab-switch-btn" (click)="switchTab('users')" [class.active]="tab() === 'users'">
        <fas-nav-icon [path]="icons.users" [size]="14" />
        Utilisateurs
      </button>
      <button class="tab-switch-btn" (click)="switchTab('agencies')" [class.active]="tab() === 'agencies'">
        <fas-nav-icon [path]="icons.building" [size]="14" />
        Agences
      </button>
      <button class="btn-primary"
        [disabled]="tab() === 'agencies' ? !quotasStore.canAddAgency() : !quotasStore.canAddUser()"
        [title]="addBtnTitle()"
        (click)="openCreate()">
        <fas-nav-icon [path]="icons.plus" [size]="13" />
        {{ tab() === 'agencies' ? 'Nouvelle agence' : 'Nouvel utilisateur' }}
      </button>
    </div>
  </div>

  @if (tab() === 'agencies') {
    <fas-plan-limit-banner resource="agencies" />
  } @else {
    <fas-plan-limit-banner resource="users" />
  }

  <fas-toast type="success" [message]="successMsg()" />
  <fas-toast type="error"   [message]="loadErr()" />

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-n">{{ agencies().length }}</div>
      <div class="stat-l">Agences</div>
    </div>
    <div class="stat-card">
      <div class="stat-n">{{ activeAgenciesCount() }}</div>
      <div class="stat-l">Actives</div>
    </div>
    <div class="stat-card">
      <div class="stat-n">{{ agentsCount() }}</div>
      <div class="stat-l">Agents</div>
    </div>
    <div class="stat-card">
      <div class="stat-n">{{ adminsCount() }}</div>
      <div class="stat-l">Admins</div>
    </div>
  </div>

  <!-- ════ TAB AGENCES ════ -->
  @if (tab() === 'agencies') {
    <div class="table-card">
      <div class="filter-bar">
        <div class="search-wrap">
          <span class="search-icon-wrap" aria-hidden="true">
            <fas-nav-icon [path]="icons.activity" [size]="14" />
          </span>
          <input class="search-input" type="search"
            [ngModel]="agSearch()"
            (ngModelChange)="agSearch.set($event)"
            placeholder="Rechercher une agence..." />
          @if (agSearch()) {
            <button class="clear-btn" (click)="agSearch.set('')" aria-label="Effacer">
              <fas-nav-icon [path]="icons.plus" [size]="12" style="transform:rotate(45deg)" />
            </button>
          }
        </div>
        <label class="filter-toggle">
          <input type="checkbox" [ngModel]="onlyActive()" (ngModelChange)="onlyActive.set($event)" />
          Actives seulement
        </label>
        @if (agSearch() || onlyActive()) {
          <button class="btn-reset" (click)="resetAgencyFilters()">
            <fas-nav-icon [path]="icons.refresh" [size]="12" />
            Réinitialiser
          </button>
        }
      </div>

      @if (loading()) {
        <table class="data-table">
          <thead><tr><th>Agence</th><th>Ville</th><th>Responsable</th><th class="center">Agents</th><th class="right">Actions</th></tr></thead>
          <tbody>
            @for (r of skRows; track $index) {
              <tr class="anim-row" [style.animation-delay]="$index * 40 + 'ms'">
                <td><div class="sk sk-lg"></div><div class="sk sk-sm" style="margin-top:4px"></div></td>
                <td><div class="sk sk-md"></div></td>
                <td><div class="sk sk-md"></div></td>
                <td class="center"><div class="sk sk-sm" style="margin:0 auto"></div></td>
                <td class="right"><div class="sk sk-actions" style="margin-left:auto"></div></td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <table class="data-table">
          <thead><tr><th>Agence</th><th>Ville</th><th>Responsable</th><th class="center">Agents</th><th class="right">Actions</th></tr></thead>
          <tbody>
            @for (a of filteredAgencies(); track a.id; let i = $index) {
              <tr class="anim-row" [style.animation-delay]="i * 35 + 'ms'">
                <td>
                  <div class="cell-main">{{ a.name }}</div>
                  @if (!a.isActive) {
                    <fas-status-badge variant="neutral" label="Inactive" />
                  }
                </td>
                <td class="cell-sub">{{ a.city }}</td>
                <td class="cell-sub">{{ a.managerName ?? '—' }}</td>
                <td class="center">
                  <span class="agent-count"><b>{{ getAgencyAgentCount(a.id) }}</b> agent(s)</span>
                </td>
                <td class="right">
                  <div class="action-group">
                    <button class="icon-btn" title="Modifier" (click)="editAgency(a)">
                      <fas-nav-icon [path]="iconEdit" [size]="14" />
                    </button>
                    <button class="icon-btn icon-btn-danger" title="Supprimer" (click)="askDeleteAgency(a)">
                      <fas-nav-icon [path]="iconTrash" [size]="14" />
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty-cell">
                <!-- FIX : méthodes dédiées au lieu de ternaires complexes en template -->
                <fas-empty-state
                  variant="agencies"
                  title="Aucune agence trouvée"
                  [subtitle]="agencyEmptySubtitle()"
                  [ctaLabel]="agencyEmptyCtaLabel()"
                  [ctaVariant]="agencyEmptyCtaVariant()"
                  (ctaClick)="onAgencyEmptyCta()"
                />
              </td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  }

  <!-- ════ TAB UTILISATEURS ════ -->
  @if (tab() === 'users') {
    <div class="table-card">
      <div class="filter-bar">
        <div class="search-wrap">
          <span class="search-icon-wrap" aria-hidden="true">
            <fas-nav-icon [path]="icons.activity" [size]="14" />
          </span>
          <input class="search-input" type="search"
            [ngModel]="userSearch()"
            (ngModelChange)="userSearch.set($event)"
            placeholder="Rechercher un utilisateur..." />
          @if (userSearch()) {
            <button class="clear-btn" (click)="userSearch.set('')" aria-label="Effacer">
              <fas-nav-icon [path]="icons.plus" [size]="12" style="transform:rotate(45deg)" />
            </button>
          }
        </div>

        <select class="filter-select"
          [ngModel]="userRoleFilter()"
          (ngModelChange)="userRoleFilter.set($event)">
          <option value="">Tous les rôles</option>
          <option value="ADMIN">Admin</option>
          <option value="AGENT">Agent</option>
        </select>

        <select class="filter-select"
          [ngModel]="userAgencyFilter()"
          (ngModelChange)="userAgencyFilter.set($event)">
          <option value="">Toutes les agences</option>
          <option value="__none__">Sans agence</option>
          @for (a of agencies(); track a.id) {
            <option [value]="a.id">{{ a.name }}</option>
          }
        </select>

        @if (userSearch() || userRoleFilter() || userAgencyFilter()) {
          <button class="btn-reset" (click)="resetUserFilters()">
            <fas-nav-icon [path]="icons.refresh" [size]="12" />
            Réinitialiser
          </button>
        }
      </div>

      @if (loading()) {
        <table class="data-table">
          <thead><tr><th>Utilisateur</th><th>Email</th><th class="center">Rôle</th><th>Agence</th><th class="center">Statut</th><th>Créé le</th><th class="right">Actions</th></tr></thead>
          <tbody>
            @for (r of skRows; track $index) {
              <tr class="anim-row" [style.animation-delay]="$index * 40 + 'ms'">
                <td><div style="display:flex;align-items:center;gap:8px"><div class="sk sk-av"></div><div class="sk sk-md"></div></div></td>
                <td><div class="sk sk-lg"></div></td>
                <td class="center"><div class="sk sk-badge" style="margin:0 auto"></div></td>
                <td><div class="sk sk-md"></div></td>
                <td class="center"><div class="sk sk-badge" style="margin:0 auto"></div></td>
                <td><div class="sk sk-sm"></div></td>
                <td class="right"><div class="sk sk-actions" style="margin-left:auto"></div></td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <table class="data-table">
          <thead>
            <tr><th>Utilisateur</th><th>Email</th><th class="center">Rôle</th><th>Agence</th><th class="center">Statut</th><th>Créé le</th><th class="right">Actions</th></tr>
          </thead>
          <tbody>
            @for (u of filteredUsers(); track u.id; let i = $index) {
              <tr class="anim-row" [style.animation-delay]="i * 35 + 'ms'">
                <td>
                  <div class="user-row">
                    <div class="user-av">{{ initials(u.name) }}</div>
                    <div class="cell-main">{{ u.name }}</div>
                  </div>
                </td>
                <td class="cell-email">{{ u.email }}</td>
                <td class="center">
                  <fas-status-badge
                    [variant]="u.role === ADMIN ? 'brand' : 'neutral'"
                    [label]="u.role === ADMIN ? 'Admin' : 'Agent'"
                  />
                </td>
                <td class="cell-sub">{{ u.agency?.name ?? '—' }}</td>
                <td class="center">
                  <fas-status-badge
                    [variant]="u.isActive ? 'success' : 'neutral'"
                    [label]="u.isActive ? 'Actif' : 'Inactif'"
                  />
                </td>
                <td class="cell-date">{{ fmtDate(u.createdAt) }}</td>
                <td class="right">
                  <div class="action-group">
                    <button class="icon-btn" title="Modifier" (click)="editUser(u)">
                      <fas-nav-icon [path]="iconEdit" [size]="14" />
                    </button>
                    <button class="icon-btn"
                      [title]="u.isActive ? 'Désactiver' : 'Activer'"
                      (click)="askToggleUser(u)">
                      <fas-nav-icon
                        [path]="u.isActive ? iconDisable : iconEnable"
                        [size]="14"
                        [color]="u.isActive ? 'var(--danger)' : 'var(--success)'"
                      />
                    </button>
                    <button class="icon-btn" title="Réinitialiser le mot de passe" (click)="openResetPwd(u)">
                      <fas-nav-icon [path]="iconLock" [size]="14" />
                    </button>
                    <button class="icon-btn icon-btn-danger" title="Supprimer" (click)="askDeleteUser(u)">
                      <fas-nav-icon [path]="iconTrash" [size]="14" />
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty-cell">
                <!-- FIX : méthodes dédiées -->
                <fas-empty-state
                  variant="agencies"
                  title="Aucun utilisateur trouvé"
                  [subtitle]="userEmptySubtitle()"
                  [ctaLabel]="userEmptyCtaLabel()"
                  (ctaClick)="openCreate()"
                />
              </td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  }
</div>

<!-- ════ MODALES ════ -->

@if (modal() === 'agency-create' || modal() === 'agency-edit') {
  <div class="modal-backdrop" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>{{ agencyModalTitle() }}</h2>
        <button class="modal-close" (click)="closeModal()" aria-label="Fermer">
          <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
        </button>
      </div>
      <div class="modal-body">
        <div class="form-grid2">
          <div class="field">
            <label>Nom <span class="req">*</span></label>
            <input type="text" [(ngModel)]="agForm.name" placeholder="ex: Agence Sogoniko" />
          </div>
          <div class="field">
            <label>Ville <span class="req">*</span></label>
            <input type="text" [(ngModel)]="agForm.city" placeholder="ex: Bamako" />
          </div>
          <div class="field col-span2">
            <label>Adresse</label>
            <input type="text" [(ngModel)]="agForm.address" placeholder="Rue 42, Quartier..." />
          </div>
          <div class="field">
            <label>Téléphone</label>
            <input type="tel" [(ngModel)]="agForm.phone" placeholder="+223 7X XX XX XX" />
          </div>
          <div class="field">
            <label>Responsable</label>
            <input type="text" [(ngModel)]="agForm.managerName" placeholder="Nom du responsable" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        @if (modalErr()) {
          <div class="modal-err-inline">
            <fas-nav-icon [path]="icons.warning" [size]="13" color="currentColor" />
            {{ modalErr() }}
          </div>
        }
        <div class="modal-footer-actions">
          <button class="btn-ghost-md" (click)="closeModal()">Annuler</button>
          <button class="btn-primary" [disabled]="saving() || !agForm.name || !agForm.city" (click)="saveAgency()">
            {{ saving() ? 'Enregistrement…' : (modal() === 'agency-create' ? 'Créer' : 'Enregistrer') }}
          </button>
        </div>
      </div>
    </div>
  </div>
}

@if (modal() === 'user-create') {
  <div class="modal-backdrop" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>Nouvel utilisateur</h2>
        <button class="modal-close" (click)="closeModal()" aria-label="Fermer">
          <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
        </button>
      </div>
      <div class="modal-body">
        <div class="form-grid2">
          <div class="field col-span2">
            <label>Nom complet <span class="req">*</span></label>
            <input type="text" [(ngModel)]="uForm.name" placeholder="ex: Amadou Diallo" />
          </div>
          <div class="field">
            <label>Email <span class="req">*</span></label>
            <input type="email" [(ngModel)]="uForm.email" placeholder="amadou@sotrama.ml" />
          </div>
          <div class="field">
            <label>Mot de passe <span class="req">*</span></label>
            <input type="password" [(ngModel)]="uForm.password" placeholder="Min. 8 caractères" />
          </div>
          <div class="field">
            <label>Rôle <span class="req">*</span></label>
            <select [(ngModel)]="uForm.role">
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          <div class="field">
            <label>
              Agence
              @if (uForm.role === AGENT) { <span class="req">*</span> }
              @else { <span class="field-opt">(optionnel)</span> }
            </label>
            <select [(ngModel)]="uForm.agencyId">
              <option value="">— Aucune —</option>
              @for (a of activeAgencies(); track a.id) {
                <option [value]="a.id">{{ a.name }} ({{ a.city }})</option>
              }
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        @if (modalErr()) {
          <div class="modal-err-inline">
            <fas-nav-icon [path]="icons.warning" [size]="13" color="currentColor" />
            {{ modalErr() }}
          </div>
        }
        <div class="modal-footer-actions">
          <button class="btn-ghost-md" (click)="closeModal()">Annuler</button>
          <button class="btn-primary"
            [disabled]="saving() || !uForm.name || !uForm.email || !uForm.password"
            (click)="saveUser()">
            {{ saving() ? 'Création…' : 'Créer l\'utilisateur' }}
          </button>
        </div>
      </div>
    </div>
  </div>
}

@if (modal() === 'user-edit') {
  <div class="modal-backdrop" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>Modifier l'utilisateur</h2>
        <button class="modal-close" (click)="closeModal()" aria-label="Fermer">
          <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
        </button>
      </div>
      <div class="modal-body">
        <div class="form-grid2">
          <div class="field col-span2">
            <label>Nom complet <span class="req">*</span></label>
            <input type="text" [(ngModel)]="uEditForm.name" />
          </div>
          <div class="field">
            <label>Email <span class="req">*</span></label>
            <input type="email" [(ngModel)]="uEditForm.email" />
          </div>
          <div class="field">
            <label>Rôle</label>
            <select [(ngModel)]="uEditForm.role">
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          <div class="field col-span2">
            <label>Agence</label>
            <select [(ngModel)]="uEditForm.agencyId">
              <option value="">— Aucune —</option>
              @for (a of activeAgencies(); track a.id) {
                <option [value]="a.id">{{ a.name }} ({{ a.city }})</option>
              }
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        @if (modalErr()) {
          <div class="modal-err-inline">
            <fas-nav-icon [path]="icons.warning" [size]="13" color="currentColor" />
            {{ modalErr() }}
          </div>
        }
        <div class="modal-footer-actions">
          <button class="btn-ghost-md" (click)="closeModal()">Annuler</button>
          <button class="btn-primary"
            [disabled]="saving() || !uEditForm.name || !uEditForm.email"
            (click)="saveEditUser()">
            {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
}

@if (modal() === 'user-reset-pwd') {
  <div class="modal-backdrop" (click)="closeModal()">
    <div class="modal modal-sm" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>Réinitialiser le mot de passe</h2>
        <button class="modal-close" (click)="closeModal()" aria-label="Fermer">
          <fas-nav-icon [path]="icons.plus" [size]="16" style="transform:rotate(45deg)" />
        </button>
      </div>
      <div class="modal-body">
        <p class="reset-info">Nouveau mot de passe pour <strong>{{ resetTargetName }}</strong></p>
        <div class="field">
          <label>Nouveau mot de passe <span class="req">*</span></label>
          <input type="password" [(ngModel)]="newPwd" placeholder="Min. 8 caractères" />
        </div>
      </div>
      <div class="modal-footer">
        @if (modalErr()) {
          <div class="modal-err-inline">
            <fas-nav-icon [path]="icons.warning" [size]="13" color="currentColor" />
            {{ modalErr() }}
          </div>
        }
        <div class="modal-footer-actions">
          <button class="btn-ghost-md" (click)="closeModal()">Annuler</button>
          <button class="btn-primary"
            [disabled]="saving() || newPwd.length < 8"
            (click)="submitResetPwd()">
            {{ saving() ? 'En cours…' : 'Réinitialiser' }}
          </button>
        </div>
      </div>
    </div>
  </div>
}

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
        <div class="modal-footer-actions">
          <button class="btn-ghost-md" (click)="cancelConfirm()">Annuler</button>
          <button [class]="confirmDialog()!.danger ? 'btn-danger-md' : 'btn-primary'"
            (click)="executeConfirm()" [disabled]="saving()">
            {{ saving() ? 'En cours…' : confirmDialog()!.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
}
  `,
  styleUrl: './agencies-list.component.scss',
})
export class AgenciesListComponent implements OnInit {
  private readonly api       = inject(AgenciesUsersApiService);
  protected readonly quotasStore = inject(QuotasStore);
  protected readonly icons   = ICONS;

  protected readonly iconEdit    = ICON_EDIT;
  protected readonly iconTrash   = ICON_TRASH;
  protected readonly iconDisable = ICON_DISABLE;
  protected readonly iconEnable  = ICON_ENABLE;
  protected readonly iconLock    = ICON_LOCK;

  readonly ADMIN = UserRole.ADMIN;
  readonly AGENT = UserRole.AGENT;
  readonly skRows = Array(5).fill(0);

  agencies   = signal<Agency[]>([]);
  users      = signal<User[]>([]);
  loading    = signal(false);
  saving     = signal(false);
  loadErr    = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  modalErr   = signal<string | null>(null);
  tab        = signal<'agencies' | 'users'>('agencies');
  modal      = signal<Modal>('none');
  confirmDialog = signal<ConfirmDialog | null>(null);

  agSearch         = signal('');
  onlyActive       = signal(false);
  userSearch       = signal('');
  userRoleFilter   = signal('');
  userAgencyFilter = signal('');

  agForm: CreateAgencyPayload & { isActive?: boolean } = this.emptyAgForm();
  uForm    = this.emptyUForm();
  uEditForm: { id: string; name: string; email: string; role: UserRole.ADMIN | UserRole.AGENT; agencyId: string }
           = this.emptyUEditForm();
  editAgencyId  = '';
  newPwd        = '';
  resetUserId   = '';
  resetTargetName = '';

  readonly activeAgencies      = computed(() => this.agencies().filter(a => a.isActive));
  readonly activeAgenciesCount = computed(() => this.agencies().filter(a => a.isActive).length);
  readonly agentsCount         = computed(() => this.users().filter(u => u.role === UserRole.AGENT).length);
  readonly adminsCount         = computed(() => this.users().filter(u => u.role === UserRole.ADMIN).length);

  readonly agencyModalTitle = computed(() =>
    this.modal() === 'agency-create' ? 'Nouvelle agence' : "Modifier l'agence",
  );

  readonly filteredAgencies = computed(() => {
    let list = this.agencies();
    if (this.onlyActive()) list = list.filter(a => a.isActive);
    const q = this.agSearch().trim().toLowerCase();
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      (a.managerName ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  readonly filteredUsers = computed(() => {
    let list = this.users();
    const role = this.userRoleFilter(), agency = this.userAgencyFilter();
    const q = this.userSearch().trim().toLowerCase();
    if (role) list = list.filter(u => u.role === role);
    if (agency === '__none__') list = list.filter(u => !u.agencyId);
    else if (agency) list = list.filter(u => u.agencyId === agency);
    if (q) list = list.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    return list;
  });

  /* ── FIX : Computed pour les empty states (remplace les ternaires complexes en template) ── */

  /** Sous-titre du empty state agences */
  readonly agencyEmptySubtitle = computed(() =>
    this.agSearch() || this.onlyActive()
      ? 'Essayez de changer les filtres.'
      : 'Créez votre première agence.',
  );

  /** Label CTA du empty state agences */
  readonly agencyEmptyCtaLabel = computed(() =>
    this.agSearch() || this.onlyActive() ? 'Réinitialiser' : 'Nouvelle agence',
  );

  /** Variante CTA du empty state agences */
  readonly agencyEmptyCtaVariant = computed(
    (): 'outline' | 'primary' =>
      this.agSearch() || this.onlyActive() ? 'outline' : 'primary',
  );

  /** Action CTA du empty state agences — FIX : remplace le ternaire avec virgule */
  onAgencyEmptyCta(): void {
    if (this.agSearch() || this.onlyActive()) {
      this.resetAgencyFilters();
    } else {
      this.openCreate();
    }
  }

  /** Sous-titre du empty state users */
  readonly userEmptySubtitle = computed(() =>
    this.userSearch() || this.userRoleFilter() || this.userAgencyFilter()
      ? 'Essayez de changer les filtres.'
      : 'Créez votre premier utilisateur.',
  );

  /** Label CTA du empty state users */
  readonly userEmptyCtaLabel = computed(() =>
    this.userSearch() || this.userRoleFilter() || this.userAgencyFilter()
      ? 'Réinitialiser'
      : 'Nouvel utilisateur',
  );

  /* ── FIX : Méthodes de reset dédiées (remplace les multi-statements en template) ── */

  /** Réinitialise les filtres agences — remplace agSearch.set(''), onlyActive.set(false) en template */
  resetAgencyFilters(): void {
    this.agSearch.set('');
    this.onlyActive.set(false);
  }

  /** Réinitialise les filtres users */
  resetUserFilters(): void {
    this.userSearch.set('');
    this.userRoleFilter.set('');
    this.userAgencyFilter.set('');
  }

  initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  getAgencyAgentCount(agencyId: string): number {
    return this.users().filter(u => u.agencyId === agencyId && u.role === UserRole.AGENT).length;
  }

  ngOnInit(): void {
    this.loadAll();
    this.quotasStore.loadQuotas();
  }

  protected addBtnTitle(): string {
    if (this.tab() === 'agencies' && !this.quotasStore.canAddAgency())
      return 'Limite agences atteinte — passez à un plan supérieur';
    if (this.tab() === 'users' && !this.quotasStore.canAddUser())
      return 'Limite utilisateurs atteinte — passez à un plan supérieur';
    return '';
  }

  async loadAll(): Promise<void> {
    this.loading.set(true); this.loadErr.set(null);
    try {
      const [agencies, users] = await Promise.all([
        firstValueFrom(this.api.getAgencies()),
        firstValueFrom(this.api.getUsers()),
      ]);
      this.agencies.set(agencies); this.users.set(users);
    } catch { this.loadErr.set('Erreur de chargement des données'); }
    finally { this.loading.set(false); }
  }

  switchTab(t: 'agencies' | 'users'): void { this.tab.set(t); }
  openModal(m: Modal): void { this.modal.set(m); this.modalErr.set(null); }
  closeModal(): void        { this.modal.set('none'); this.modalErr.set(null); this.newPwd = ''; }

  openCreate(): void {
    if (this.tab() === 'agencies') {
      this.agForm = this.emptyAgForm(); this.editAgencyId = '';
      this.openModal('agency-create');
    } else {
      this.uForm = this.emptyUForm(); this.openModal('user-create');
    }
  }

  editAgency(a: Agency): void {
    this.editAgencyId = a.id;
    this.agForm = { name: a.name, city: a.city, address: a.address ?? '', phone: a.phone ?? '', managerName: a.managerName ?? '' };
    this.openModal('agency-edit');
  }

  editUser(u: User): void {
    this.uEditForm = { id: u.id, name: u.name, email: u.email, role: u.role as UserRole.ADMIN | UserRole.AGENT, agencyId: u.agencyId ?? '' };
    this.openModal('user-edit');
  }

  openResetPwd(u: User): void {
    this.resetUserId = u.id; this.resetTargetName = u.name; this.newPwd = '';
    this.openModal('user-reset-pwd');
  }

  async saveAgency(): Promise<void> {
    if (!this.agForm.name || !this.agForm.city) return;
    this.saving.set(true); this.modalErr.set(null);
    try {
      if (this.modal() === 'agency-create') {
        const a = await firstValueFrom(this.api.createAgency(this.agForm));
        this.agencies.update(list => [...list, a]);
        this.successMsg.set(`Agence "${a.name}" créée`);
      } else {
        const a = await firstValueFrom(this.api.updateAgency(this.editAgencyId, this.agForm));
        this.agencies.update(list => list.map(x => x.id === a.id ? a : x));
        this.successMsg.set(`Agence "${a.name}" mise à jour`);
      }
      this.closeModal();
      setTimeout(() => this.successMsg.set(null), 4000);
    } catch (e: any) {
      this.modalErr.set(e?.error?.message ?? 'Erreur lors de l\'enregistrement');
    } finally { this.saving.set(false); }
  }

  async saveUser(): Promise<void> {
    this.saving.set(true); this.modalErr.set(null);
    try {
      const u = await firstValueFrom(this.api.createUser(this.uForm));
      this.users.update(list => [...list, u]);
      this.successMsg.set(`Utilisateur "${u.name}" créé`);
      this.closeModal();
      setTimeout(() => this.successMsg.set(null), 4000);
    } catch (e: any) {
      this.modalErr.set(e?.error?.message ?? 'Erreur lors de la création');
    } finally { this.saving.set(false); }
  }

  async saveEditUser(): Promise<void> {
    this.saving.set(true); this.modalErr.set(null);
    try {
      const { id, ...payload } = this.uEditForm;
      const u = await firstValueFrom(this.api.updateUser(id, payload));
      this.users.update(list => list.map(x => x.id === u.id ? u : x));
      this.successMsg.set(`Utilisateur "${u.name}" mis à jour`);
      this.closeModal();
      setTimeout(() => this.successMsg.set(null), 4000);
    } catch (e: any) {
      this.modalErr.set(e?.error?.message ?? 'Erreur');
    } finally { this.saving.set(false); }
  }

  async submitResetPwd(): Promise<void> {
    if (this.newPwd.length < 8) return;
    this.saving.set(true); this.modalErr.set(null);
    try {
      await firstValueFrom(this.api.resetPassword(this.resetUserId, { newPassword: this.newPwd }));
      this.successMsg.set('Mot de passe réinitialisé');
      this.closeModal();
      setTimeout(() => this.successMsg.set(null), 4000);
    } catch (e: any) {
      this.modalErr.set(e?.error?.message ?? 'Erreur');
    } finally { this.saving.set(false); }
  }

  askToggleUser(u: User): void {
    this.confirmDialog.set({
      title: u.isActive ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur',
      message: `${u.isActive ? 'Désactiver' : 'Activer'} l'utilisateur "${u.name}" ?`,
      confirmLabel: u.isActive ? 'Désactiver' : 'Activer',
      onConfirm: async () => {
        try {
          const updated = await firstValueFrom(this.api.updateUser(u.id, { isActive: !u.isActive }));
          this.users.update(list => list.map(x => x.id === updated.id ? updated : x));
          this.successMsg.set(`Utilisateur "${updated.name}" ${updated.isActive ? 'activé' : 'désactivé'}`);
          setTimeout(() => this.successMsg.set(null), 4000);
        } catch { this.loadErr.set('Erreur'); }
        this.confirmDialog.set(null);
      },
    });
  }

  askDeleteUser(u: User): void {
    this.confirmDialog.set({
      title: 'Supprimer l\'utilisateur',
      message: `Supprimer définitivement "${u.name}" (${u.email}) ?`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await firstValueFrom(this.api.deleteUser(u.id));
          this.users.update(list => list.filter(x => x.id !== u.id));
          this.successMsg.set('Utilisateur supprimé');
          setTimeout(() => this.successMsg.set(null), 4000);
        } catch { this.loadErr.set('Erreur'); }
        this.confirmDialog.set(null);
      },
    });
  }

  askDeleteAgency(a: Agency): void {
    this.confirmDialog.set({
      title: 'Supprimer l\'agence',
      message: `Supprimer "${a.name}" ? Les agents associés seront détachés.`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        try {
          await firstValueFrom(this.api.deleteAgency(a.id));
          this.agencies.update(list => list.filter(x => x.id !== a.id));
          this.successMsg.set('Agence supprimée');
          setTimeout(() => this.successMsg.set(null), 4000);
        } catch { this.loadErr.set('Erreur'); }
        this.confirmDialog.set(null);
      },
    });
  }

  executeConfirm(): void { this.confirmDialog()?.onConfirm(); }
  cancelConfirm():  void { this.confirmDialog.set(null); }

  private emptyAgForm(): CreateAgencyPayload { return { name: '', city: '', address: '', phone: '', managerName: '' }; }
  private emptyUForm()  { return { name: '', email: '', password: '', role: UserRole.AGENT as UserRole.AGENT | UserRole.ADMIN, agencyId: '' }; }
  private emptyUEditForm() { return { id: '', name: '', email: '', role: UserRole.AGENT as UserRole.ADMIN | UserRole.AGENT, agencyId: '' }; }
}
