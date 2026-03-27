// apps/portal/src/app/features/booking/booking-page.component.ts
// Fix : confirm() envoie maintenant TOUS les passagers en une seule requête bulk.
import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  PublicSearchService, SeatInfo, RouteStop, PublicSchedule,
} from '../../core/services/public-search.service';
import { BookingStateService } from '../../core/services/booking-state.service';
import { NavIconComponent } from '../../shared/components/nav-icon/nav-icon.component';
import { ICONS } from '../../shared/tokens/icons';

const PAYMENT_OPTIONS = [
  { id: 'CASH',         label: 'Espèces',      short: 'F', color: '#374151' },
  { id: 'ORANGE_MONEY', label: 'Orange Money', short: 'O', color: '#f97316' },
  { id: 'MOOV_MONEY',   label: 'Moov Money',   short: 'M', color: '#3b82f6' },
];

@Component({
  selector: 'fas-booking-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, NavIconComponent],
  template: `
<div class="booking-page">
  <div class="content-wrap">

    <div class="back-bar">
      <a routerLink="/search" class="btn-back">
        <fas-nav-icon [path]="icons.chevronLeft" [size]="14" color="currentColor" />
        Retour aux résultats
      </a>
    </div>

    @if (!schedule()) {
      <div class="no-state">
        Aucun voyage sélectionné. <a routerLink="/search">Retour à la recherche</a>
      </div>
    } @else {

      <!-- Info voyage -->
      <div class="trip-info-card">
        @if (schedule()!.company.logoUrl) {
          <img [src]="schedule()!.company.logoUrl" [alt]="schedule()!.company.name" class="trip-logo" />
        } @else {
          <div class="trip-logo-mark" [style.background]="schedule()!.company.primaryColor">
            {{ schedule()!.company.name.slice(0,2).toUpperCase() }}
          </div>
        }
        <div class="trip-info-body">
          <div class="trip-info-co">{{ schedule()!.company.name }}</div>
          <div class="trip-info-route">{{ schedule()!.trip.route.name }} · Bus {{ schedule()!.bus.plate }}</div>
        </div>
        <div class="trip-info-times">
          <span class="t-time">{{ fmtTime(schedule()!.departureDateTime) }}</span>
          <span class="t-arrow">→</span>
          <span class="t-time">{{ fmtTime(schedule()!.arrivalDateTime) }}</span>
        </div>
      </div>

      <div class="booking-layout">
        <!-- ── GAUCHE ── -->
        <div class="booking-left">

          <!-- Sélection segment -->
          <section class="card">
            <h2 class="card-title">Sélectionnez votre segment</h2>
            <div class="segment-grid">
              <div class="seg-field">
                <label>De</label>
                <select [(ngModel)]="fromStopOrder" (ngModelChange)="onSegmentChange()">
                  @for (s of fromStops(); track s.order) {
                    <option [value]="s.order">{{ s.cityName }}</option>
                  }
                </select>
              </div>
              <div class="seg-field">
                <label>À</label>
                <select [(ngModel)]="toStopOrder" (ngModelChange)="onSegmentChange()">
                  @for (s of toStops(); track s.order) {
                    <option [value]="s.order">{{ s.cityName }}</option>
                  }
                </select>
              </div>
            </div>
          </section>

          <!-- Plan sièges -->
          <section class="card">
            <h2 class="card-title">Choisissez vos sièges</h2>
            <p class="card-sub">Bus {{ schedule()!.bus.plate }} · {{ schedule()!.bus.capacity }} places</p>

            @if (loadingSeats()) {
              <div class="seats-placeholder">
                <div class="seats-spinner"></div>
                Chargement du plan…
              </div>
            } @else if (seatError()) {
              <div class="seats-err">{{ seatError() }}</div>
            } @else {
              <div class="legend">
                <span class="leg-item"><span class="leg-dot leg-free"></span>Libre</span>
                <span class="leg-item"><span class="leg-dot leg-taken"></span>Occupé</span>
                <span class="leg-item"><span class="leg-dot leg-sel"></span>Sélectionné</span>
              </div>
              <div class="bus-front"
                [style.background]="schedule()!.company.primaryColor + '14'"
                [style.border-color]="schedule()!.company.primaryColor + '35'">
                <span [style.color]="schedule()!.company.primaryColor" style="font-size:.72rem;font-weight:700;">
                  ← Direction conducteur
                </span>
                <span style="font-size:.68rem;color:var(--gray-400);font-family:var(--font-mono);">
                  {{ schedule()!.bus.plate }}
                </span>
              </div>
              <div class="seat-grid">
                @for (row of seatRows(); track $index) {
                  @for (cell of row; track $index) {
                    @if (cell === 0) {
                      <div class="seat-aisle"></div>
                    } @else {
                      <button class="seat"
                        [class.seat-taken]="isTaken(cell)"
                        [class.seat-sel]="isSelected(cell)"
                        [style.--co]="schedule()!.company.primaryColor"
                        [disabled]="isTaken(cell)"
                        (click)="toggleSeat(cell)">
                        {{ cell }}
                      </button>
                    }
                  }
                }
              </div>
            }
          </section>

          <!-- Formulaire passagers — un formulaire par siège sélectionné -->
          @if (selectedSeats().length > 0) {
            <section class="card">
              <h2 class="card-title">
                Informations passager(s)
                <span class="pax-count">{{ selectedSeats().length }} siège(s) sélectionné(s)</span>
              </h2>
              @for (seat of selectedSeats(); track seat; let i = $index) {
                <div class="pax-card">
                  <div class="pax-head">
                    <span class="pax-seat" [style.background]="schedule()!.company.primaryColor">
                      Siège #{{ seat }}
                    </span>
                    <span class="pax-label">Passager {{ i + 1 }}</span>
                  </div>
                  <div class="form-row">
                    <div class="form-field">
                      <label>Nom complet <span class="req">*</span></label>
                      <input type="text"
                        [value]="paxNames()[i] || ''"
                        (input)="setPaxName(i, $any($event.target).value)"
                        placeholder="ex: Amadou Diallo" />
                    </div>
                    <div class="form-field">
                      <label>Téléphone <span class="req">*</span></label>
                      <input type="tel"
                        [value]="paxPhones()[i] || ''"
                        (input)="setPaxPhone(i, $any($event.target).value)"
                        placeholder="+223 7X XX XX XX" />
                    </div>
                  </div>
                </div>
              }
            </section>

            <!-- Paiement -->
            <section class="card">
              <h2 class="card-title">Mode de paiement</h2>
              <div class="pay-opts">
                @for (opt of paymentOptions; track opt.id) {
                  <button class="pay-opt"
                    [class.pay-active]="paymentMethod() === opt.id"
                    (click)="paymentMethod.set(opt.id)">
                    <div class="pay-icon" [style.background]="opt.color">{{ opt.short }}</div>
                    {{ opt.label }}
                  </button>
                }
              </div>
            </section>
          }
        </div>

        <!-- ── DROITE : Récapitulatif ── -->
        <aside class="booking-right">
          <div class="summary-panel">
            <div class="summary-head" [style.background]="schedule()!.company.primaryColor">
              <div class="sum-co">{{ schedule()!.company.name }}</div>
              <div class="sum-label">Récapitulatif</div>
            </div>
            <div class="summary-body">
              <div class="sum-route">
                <div>
                  <div class="sum-city">{{ fromCityName() }}</div>
                  <div class="sum-time">{{ fmtTime(schedule()!.departureDateTime) }}</div>
                </div>
                <span class="sum-arrow">→</span>
                <div style="text-align:right">
                  <div class="sum-city">{{ toCityName() }}</div>
                  <div class="sum-time">{{ fmtTime(schedule()!.arrivalDateTime) }}</div>
                </div>
              </div>
              <div class="sum-divider"></div>
              <div class="sum-rows">
                <div class="sum-row">
                  <span class="sk">Date</span>
                  <span class="sv">{{ schedule()!.date }}</span>
                </div>
                <div class="sum-row">
                  <span class="sk">Bus</span>
                  <span class="sv">{{ schedule()!.bus.plate }}</span>
                </div>
                <div class="sum-row">
                  <span class="sk">Siège(s)</span>
                  <span class="sv seats-val">
                    @if (selectedSeats().length) {
                      @for (s of selectedSeats(); track s) {
                        <span class="seat-chip"
                          [style.background]="schedule()!.company.primaryColor + '18'"
                          [style.color]="schedule()!.company.primaryColor">#{{ s }}</span>
                      }
                    } @else { — }
                  </span>
                </div>
                <div class="sum-row">
                  <span class="sk">Passagers</span>
                  <span class="sv">{{ selectedSeats().length }}</span>
                </div>
                <div class="sum-row">
                  <span class="sk">Paiement</span>
                  <span class="sv">{{ paymentLabel() }}</span>
                </div>
              </div>

              @if (bookingErr()) {
                <div class="booking-err">{{ bookingErr() }}</div>
              }

              <button class="btn-confirm"
                [style.background]="schedule()!.company.primaryColor"
                [disabled]="!canConfirm() || confirming()"
                (click)="confirm()">
                @if (confirming()) {
                  Réservation en cours…
                } @else {
                  <fas-nav-icon [path]="icons.check" [size]="15" color="currentColor" />
                  Confirmer {{ selectedSeats().length > 1 ? selectedSeats().length + ' billets' : 'la réservation' }}
                }
              </button>
            </div>
          </div>
        </aside>
      </div>
    }
  </div>
</div>
  `,
  styleUrl: './booking-page.component.scss',
})
export class BookingPageComponent implements OnInit {
  readonly scheduleId = input<string>('');

