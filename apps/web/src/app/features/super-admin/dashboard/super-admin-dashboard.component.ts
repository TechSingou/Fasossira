/**
 * SuperAdminDashboardComponent v2
 *
 * Fichier : apps/web/src/app/features/super-admin/dashboard/super-admin-dashboard.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] avec variables locales (--B, --G, --P, --R...) → super-admin-dashboard.component.scss
 *   ✅ Emojis 💰 🏗 ✅ ⏸ ✨ 💳 → NavIconComponent
 *   ✅ Variables --B/--G/--R/--P → var(--brand)/var(--success)/var(--danger)
 *   ✅ Gradient hero card → solid var(--brand) (cohérence couleur unique)
 *   ✅ Logique métier : inchangée
 */
import {
  Component, ChangeDetectionStrategy, inject, OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TenantsStore } from '../tenants/tenants.store';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { ICONS } from '../../../shared/tokens/icons';

@Component({
  selector: 'fas-super-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavIconComponent],
  template: `
<div class="pg">

  <!-- ── En-tête ── -->
  <div class="pg-head">
    <div>
      <h1 class="page-title">Vue Globale Plateforme</h1>
      <p class="page-sub">Tableau de bord Fasossira SaaS</p>
    </div>
    <a routerLink="/super-admin/tenants" class="btn-primary">
      <fas-nav-icon [path]="icons.plus" [size]="13" />
      Nouveau Tenant
    </a>
  </div>

  <!-- ── KPI principaux ── -->
  <div class="kgrid">

    <!-- Hero card MRR -->
    <div class="kcard kcard-hero">
      <div class="kh">
        <!-- ✅ 💰 → NavIconComponent -->
        <fas-nav-icon [path]="icons.dollarSign" [size]="20" color="rgba(255,255,255,.8)" />
        <span class="ktag">MRR</span>
      </div>
      <div class="kval-hero">{{ fcfa(store.globalStats()?.mrr ?? 0) }}</div>
      <div class="klbl">Revenu mensuel récurrent</div>
    </div>

    <div class="kcard">
      <!-- ✅ 🏗 → NavIconComponent -->
      <div class="kico-wrap">
        <fas-nav-icon [path]="icons.layers" [size]="18" color="var(--brand)" />
      </div>
      <div class="kval">{{ store.globalStats()?.totalTenants ?? '—' }}</div>
      <div class="klbl">Tenants total</div>
    </div>

    <div class="kcard">
      <!-- ✅ ✅ → NavIconComponent -->
      <div class="kico-wrap">
        <fas-nav-icon [path]="icons.check" [size]="18" color="var(--success)" />
      </div>
      <div class="kval kval-green">{{ store.globalStats()?.activeTenants ?? '—' }}</div>
      <div class="klbl">Actifs</div>
    </div>

    <div class="kcard">
      <!-- ✅ ⏸ → NavIconComponent -->
      <div class="kico-wrap">
        <fas-nav-icon [path]="icons.warning" [size]="18" color="var(--danger)" />
      </div>
      <div class="kval kval-red">{{ store.globalStats()?.suspendedTenants ?? '—' }}</div>
      <div class="klbl">Suspendus</div>
    </div>

    <div class="kcard">
      <!-- ✅ ✨ → NavIconComponent -->
      <div class="kico-wrap">
        <fas-nav-icon [path]="icons.trendingUp" [size]="18" color="#7c3aed" />
      </div>
      <div class="kval kval-purple">{{ store.globalStats()?.newThisMonth ?? '—' }}</div>
      <div class="klbl">Nouveaux ce mois</div>
    </div>

  </div>

  <!-- ── Grille secondaire ── -->
  <div class="row2">

    <!-- Répartition par plan -->
    <div class="card">
      <div class="ch">
        <h3 class="ct">Répartition par plan</h3>
      </div>
      <div class="cb">
        @if (store.loading()) {
          @for (_ of sk; track $index) {
            <div class="plan-row">
              <div class="s sm"></div>
              <div class="s sf"></div>
              <div class="s ss"></div>
            </div>
          }
        } @else if (!store.planStats()) {
          <div class="empty-hint">Aucune donnée</div>
        } @else {
          @for (row of store.planStats()!.byPlan; track row.planId) {
            <div class="plan-row">
              <div class="pname">
                <span class="pdot" [class]="'pdot-' + row.planName.toLowerCase()"></span>
                {{ row.planName }}
              </div>
              <div class="pbar-w">
                <div class="pbar" [class]="'pbar-' + row.planName.toLowerCase()"
                  [style.width]="planPct(row.count) + '%'">
                </div>
              </div>
              <div class="pstats">
                <span class="pcnt">{{ row.count }}&nbsp;tenant{{ row.count > 1 ? 's' : '' }}</span>
                <span class="prev">{{ fcfa(row.revenue) }}</span>
              </div>
            </div>
          }
          <div class="ptotal">
            <span>Total MRR</span>
            <span class="ptotal-v">{{ fcfa(store.planStats()!.mrr) }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Tenants récents -->
    <div class="card">
      <div class="ch">
        <h3 class="ct">Tenants récents</h3>
        <a routerLink="/super-admin/tenants" class="clink">Voir tous →</a>
      </div>
      <div class="cb">
        @if (store.loading()) {
          @for (_ of sk; track $index) {
            <div class="trow-mini">
              <div class="s sav"></div>
              <div>
                <div class="s sm"></div>
                <div class="s ss" style="margin-top:4px"></div>
              </div>
              <div class="s sbadge" style="margin-left:auto"></div>
            </div>
          }
        } @else if (!store.recentTenants().length) {
          <div class="empty-hint">Aucun tenant encore</div>
        } @else {
          @for (t of store.recentTenants(); track t.id) {
            <div class="trow-mini">
              <div class="tav" [style.background]="t.settings?.primaryColor ?? 'var(--brand)'">
                {{ t.name.slice(0,2).toUpperCase() }}
              </div>
              <div class="tinfo">
                <div class="tname">{{ t.name }}</div>
                <div class="tsub">{{ t.city }} · {{ fmtDate(t.createdAt) }}</div>
              </div>
              @if (t.activePlan) {
                <span class="pbadge" [class]="'pb-' + t.activePlan.name.toLowerCase()">
                  {{ t.activePlan.name }}
                </span>
              }
              <span class="sdot"
                [class.sdot-on]="t.isActive"
                [class.sdot-off]="!t.isActive">
              </span>
            </div>
          }
        }
      </div>
    </div>
  </div>

  <!-- ── Accès rapides ── -->
  <div class="qa-grid">
    <a routerLink="/super-admin/tenants" class="qa">
      <!-- ✅ 🏗 → NavIconComponent -->
      <fas-nav-icon [path]="icons.layers" [size]="20" color="var(--brand)" />
      <span class="qa-lbl">Gérer les tenants</span>
      <fas-nav-icon [path]="icons.chevronRight" [size]="16" color="var(--gray-400)" class="qa-arr" />
    </a>
    <a routerLink="/super-admin/plans" class="qa">
      <!-- ✅ 💳 → NavIconComponent -->
      <fas-nav-icon [path]="icons.creditCard" [size]="20" color="var(--brand)" />
      <span class="qa-lbl">Plans SaaS</span>
      <fas-nav-icon [path]="icons.chevronRight" [size]="16" color="var(--gray-400)" class="qa-arr" />
    </a>
  </div>

</div>
  `,
  styleUrl: './super-admin-dashboard.component.scss',
})
export class SuperAdminDashboardComponent implements OnInit {
  protected readonly store = inject(TenantsStore);
  protected readonly icons = ICONS;
  readonly sk = Array(4).fill(0);

  ngOnInit(): void {
    if (!this.store.tenants().length && !this.store.loading()) {
      this.store.loadAll();
    }
  }

  planPct(count: number): number {
    const total = this.store.planStats()?.totalActiveSubs ?? 0;
    return total === 0 ? 0 : Math.round((count / total) * 100);
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
}
