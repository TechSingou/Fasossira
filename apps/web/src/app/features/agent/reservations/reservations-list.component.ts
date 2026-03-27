/**
 * ReservationsListComponent v2
 *
 * Fichier : apps/web/src/app/features/agent/reservations/reservations-list.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] avec variables locales → reservations-list.component.scss
 *   ✅ Toasts ✅ ⚠️ → ToastComponent
 *   ✅ Empty state 🎫 inline → EmptyStateComponent
 *   ✅ Emojis 📋 dans titre → NavIconComponent
 *   ✅ Emojis 🖨 → NavIconComponent
 *   ✅ Emojis 🎫 dans ticket modal → NavIconComponent
 *   ✅ Canal/Statut badges hardcodés → StatusBadgeComponent
 *   ✅ font-style inline → var(--font-mono)
 *   ✅ Variables locales --brand/--success/--danger → tokens globaux
 *   ✅ Logique métier : inchangée (100%)
 */
import {
  Component, ChangeDetectionStrategy, inject,
  signal, computed, effect, DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ReservationsApiService,
  Reservation,
  TicketDto,
} from '../ticket-office/services/reservations.service';
import { ReservationStatus } from '@fasossira/shared-types';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent, BadgeVariant } from '../../../shared/components/status-badge/status-badge.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';