  private readonly api    = inject(PublicSearchService);
  private readonly state  = inject(BookingStateService);
  private readonly router = inject(Router);
  protected readonly icons           = ICONS;
  protected readonly paymentOptions  = PAYMENT_OPTIONS;

  readonly schedule = this.state.schedule;

  fromStopOrder = 0;
  toStopOrder   = 0;

  readonly fromStops = computed<RouteStop[]>(() =>
    (this.schedule()?.trip.route.stops ?? []).slice(0, -1)
  );
  readonly toStops = computed<RouteStop[]>(() =>
    (this.schedule()?.trip.route.stops ?? []).filter(s => s.order > this.fromStopOrder)
  );
  readonly fromCityName = computed(() =>
    (this.schedule()?.trip.route.stops ?? []).find(s => s.order === this.fromStopOrder)?.cityName ?? '—'
  );
  readonly toCityName = computed(() =>
    (this.schedule()?.trip.route.stops ?? []).find(s => s.order === this.toStopOrder)?.cityName ?? '—'
  );

  readonly loadingSeats  = signal(false);
  readonly seatError     = signal<string | null>(null);
  readonly seats         = signal<SeatInfo[]>([]);
  readonly selectedSeats = signal<number[]>([]);

  readonly seatRows = computed(() => {
    const total = this.schedule()?.bus.capacity ?? 0;
    const rows: (number | 0)[][] = [];
    let n = 1;
    while (n <= total) {
      const row: (number | 0)[] = [];
      row.push(n <= total ? n++ : 0);
      row.push(n <= total ? n++ : 0);
      row.push(0); // allée
      row.push(n <= total ? n++ : 0);
      row.push(n <= total ? n++ : 0);
      rows.push(row);
    }
    return rows;
  });

