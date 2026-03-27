/**
 * DashboardComponent v2
 *
 * Fichier : apps/web/src/app/features/admin/dashboard/dashboard.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] avec variables locales (--blue, --green, --orange...) → dashboard.component.scss
 *   ✅ Variables CSS locales remplacées par tokens globaux var(--brand), var(--success)...
 *   ✅ KPI cards inline → KpiCardComponent
 *   ✅ Emojis 💰 🎫 📊 🚌 🗺 🚌 💵 👥 → NavIconComponent dans KpiCardComponent
 *   ✅ Emojis ⚠️ dans error-banner → NavIconComponent
 *   ✅ Emojis 💵 🟠 🔵 💳 paymentIcon() → NavIconComponent via paymentIconPath()
 *   ✅ Emojis ▲ ▼ delta → texte ↑ ↓ (déjà sans emoji, juste nettoyé)
 *   ✅ ↻ refresh-btn → NavIconComponent
 *   ✅ bar-tooltip emoji 🎫 → texte pur
 *   ✅ style inline dans card-title "🗺 Top routes" → titre pur + NavIconComponent
 *   ✅ font-family: 'Sora' inline → var(--font)
 *   ✅ Hiérarchie dashboard : section labels pour les 3 niveaux
 *
 * Logique métier : inchangée
 */
import {
  Component, ChangeDetectionStrategy, OnInit, inject,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardStore } from './dashboard.store';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';
import type { PeriodPreset } from './dashboard.service';

/* Icônes modes de paiement — SVG paths spécifiques à ce contexte */
const PAY_ICONS: Record<string, string> = {
  CASH:                ICONS.dollarSign,
  MOBILE_MONEY_ORANGE: ICONS.smartphone,
  MOBILE_MONEY_MOOV:   ICONS.smartphone,
  CARD:                ICONS.creditCard,
};

