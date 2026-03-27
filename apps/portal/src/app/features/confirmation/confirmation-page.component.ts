// apps/portal/src/app/features/confirmation/confirmation-page.component.ts
// Fix : adapté au nouveau type PublicReservationResult (bulk)
import {
  Component, ChangeDetectionStrategy, inject, OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingStateService } from '../../core/services/booking-state.service';
import { NavIconComponent } from '../../shared/components/nav-icon/nav-icon.component';
import { ICONS } from '../../shared/tokens/icons';

@Component({
  selector: 'fas-confirmation-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NavIconComponent],
  template: `
<div class="confirm-page">
  <div class="content-wrap">

    @if (!result() || !schedule()) {
      <div class="no-state">
        Aucune réservation à confirmer.
        <a routerLink="/search">Nouvelle recherche</a>
      </div>
    } @else {

      <div class="success-header">
        <div class="success-icon">
          <fas-nav-icon [path]="icons.check" [size]="28" color="var(--success)" />
        </div>
        <h1 class="success-title">Réservation confirmée !</h1>
        <p class="success-sub">
          {{ result()!.count }} billet(s) · {{ schedule()!.company.name }}
        </p>
      </div>

      <!-- Un ticket card par passager -->
      @for (ticket of result()!.reservations; track ticket.reference; let i = $index) {
        <div class="ticket-card">
          <div class="ticket-head" [style.background]="schedule()!.company.primaryColor">
            <div class="th-left">
              @if (schedule()!.company.logoUrl) {
                <img [src]="schedule()!.company.logoUrl" [alt]="schedule()!.company.name" class="t-logo" />
              } @else {
                <div class="t-logo-mark">{{ schedule()!.company.name.slice(0,2).toUpperCase() }}</div>
              }
              <div>
                <div class="t-co">{{ schedule()!.company.name }}</div>
                <div class="t-ref">{{ ticket.reference }}</div>
              </div>
            </div>
            <span class="t-badge">CONFIRMÉ</span>
          </div>

          <div class="ticket-body">
            <div class="ticket-route">
              <div>
                <div class="tk-city">{{ result()!.fromCityName }}</div>
                <div class="tk-time">{{ fmtTime(schedule()!.departureDateTime) }}</div>
              </div>
              <div class="tk-arrow">
                <div class="tk-line"></div>
                <fas-nav-icon [path]="icons.arrowRight" [size]="16" color="var(--gray-300)" />
                <div class="tk-line"></div>
              </div>
              <div style="text-align:right">
                <div class="tk-city">{{ result()!.toCityName }}</div>
                <div class="tk-time">{{ fmtTime(schedule()!.arrivalDateTime) }}</div>
              </div>
            </div>
            <div class="ticket-divider"></div>
            <div class="tk-row"><span class="tk-l">Passager</span><span class="tk-v">{{ ticket.passengerName }}</span></div>
            <div class="tk-row"><span class="tk-l">Téléphone</span><span class="tk-v">{{ ticket.passengerPhone }}</span></div>
            <div class="tk-row">
              <span class="tk-l">Siège</span>
              <span class="tk-v">
                <span class="tk-seat"
                  [style.background]="schedule()!.company.primaryColor + '18'"
                  [style.color]="schedule()!.company.primaryColor">
                  #{{ ticket.seatNumber }}
                </span>
              </span>
            </div>
            <div class="tk-row"><span class="tk-l">Date</span><span class="tk-v">{{ schedule()!.date }}</span></div>
            <div class="tk-row"><span class="tk-l">Bus</span><span class="tk-v">{{ schedule()!.bus.plate }}</span></div>
            <div class="tk-row"><span class="tk-l">Référence</span><span class="tk-v tk-ref">{{ ticket.reference }}</span></div>
          </div>

          <div class="ticket-foot" [style.background]="schedule()!.company.primaryColor">
            <span class="tf-label">Prix</span>
            <span class="tf-amount">{{ fmtAmt(ticket.amount, ticket.currency) }}</span>
          </div>
        </div>
      }

      <!-- Total si multi-billets -->
      @if (result()!.count > 1) {
        <div class="total-bar">
          <span class="total-label">Total {{ result()!.count }} billets</span>
          <span class="total-amount">{{ fmtAmt(result()!.totalAmount, result()!.currency) }}</span>
        </div>
      }

      <div class="actions no-print">
        <button class="btn-print" (click)="window.print()">
          <fas-nav-icon [path]="icons.printer" [size]="14" color="currentColor" />
          Imprimer les billets
        </button>
        <button class="btn-new" (click)="newSearch()">Nouvelle réservation</button>
      </div>

      <div class="retrieve-hint no-print">
        Pour retrouver ces billets, allez sur
        <a routerLink="/my-ticket">Mes billets</a>
        avec la référence et votre numéro de téléphone.
      </div>
    }
  </div>
</div>
  `,
  styleUrl: './confirmation-page.component.scss',
})
export class ConfirmationPageComponent implements OnInit {
  protected readonly state  = inject(BookingStateService);
  private   readonly router = inject(Router);
  protected readonly icons  = ICONS;
  protected readonly window = window;

  readonly result   = this.state.result;
  readonly schedule = this.state.schedule;

  ngOnInit(): void {
    if (!this.result()) this.router.navigate(['/search']);
  }

  newSearch(): void { this.state.reset(); this.router.navigate(['/search']); }

  fmtTime(dt: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  fmtAmt(amount: number, currency = 'XOF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(amount);
  }
}