  readonly paxNames  = signal<string[]>([]);
  readonly paxPhones = signal<string[]>([]);

  readonly paymentMethod = signal('CASH');
  readonly paymentLabel  = computed(() =>
    PAYMENT_OPTIONS.find(p => p.id === this.paymentMethod())?.label ?? 'Espèces'
  );

  readonly confirming = signal(false);
  readonly bookingErr = signal<string | null>(null);

  readonly canConfirm = computed(() => {
    const seats  = this.selectedSeats();
    const names  = this.paxNames();
    const phones = this.paxPhones();
    return seats.length > 0 &&
      seats.every((_, i) => (names[i] ?? '').trim().length >= 2 && (phones[i] ?? '').trim().length >= 8);
  });

  ngOnInit(): void {
    if (!this.schedule()) { this.router.navigate(['/search']); return; }
    const stops = this.schedule()!.trip.route.stops;
    if (stops.length >= 2) {
      this.fromStopOrder = stops[0].order;
      this.toStopOrder   = stops[stops.length - 1].order;
    }
    this.loadSeatMap();
  }

  onSegmentChange(): void {
    this.selectedSeats.set([]);
    this.paxNames.set([]);
    this.paxPhones.set([]);
    this.loadSeatMap();
  }

  private loadSeatMap(): void {
    const s = this.schedule();
    if (!s || !this.fromStopOrder || !this.toStopOrder || this.fromStopOrder >= this.toStopOrder) return;
    this.loadingSeats.set(true);
    this.seatError.set(null);
    this.api.getSeatMap(s.scheduleId, this.fromStopOrder, this.toStopOrder).subscribe({
      next:  r => { this.seats.set(r.seats); this.loadingSeats.set(false); },
      error: e => { this.seatError.set(e?.error?.message ?? 'Erreur chargement sièges'); this.loadingSeats.set(false); },
    });
  }