function todayISO() { return new Date().toISOString().split('T')[0]; }
function formatAmount(n: number) { return `${Number(n).toLocaleString('fr-FR')} FCFA`; }
function formatDateTime(dt: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

@Component({
  selector: 'fas-reservations-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NavIconComponent, EmptyStateComponent, StatusBadgeComponent, ToastComponent],
  template: `
<div class="rl-root">

  <!-- Header -->
  <div class="page-header">
    <div>
      <!-- ✅ 📋 → NavIconComponent -->
      <div class="page-title-with-icon">
        <fas-nav-icon [path]="icons.clipboardList" [size]="20" color="var(--brand)" />
        <h1 class="page-title">Réservations</h1>
      </div>
      <p class="page-sub">{{ filterDate }} · {{ reservations().length }} billet{{ reservations().length > 1 ? 's' : '' }}</p>
    </div>
    <div class="rl-header-actions">
      <input class="rl-search" type="search" [(ngModel)]="searchQuery"
        (ngModelChange)="onSearch($event)"
        placeholder="Référence, nom…" />
      <input class="rl-date" type="date" [(ngModel)]="filterDate"
        (ngModelChange)="loadReservations()" />
      <select class="rl-select" [(ngModel)]="filterStatus"
        (ngModelChange)="loadReservations()">
        <option value="">Tous statuts</option>
        <option value="CONFIRMED">Confirmé</option>
        <option value="CANCELLED">Annulé</option>
      </select>
    </div>
  </div>

  <!-- ✅ ToastComponent -->
  <fas-toast type="success" [message]="successMessage()" />
  <fas-toast type="error"   [message]="errorMessage()" />

  <!-- Skeleton -->
  @if (loading()) {
    <div class="rl-card">
      @for (s of skeletons; track s) {
        <div class="rl-skeleton"></div>
      }
    </div>

  <!-- ✅ EmptyStateComponent — plus de 🎫 inline -->
  } @else if (!reservations().length) {
    <fas-empty-state
      variant="reservations"
      title="Aucune réservation trouvée"
      subtitle="Aucune réservation pour cette date et ce filtre."
    />

  } @else {
    <div class="rl-table-wrap">
      <table class="rl-table">
        <thead>
          <tr>
            <th>Référence</th>
            <th>Passager</th>
            <th>Trajet</th>
            <th>Siège</th>
            <th>Canal</th>
            <th>Montant</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (r of reservations(); track r.id) {
            <tr [class.row-cancelled]="r.status === 'CANCELLED'">
              <td class="rl-ref">{{ r.reference }}</td>
              <td>
                <div class="rl-pax-name">{{ r.passengerName }}</div>
                <div class="rl-pax-phone">{{ r.passengerPhone }}</div>
              </td>
              <td>
                <div>{{ r.fromCityName }} → {{ r.toCityName }}</div>
                <div class="rl-meta">{{ formatDateTime(r.schedule?.departureDateTime ?? '') }}</div>
              </td>
              <td class="rl-seat">#{{ r.seatNumber }}</td>
              <td>
                <!-- ✅ StatusBadgeComponent — plus de badge-blue/badge-orange hardcodés -->
                <fas-status-badge
                  [variant]="channelVariant(r.saleChannel)"
                  [label]="channelLabel(r.saleChannel)"
                />
              </td>
              <td class="rl-amount">{{ formatAmount(r.amount) }}</td>
              <td>
                <!-- ✅ StatusBadgeComponent — plus de badge-green/badge-red hardcodés -->
                <fas-status-badge
                  [variant]="statusVariant(r.status)"
                  [label]="statusLabel(r.status)"
                />
              </td>
              <td class="rl-actions-cell">
                <!-- ✅ 🖨 → NavIconComponent -->
                <button class="rl-btn-icon" title="Imprimer" (click)="openPrintTicket(r)">
                  <fas-nav-icon [path]="icons.printer" [size]="14" color="currentColor" />
                </button>
                @if (r.status === 'CONFIRMED') {
                  <button class="rl-btn-icon danger" title="Annuler" (click)="confirmCancel(r)">
                    <fas-nav-icon [path]="icons.plus" [size]="13" color="currentColor" style="transform:rotate(45deg)" />
                  </button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }

  <!-- Footer total -->
  @if (reservations().length) {
    <div class="rl-footer">
      <span>Total du jour</span>
      <span class="rl-total">{{ formatAmount(totalAmount()) }}</span>
    </div>
  }

  <!-- Modal confirmation annulation -->
  @if (cancelTarget()) {
    <div class="rl-overlay" (click)="cancelTarget.set(null)">
      <div class="rl-modal" (click)="$event.stopPropagation()" role="alertdialog">
        <div class="rl-modal-title">Annuler la réservation ?</div>
        <div class="rl-modal-body">
          <strong>{{ cancelTarget()!.reference }}</strong> · {{ cancelTarget()!.passengerName }}
          <br>Cette action est irréversible.
        </div>
        <div class="rl-modal-actions">
          <button class="btn-ghost-md" (click)="cancelTarget.set(null)">Non, garder</button>
          <button class="btn-danger-md" [disabled]="cancelling()" (click)="cancelReservation()">
            {{ cancelling() ? 'Annulation…' : 'Oui, annuler' }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- Modal aperçu billet -->
  @if (printTicket$()) {
    <div class="rl-overlay" (click)="printTicket$.set(null)">
      <div class="rl-modal rl-print-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="rl-modal-title">Aperçu du billet</div>

        <!-- ── Ticket ── -->
        <div class="rl-ticket">
          <div class="rl-ticket-top">
            <div>
              <div class="rl-ticket-co">FASOSSIRA</div>
              <div class="rl-ticket-ref">{{ printTicket$()!.reference }}</div>
            </div>
            <!-- ✅ 🎫 → NavIconComponent -->
            <fas-nav-icon [path]="icons.ticket" [size]="24" color="rgba(255,255,255,.7)" />
          </div>
          <div class="rl-ticket-body">
            <div class="rl-ticket-route">
              <div>
                <div class="rl-ticket-city">{{ printTicket$()!.fromCityName }}</div>
                <div class="rl-ticket-time">{{ formatDateTime(printTicket$()!.departureDateTime) }}</div>
              </div>
              <fas-nav-icon [path]="icons.chevronRight" [size]="18" color="var(--gray-400)" />
              <div class="text-right">
                <div class="rl-ticket-city">{{ printTicket$()!.toCityName }}</div>
                <div class="rl-ticket-time">{{ formatDateTime(printTicket$()!.arrivalDateTime) }}</div>
              </div>
            </div>
            <div class="rl-ticket-rows">
              <div class="rl-ticket-row"><span class="rl-ticket-lbl">Passager</span><span class="rl-ticket-val">{{ printTicket$()!.passengerName }}</span></div>
              <div class="rl-ticket-row"><span class="rl-ticket-lbl">Téléphone</span><span class="rl-ticket-val">{{ printTicket$()!.passengerPhone }}</span></div>
              <div class="rl-ticket-row"><span class="rl-ticket-lbl">Siège</span><span class="rl-ticket-val">#{{ printTicket$()!.seatNumber }}</span></div>
              <div class="rl-ticket-row"><span class="rl-ticket-lbl">Bus</span><span class="rl-ticket-val">{{ printTicket$()!.busPlate }}</span></div>
              <div class="rl-ticket-row"><span class="rl-ticket-lbl">Paiement</span><span class="rl-ticket-val">{{ printTicket$()!.paymentMethod }}</span></div>
            </div>
          </div>
          <div class="rl-ticket-total">
            <span>Total payé</span>
            <span class="rl-ticket-total-amt">{{ formatAmount(printTicket$()!.amount) }}</span>
          </div>
        </div>

        <div class="rl-modal-actions">
          <button class="btn-ghost-md" (click)="printTicket$.set(null)">Fermer</button>
          <button class="btn-primary" onclick="window.print()">
            <fas-nav-icon [path]="icons.printer" [size]="14" color="currentColor" />
            Imprimer
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styleUrl: './reservations-list.component.scss',
})
export class ReservationsListComponent {
  private readonly api = inject(ReservationsApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly icons = ICONS;

  readonly skeletons = Array(5).fill(0);
  readonly formatAmount = formatAmount;
  readonly formatDateTime = formatDateTime;

  // ── State ────────────────────────────────────────────────────
  reservations = signal<Reservation[]>([]);
  loading = signal(false);
  cancelling = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  cancelTarget = signal<Reservation | null>(null);
  printTicket$ = signal<TicketDto | null>(null);

  filterDate = todayISO();
  filterStatus = '';
  searchQuery = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  totalAmount = computed(() =>
    this.reservations()
      .filter(r => r.status === 'CONFIRMED')
      .reduce((sum, r) => sum + Number(r.amount), 0),
  );

  // ── Helpers pour StatusBadge ──────────────────────────────────

  /** ✅ Remplace [class.badge-blue]/[class.badge-orange] hardcodés */
  channelVariant(ch: string): BadgeVariant {
    return ch === 'AGENCY' ? 'brand' : 'warning';
  }

  channelLabel(ch: string): string {
    // three options: AGENCY, ONLINE,EN_ROUTE 
    if (ch === 'AGENCY') return 'Guichet';
    if (ch === 'ONLINE') return 'En ligne';
    if (ch === 'EN_ROUTE') return 'En route';
    return 'Guichet';
  }

  /** ✅ Remplace [class.badge-green]/[class.badge-red] hardcodés */
  statusVariant(st: string): BadgeVariant {
    return st === 'CONFIRMED' ? 'success' : 'neutral';
  }

  statusLabel(st: string): string {
    return st === 'CONFIRMED' ? 'Confirmé' : 'Annulé';
  }

  // ── Toast auto-clear ──────────────────────────────────────────
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const has = !!(this.successMessage() || this.errorMessage());
      if (this.toastTimer) { clearTimeout(this.toastTimer); this.toastTimer = null; }
      if (has) {
        this.toastTimer = setTimeout(() => {
          this.successMessage.set(null);
          this.errorMessage.set(null);
        }, 5000);
      }
    });
    this.destroyRef.onDestroy(() => {
      if (this.toastTimer) clearTimeout(this.toastTimer);
      if (this.searchTimer) clearTimeout(this.searchTimer);
    });
    this.loadReservations();
  }

  // ── Load ──────────────────────────────────────────────────────
  async loadReservations() {
    this.loading.set(true);
    try {
      const results = await firstValueFrom(
        this.api.findAll({
          date: this.filterDate,
          status: (this.filterStatus as ReservationStatus) || undefined,
          search: this.searchQuery || undefined,
        })
      );
      this.reservations.set(results);
    } catch {
      this.errorMessage.set('Erreur lors du chargement des réservations.');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(_q: string) {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadReservations(), 350);
  }

  // ── Print ─────────────────────────────────────────────────────
  async openPrintTicket(r: Reservation) {
    try {
      const ticket = await firstValueFrom(this.api.getTicket(r.reference));
      this.printTicket$.set(ticket);
    } catch {
      this.errorMessage.set('Impossible de charger le billet.');
    }
  }

  // ── Cancel ────────────────────────────────────────────────────
  confirmCancel(r: Reservation) { this.cancelTarget.set(r); }

  async cancelReservation() {
    const target = this.cancelTarget();
    if (!target) return;
    this.cancelling.set(true);
    try {
      await firstValueFrom(this.api.cancel(target.id));
      this.successMessage.set(`Réservation ${target.reference} annulée.`);
      this.cancelTarget.set(null);
      await this.loadReservations();
    } catch (err: any) {
      const msg = err?.error?.message;
      this.errorMessage.set(typeof msg === 'string' ? msg : 'Erreur lors de l\'annulation.');
    } finally {
      this.cancelling.set(false);
    }
  }
}