@Component({
  selector: 'fas-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule, NavIconComponent, KpiCardComponent, ToastComponent],
  template: `
<div class="pg">

  <!-- ── En-tête ── -->
  <div class="pg-head">
    <div>
      <h1 class="page-title">Tableau de bord</h1>
      <p class="page-sub">{{ store.stats()?.period?.label ?? 'Chargement…' }}</p>
    </div>

    <div class="period-bar">
      @for (p of periods; track p.value) {
        <button class="period-btn"
          [class.active]="store.selectedPeriod() === p.value"
          (click)="selectPeriod(p.value)">
          {{ p.label }}
        </button>
      }

      @if (store.selectedPeriod() === 'custom') {
        <div class="custom-range">
          <input type="date" class="date-input"
            [ngModel]="store.customFrom()"
            (ngModelChange)="store.setCustomRange($event, store.customTo())" />
          <span class="date-sep">→</span>
          <input type="date" class="date-input"
            [ngModel]="store.customTo()"
            (ngModelChange)="store.setCustomRange(store.customFrom(), $event)" />
          <button class="btn-apply" (click)="applyCustom()">Appliquer</button>
        </div>
      }

      <!-- ✅ ↻ → NavIconComponent -->
      <button class="refresh-btn" (click)="refresh()"
        [disabled]="store.loading()" title="Actualiser">
        <fas-nav-icon
          [path]="icons.refresh"
          [size]="15"
          color="currentColor"
          [class.spinning]="store.loading()"
        />
      </button>
    </div>
  </div>

  <!-- Loading -->
  @if (store.loading()) {
    <div class="loading-overlay">
      <div class="loader-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  }

  <!-- ✅ Error banner : ⚠️ → NavIconComponent -->
  @if (store.error()) {
    <div class="error-banner" role="alert">
      <fas-nav-icon [path]="icons.warning" [size]="15" color="currentColor" />
      <span>{{ store.error() }}</span>
      <button class="error-retry" (click)="refresh()">Réessayer</button>
    </div>
  }

  @if (store.stats(); as s) {

    <!-- ══ NIVEAU 1 : KPI CARDS ══ -->
    <div class="section-eyebrow">Indicateurs clés</div>
    <div class="kpi-grid">

      <!-- ✅ KpiCardComponent — plus de blocs kpi-card inline avec emojis -->
      <fas-kpi-card
        label="Recettes"
        [value]="s.current.revenue | number:'1.0-0'"
        unit="F CFA"
        [iconPath]="icons.dollarSign"
        accent="blue"
        [delta]="store.revenueDelta()"
        [prevLabel]="'vs ' + (s.previous.revenue | number:'1.0-0') + ' F CFA'"
      />

      <fas-kpi-card
        label="Billets vendus"
        [value]="s.current.tickets | number"
        unit="billets"
        [iconPath]="icons.ticket"
        accent="green"
        [delta]="store.ticketsDelta()"
        [prevLabel]="'vs ' + s.previous.tickets + ' billets'"
      />

      <fas-kpi-card
        label="Taux d'occupation"
        [value]="s.current.occupancyRate"
        unit="%"
        [iconPath]="icons.activity"
        accent="amber"
        [delta]="store.occupancyDelta()"
        [prevLabel]="'vs ' + s.previous.occupancyRate + '%'"
      />

      <fas-kpi-card
        label="Flotte active"
        [value]="s.fleet.active"
        [unit]="'/ ' + s.fleet.total + ' bus'"
        [iconPath]="icons.bus"
        accent="neutral"
        [prevLabel]="s.fleet.maintenance + ' en maintenance'"
      />
    </div>

    <!-- ══ NIVEAU 2 : ANALYSE ══ -->
    <div class="section-eyebrow">Analyse</div>
    <div class="row-2">

      <!-- Timeline revenus -->
      <div class="card chart-card">
        <div class="card-head">
          <div>
            <div class="card-title">Évolution des recettes</div>
            <div class="card-sub">{{ s.period.label }}</div>
          </div>
          <div class="total-badge">{{ s.current.revenue | number:'1.0-0' }} F CFA</div>
        </div>

        @if (s.revenueTimeline.length === 0) {
          <div class="empty-chart">Aucune donnée sur cette période</div>
        } @else {
          <div class="bar-chart">
            @for (day of s.revenueTimeline; track day.date) {
              <div class="bar-col"
                [title]="day.date + ' — ' + (day.revenue | number) + ' F CFA · ' + day.tickets + ' billets'">
                <div class="bar-fill"
                  [style.height.%]="(day.revenue / store.timelineMax()) * 100">
                  <span class="bar-tooltip">
                    {{ day.revenue | number:'1.0-0' }} F<br>{{ day.tickets }} billet(s)
                  </span>
                </div>
                <div class="bar-label">{{ formatBarLabel(day.date) }}</div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Modes de paiement -->
      <div class="card">
        <div class="card-head">
          <div class="card-title">Modes de paiement</div>
        </div>
        @if (s.paymentBreakdown.length === 0) {
          <div class="empty-state-inline">Aucun paiement sur cette période</div>
        } @else {
          <div class="payment-list">
            @for (p of s.paymentBreakdown; track p.method) {
              <div class="payment-row">
                <!-- ✅ paymentIcon() retournait emojis — maintenant NavIconComponent -->
                <div class="payment-icon-wrap">
                  <fas-nav-icon
                    [path]="paymentIconPath(p.method)"
                    [size]="15"
                    color="var(--gray-500)"
                  />
                </div>
                <div class="payment-info">
                  <div class="payment-method">{{ paymentLabel(p.method) }}</div>
                  <div class="payment-bar-wrap">
                    <div class="payment-bar"
                      [style.width.%]="store.totalPaymentAmount() > 0
                        ? (p.amount / store.totalPaymentAmount()) * 100 : 0"
                      [class]="'payment-bar--' + paymentColor(p.method)">
                    </div>
                  </div>
                </div>
                <div class="payment-stats">
                  <div class="payment-amount">{{ p.amount | number:'1.0-0' }} F</div>
                  <div class="payment-count">{{ p.count }} ventes</div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- ══ NIVEAU 3 : ACTIVITÉ RÉSEAU ══ -->
    <div class="section-eyebrow">Activité réseau</div>
    <div class="row-3">

      <!-- Top Routes -->
      <div class="card">
        <div class="card-head">
          <div class="card-title-with-icon">
            <fas-nav-icon [path]="icons.map" [size]="15" color="var(--brand)" />
            <span class="card-title">Top routes</span>
          </div>
          <div class="card-sub">Par recettes</div>
        </div>
        @if (s.topRoutes.length === 0) {
          <div class="empty-state-inline">Aucune vente sur cette période</div>
        } @else {
          <table class="routes-table">
            <thead>
              <tr>
                <th>#</th><th>Route</th><th>Billets</th><th>Recettes</th>
              </tr>
            </thead>
            <tbody>
              @for (r of s.topRoutes; track r.name; let i = $index) {
                <tr>
                  <td><span class="rank" [class]="'rank-' + (i + 1)">{{ i + 1 }}</span></td>
                  <td class="td-route-name">{{ r.name }}</td>
                  <td>{{ r.tickets }}</td>
                  <td class="td-revenue">{{ r.revenue | number:'1.0-0' }} F</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Réseau & Voyages -->
      <div class="card">
        <div class="card-head">
          <div class="card-title-with-icon">
            <fas-nav-icon [path]="icons.bus" [size]="15" color="var(--brand)" />
            <span class="card-title">Réseau & Voyages</span>
          </div>
          <div class="card-sub">{{ s.period.label }}</div>
        </div>
        <div class="network-grid">
          <div class="net-item">
            <div class="net-val">{{ s.network.activeRoutes }}</div>
            <div class="net-lbl">Routes actives</div>
          </div>
          <div class="net-item">
            <div class="net-val">{{ s.network.scheduledTrips }}</div>
            <div class="net-lbl">Voyages planifiés</div>
          </div>
          <div class="net-item">
            <div class="net-val">{{ s.network.completedTrips }}</div>
            <div class="net-lbl">Voyages effectués</div>
          </div>
          <div class="net-item">
            <div class="net-val">{{ s.current.cancelledTickets }}</div>
            <div class="net-lbl">Annulations</div>
          </div>
        </div>

        @if (s.network.scheduledTrips > 0) {
          <div class="completion-wrap">
            <div class="completion-label">
              Taux de complétion
              <strong>{{ completionRate(s.network.completedTrips, s.network.scheduledTrips) }}%</strong>
            </div>
            <div class="completion-track">
              <div class="completion-fill"
                [style.width.%]="completionRate(s.network.completedTrips, s.network.scheduledTrips)">
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Prix moyen + Passagers -->
      <div class="card">
        <div class="card-head">
          <div class="card-title-with-icon">
            <fas-nav-icon [path]="icons.dollarSign" [size]="15" color="var(--brand)" />
            <span class="card-title">Prix moyen billet</span>
          </div>
        </div>
        <div class="big-stat">
          <div class="big-num">{{ s.current.avgTicketPrice | number:'1.0-0' }}</div>
          <div class="big-unit">F CFA</div>
        </div>
        <div class="kpi-delta-lg"
          [class.kpi-delta-lg--up]="store.avgPriceDelta() >= 0"
          [class.kpi-delta-lg--down]="store.avgPriceDelta() < 0">
          {{ store.avgPriceDelta() >= 0 ? '↑' : '↓' }}
          {{ store.avgPriceDelta() | number:'1.0-0' }}% vs période précédente
        </div>

        <div class="mini-divider"></div>

        <div class="card-head" style="margin-top:16px">
          <div class="card-title-with-icon">
            <fas-nav-icon [path]="icons.users" [size]="15" color="var(--brand)" />
            <span class="card-title">Passagers</span>
          </div>
        </div>
        <div class="big-stat" style="margin-top:4px">
          <div class="big-num">{{ s.current.passengers | number }}</div>
          <div class="big-unit">passagers</div>
        </div>
      </div>
    </div>

  } @else if (!store.loading() && !store.error()) {
    <!-- Empty dashboard state -->
    <div class="empty-dashboard">
      <fas-nav-icon [path]="icons.activity" [size]="48" color="var(--gray-300)" />
      <p>Sélectionnez une période pour afficher les statistiques</p>
    </div>
  }

</div>
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  protected readonly store = inject(DashboardStore);
  protected readonly icons = ICONS;

  readonly periods: Array<{ label: string; value: PeriodPreset }> = [
    { label: "Aujourd'hui", value: 'today'  },
    { label: 'Cette semaine', value: 'week' },
    { label: 'Ce mois',       value: 'month' },
    { label: 'Personnalisé',  value: 'custom' },
  ];

  ngOnInit(): void {
    this.store.load({ period: 'today' });
  }

  selectPeriod(period: PeriodPreset): void {
    this.store.setPeriod(period);
    if (period !== 'custom') this.store.load({ period });
  }

  applyCustom(): void {
    this.store.load({
      period: 'custom',
      from: this.store.customFrom(),
      to:   this.store.customTo(),
    });
  }

  refresh(): void { this.store.load(); }

  formatBarLabel(date: string): string {
    const d = new Date(date + 'T12:00:00');
    const period = this.store.selectedPeriod();
    if (period === 'today') return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (period === 'week')  return ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()];
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  completionRate(completed: number, scheduled: number): number {
    if (scheduled === 0) return 0;
    return Math.round((completed / scheduled) * 100);
  }

  paymentLabel(method: string): string {
    const labels: Record<string, string> = {
      CASH:                'Espèces',
      MOBILE_MONEY_ORANGE: 'Orange Money',
      MOBILE_MONEY_MOOV:   'Moov Money',
      CARD:                'Carte bancaire',
    };
    return labels[method] ?? method;
  }

  /** ✅ Remplace paymentIcon() qui retournait des emojis 💵 🟠 🔵 💳 */
  paymentIconPath(method: string): string {
    return PAY_ICONS[method] ?? ICONS.dollarSign;
  }

  paymentColor(method: string): string {
    const colors: Record<string, string> = {
      CASH:                'cash',
      MOBILE_MONEY_ORANGE: 'orange',
      MOBILE_MONEY_MOOV:   'moov',
      CARD:                'card',
    };
    return colors[method] ?? 'cash';
  }
}