  isTaken(n: number): boolean    { return this.seats().find(s => s.seatNumber === n)?.status === 'taken'; }
  isSelected(n: number): boolean { return this.selectedSeats().includes(n); }

  toggleSeat(n: number): void {
    if (this.isTaken(n)) return;
    const cur = this.selectedSeats();
    const idx = cur.indexOf(n);
    if (idx >= 0) {
      const next = cur.filter(s => s !== n);
      const names  = [...this.paxNames()];  names.splice(idx, 1);
      const phones = [...this.paxPhones()]; phones.splice(idx, 1);
      this.selectedSeats.set(next);
      this.paxNames.set(names); this.paxPhones.set(phones);
    } else {
      this.selectedSeats.set([...cur, n].sort((a, b) => a - b));
      this.paxNames.set([...this.paxNames(), '']);
      this.paxPhones.set([...this.paxPhones(), '']);
    }
  }

  setPaxName(i: number, v: string):  void { const a = [...this.paxNames()];  a[i] = v; this.paxNames.set(a); }
  setPaxPhone(i: number, v: string): void { const a = [...this.paxPhones()]; a[i] = v; this.paxPhones.set(a); }

  confirm(): void {
    if (!this.canConfirm() || this.confirming()) return;
    const s      = this.schedule()!;
    const seats  = this.selectedSeats();
    const names  = this.paxNames();
    const phones = this.paxPhones();

    this.confirming.set(true);
    this.bookingErr.set(null);

    // FIX : envoyer TOUS les passagers en un seul appel bulk
    this.api.createReservation({
      scheduleId:    s.scheduleId,
      fromStopOrder: this.fromStopOrder,
      toStopOrder:   this.toStopOrder,
      paymentMethod: this.paymentMethod(),
      passengers:    seats.map((seat, i) => ({
        seatNumber:     seat,
        passengerName:  names[i],
        passengerPhone: phones[i],
      })),
    }).subscribe({
      next: result => {
        this.state.setSchedule(s, this.fromStopOrder, this.toStopOrder, this.fromCityName(), this.toCityName());
        this.state.setPassengers(seats.map((seat, i) => ({
          seatNumber:     seat,
          passengerName:  names[i],
          passengerPhone: phones[i],
        })));
        this.state.setResult(result);
        this.confirming.set(false);
        this.router.navigate(['/confirm']);
      },
      error: e => {
        this.bookingErr.set(e?.error?.message ?? 'Erreur lors de la réservation');
        this.confirming.set(false);
      },
    });
  }

  fmtTime(dt: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
