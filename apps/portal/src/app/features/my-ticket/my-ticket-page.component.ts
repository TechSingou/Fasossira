// apps/portal/src/app/features/my-ticket/my-ticket-page.component.ts
// Fix : ticket brandé avec les couleurs de la compagnie (company.primaryColor + company.logoUrl)
import {
  Component, ChangeDetectionStrategy, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PublicSearchService, PublicTicket } from '../../core/services/public-search.service';
import { NavIconComponent } from '../../shared/components/nav-icon/nav-icon.component';
import { ICONS } from '../../shared/tokens/icons';

@Component({
  selector: 'fas-my-ticket-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NavIconComponent],
  template: `
<div class="my-ticket-page">
  <div class="content-wrap">

    <div class="page-header">
      <h1 class="page-title">Retrouver mon billet</h1>
      <p class="page-sub">Entrez votre référence et votre numéro de téléphone</p>
    </div>

    <div class="search-card">
      <div class="form-fields">
        <div class="field">
          <label class="field-label">Référence du billet <span class="req">*</span></label>
          <input type="text" class="field-input mono"
            [(ngModel)]="reference" placeholder="ex: REF-2026-A7F2K1PB"
            (keyup.enter)="findTicket()" />
        </div>
        <div class="field">
          <label class="field-label">Numéro de téléphone <span class="req">*</span></label>
          <input type="tel" class="field-input"
            [(ngModel)]="phone" placeholder="+223 7X XX XX XX"
            (keyup.enter)="findTicket()" />
          <span class="field-hint">Numéro utilisé lors de la réservation</span>
        </div>
      </div>
      <button class="btn-find"
        [disabled]="loading() || !reference.trim() || !phone.trim()"
        (click)="findTicket()">
        @if (loading()) {
          <div class="btn-spinner"></div> Recherche…
        } @else {
          <fas-nav-icon [path]="icons.activity" [size]="15" color="currentColor" />
          Rechercher mon billet
        }
      </button>
    </div>

    @if (error()) {
      <div class="error-box">
        <fas-nav-icon [path]="icons.warning" [size]="15" color="currentColor" />
        {{ error() }}
      </div>
    }

    @if (ticket()) {
      @let t = ticket()!;
      @let co = t.company;
      <div class="ticket-result">
        <div class="ticket-card">

          <!-- FIX : header brandé avec la couleur de la compagnie -->
          <div class="ticket-head" [style.background]="co.primaryColor">
            <div class="th-left">
              <!-- FIX : logo de la compagnie si disponible -->
              @if (co.logoUrl) {
                <img [src]="co.logoUrl" [alt]="co.name" class="t-logo" />
              } @else {
                <div class="t-logo-mark">{{ co.name.slice(0,2).toUpperCase() }}</div>
              }
              <div>
                <div class="t-co">{{ co.name }} · Billet électronique</div>
                <div class="t-ref">{{ t.reference }}</div>
              </div>
            </div>
            <div class="t-status"
              [class.status-ok]="t.status === 'CONFIRMED'"
              [class.status-cancel]="t.status === 'CANCELLED'">
              {{ t.status === 'CONFIRMED' ? 'CONFIRMÉ' : t.status }}
            </div>
          </div>

          <div class="ticket-body">
            <div class="ticket-route">
              <div>
                <div class="tk-city">{{ t.fromCityName }}</div>
                <div class="tk-time">{{ fmtTime(t.departureDateTime) }}</div>
              </div>
              <div class="tk-arrow">
                <fas-nav-icon [path]="icons.arrowRight" [size]="16" color="var(--gray-300)" />
              </div>
              <div style="text-align:right">
                <div class="tk-city">{{ t.toCityName }}</div>
                <div class="tk-time">{{ fmtTime(t.arrivalDateTime) }}</div>
              </div>
            </div>

            <div class="ticket-divider"></div>

            <div class="tk-row"><span class="tk-l">Passager</span><span class="tk-v">{{ t.passengerName }}</span></div>
            <div class="tk-row"><span class="tk-l">Téléphone</span><span class="tk-v">{{ t.passengerPhone }}</span></div>
            <div class="tk-row">
              <span class="tk-l">Siège</span>
              <!-- FIX : siège brandé avec la couleur de la compagnie -->
              <span class="tk-v">
                <span class="tk-seat"
                  [style.background]="co.primaryColor + '18'"
                  [style.color]="co.primaryColor">
                  #{{ t.seatNumber }}
                </span>
              </span>
            </div>
            <div class="tk-row"><span class="tk-l">Bus</span><span class="tk-v mono">{{ t.busPlate }}</span></div>
            <div class="tk-row"><span class="tk-l">Paiement</span><span class="tk-v">{{ t.paymentMethod }}</span></div>
            <div class="tk-row"><span class="tk-l">Réservé le</span><span class="tk-v">{{ fmtDate(t.createdAt) }}</span></div>

            <div class="ticket-divider"></div>

            <div class="ticket-total">
              <span class="tot-l">Total payé</span>
              <!-- FIX : montant coloré avec la couleur de la compagnie -->
              <span class="tot-v" [style.color]="co.primaryColor">
                {{ fmtAmt(t.amount, t.currency) }}
              </span>
            </div>
          </div>

          <!-- FIX : footer brandé avec la couleur de la compagnie -->
          <div class="ticket-foot" [style.background]="co.primaryColor">
            <span class="tf-label">{{ co.name }}</span>
            <span class="tf-ref">{{ t.reference }}</span>
          </div>
        </div>

        <div class="ticket-actions">
          <button class="btn-print"
            [style.color]="co.primaryColor"
            [style.border-color]="co.primaryColor"
            (click)="window.print()">
            <fas-nav-icon [path]="icons.printer" [size]="14" color="currentColor" />
            Imprimer le billet
          </button>
        </div>
      </div>
    }

  </div>
</div>
  `,
  styleUrl: './my-ticket-page.component.scss',
})
export class MyTicketPageComponent {
  private readonly api  = inject(PublicSearchService);
  protected readonly icons  = ICONS;
  protected readonly window = window;

  reference = '';
  phone     = '';

  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);
  readonly ticket  = signal<PublicTicket | null>(null);

  findTicket(): void {
    if (!this.reference.trim() || !this.phone.trim()) return;
    this.loading.set(true);
    this.error.set(null);
    this.ticket.set(null);

    this.api.getTicket(this.reference.trim().toUpperCase(), this.phone.trim()).subscribe({
      next: t => { this.ticket.set(t); this.loading.set(false); },
      error: e => {
        this.error.set(
          e.status === 404
            ? 'Billet introuvable. Vérifiez la référence et le numéro de téléphone.'
            : (e?.error?.message ?? 'Erreur de connexion. Réessayez.')
        );
        this.loading.set(false);
      },
    });
  }

  fmtTime(dt: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  fmtDate(dt: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  fmtAmt(amount: number, currency = 'XOF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(amount);
  }
}
