/**
 * TicketOfficeComponent v2
 *
 * Fichier : apps/web/src/app/features/agent/ticket-office/ticket-office.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] avec variables locales → ticket-office.component.scss
 *   ✅ Stepper → StepperComponent visible (6 étapes, signal currentStep)
 *   ✅ Emojis ✅ → NavIconComponent (confirm-bar)
 *   ✅ Emojis 🖨 → NavIconComponent (print)
 *   ✅ Emojis 🚌 dans bus-hd → NavIconComponent
 *   ✅ Emojis 🎫 dans tk-head → NavIconComponent
 *   ✅ Emojis 🪙 📱 dans PMS → retirés, labels suffisent
 *   ✅ style="text-align:right" inline → classe CSS
 *   ✅ style="font-size:1.3rem" inline → supprimé
 *   ✅ Variables --B/--G/--R → var(--brand)/var(--success)/var(--danger)
 *   ✅ Logique métier : inchangée (100%)
 */
import {
  Component, ChangeDetectionStrategy, inject,
  signal, computed, DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ReservationsApiService,
  ScheduleForSale, SeatInfo, RouteStop,
  BulkResult, TicketDto, PassengerPayload,
} from './services/reservations.service';
import { SaleChannel, PaymentMethod } from '@fasossira/shared-types';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { StepperComponent, StepConfig } from '../../../shared/components/stepper/stepper.component';
import { ICONS } from '../../../shared/tokens/icons';

interface PassengerForm { seatNumber: number; name: string; phone: string; }

const todayStr = () => new Date().toISOString().split('T')[0];
const fmtTime  = (dt: string) => dt ? new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate  = (d:  string) => d  ? new Date(d).toLocaleDateString('fr-FR',  { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtAmt   = (n:  number) => `${Number(n).toLocaleString('fr-FR')} FCFA`;
const sortStop = (s:  RouteStop[]) => [...s].sort((a, b) => a.order - b.order);
const calcDur  = (dep: string, arr: string) => {
  const m = Math.round((new Date(arr).getTime() - new Date(dep).getTime()) / 60000);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}min`;
};

const TICKET_STEPS: StepConfig[] = [
  { label: 'Trajet & Date' },
  { label: 'Voyage'        },
  { label: 'Sièges'        },
  { label: 'Passagers'     },
  { label: 'Paiement'      },
  { label: 'Confirmation'  },
];

@Component({
  selector: 'fas-ticket-office',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NavIconComponent, StepperComponent],
  template: `
<div class="wrap">

  <!-- TOP BAR -->
  <div class="topbar">
    <div>
      <h1 class="page-title">Vente au Guichet</h1>
      <p class="page-sub">Agence · {{ today }}</p>
    </div>
    @if (done()) {
      <button class="btn-primary" (click)="reset()">
        <fas-nav-icon [path]="icons.plus" [size]="13" />
        Nouvelle Vente
      </button>
    }
  </div>

  <!-- ✅ STEPPER — visible uniquement pendant la vente -->
  @if (!done()) {
    <fas-stepper
      [steps]="ticketSteps"
      [currentStep]="currentStep()"
      storageKey="ticket-office-step"
    />
  }

  <!-- ── CONFIRMATION + BILLETS ── -->
  @if (done()) {
    <!-- ✅ confirm-bar : ✅ → NavIconComponent -->
    <div class="confirm-bar">
      <div class="confirm-icon-wrap">
        <fas-nav-icon [path]="icons.check" [size]="18" color="var(--white)" />
      </div>
      <div>
        <strong>{{ result()!.created }} billet{{ result()!.created > 1 ? 's' : '' }} émis</strong>
        <span class="confirm-sub"> · Total encaissé : {{ fmtAmt(result()!.totalAmount) }}</span>
      </div>
      <!-- ✅ 🖨 → NavIconComponent -->
      <button class="btn-outline" onclick="window.print()">
        <fas-nav-icon [path]="icons.printer" [size]="14" color="currentColor" />
        Imprimer
      </button>
    </div>

    <div class="tickets-grid">
      @for (t of tickets(); track t.reference) {
        <div class="tk">
          <div class="tk-head">
            <div>
              <div class="tk-co">FASOSSIRA</div>
              <div class="tk-ref">{{ t.reference }}</div>
            </div>
            <!-- ✅ 🎫 → NavIconComponent -->
            <fas-nav-icon [path]="icons.ticket" [size]="22" color="rgba(255,255,255,.7)" />
          </div>
          <div class="tk-body">
            <div class="tk-route">
              <div>
                <b>{{ t.fromCityName }}</b>
                <small>{{ fmtTime(t.departureDateTime) }}</small>
              </div>
              <div class="tk-line"></div>
              <!-- ✅ style="text-align:right" → classe CSS -->
              <div class="text-right">
                <b>{{ t.toCityName }}</b>
                <small>{{ fmtTime(t.arrivalDateTime) }}</small>
              </div>
            </div>
            <div class="tk-infos">
              <div class="tk-r"><span>Passager</span><span>{{ t.passengerName }}</span></div>
              <div class="tk-r"><span>Siège</span><span>#{{ t.seatNumber }}</span></div>
              <div class="tk-r"><span>Date</span><span>{{ fmtDate(t.departureDateTime) }}</span></div>
              <div class="tk-r"><span>Bus</span><span>{{ t.busPlate }}</span></div>
            </div>
          </div>
          <div class="tk-foot">
            {{ fmtAmt(t.amount) }}
            <span class="ok-badge">
              <fas-nav-icon [path]="icons.check" [size]="10" color="currentColor" />
              Confirmé
            </span>
          </div>
        </div>
      }
    </div>
  }

  <!-- ── FORMULAIRE ── -->
  @if (!done()) {
    <div class="body">

      <!-- ════ GAUCHE ════ -->
      <div class="left">

        <!-- SECTION 1 — Trajet & Date -->
        <section class="card">
          <div class="card-row3">
            <div class="field">
              <label>Départ</label>
              <select [(ngModel)]="sFrom" (ngModelChange)="trigSearch()">
                <option value="">Toutes les villes</option>
                @for (c of cities(); track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>
            <div class="field">
              <label>Destination</label>
              <select [(ngModel)]="sTo" (ngModelChange)="trigSearch()">
                <option value="">Toutes les villes</option>
                @for (c of cities(); track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>
            <div class="field">
              <label>Date</label>
              <input type="date" [(ngModel)]="sDate" [min]="today" (ngModelChange)="trigSearch()" />
            </div>
          </div>
        </section>

        <!-- SECTION 2 — Voyages disponibles -->
        @if (loadScheds() || scheds().length) {
          <section class="card">
            <div class="sec-title">
              Voyages disponibles
              @if (scheds().length) {
                <span class="chip chip-blue">{{ scheds().length }} résultat{{ scheds().length > 1 ? 's' : '' }}</span>
              }
            </div>
            @if (loadScheds()) {
              <div class="skel"></div><div class="skel"></div>
            } @else {
              @for (s of scheds(); track s.id) {
                <button class="voyage-row" [class.active]="picked()?.id === s.id" (click)="pick(s)">
                  <div class="vr-times">
                    <div><span class="t-big">{{ fmtTime(s.departureDateTime) }}</span><span class="t-sub">{{ firstCity(s) }}</span></div>
                    <span class="t-dash">—</span>
                    <div><span class="t-big">{{ fmtTime(s.arrivalDateTime) }}</span><span class="t-sub">{{ lastCity(s) }}</span></div>
                  </div>
                  <div class="vr-meta">
                    <span class="dur">{{ calcDur(s.departureDateTime, s.arrivalDateTime) }}</span>
                    <span class="status-dot" [class.dot-green]="s.status === 'SCHEDULED'" [class.dot-blue]="s.status === 'IN_PROGRESS'">
                      ● {{ s.status === 'IN_PROGRESS' ? 'En cours' : 'Planifié' }}
                    </span>
                  </div>
                  <div class="vr-seats">
                    <b>{{ s.availableSeats }}</b>
                    <small>sièges libres</small>
                  </div>
                </button>
              }
            }

            <!-- Segment De → À -->
            @if (picked()) {
              <div class="segment">
                <div class="field flex1">
                  <label>De</label>
                  <select [(ngModel)]="fromOrd" (ngModelChange)="onSeg()">
                    @for (st of stops(); track st.order) {
                      @if (st.order < toOrd || !toOrd) {
                        <option [ngValue]="st.order">{{ st.cityName }}</option>
                      }
                    }
                  </select>
                </div>
                <span class="seg-arrow">→</span>
                <div class="field flex1">
                  <label>À</label>
                  <select [(ngModel)]="toOrd" (ngModelChange)="onSeg()">
                    @for (st of stops(); track st.order) {
                      @if (st.order > fromOrd) {
                        <option [ngValue]="st.order">{{ st.cityName }}</option>
                      }
                    }
                  </select>
                </div>
              </div>
            }
          </section>
        }

        <!-- SECTION 3 — Plan des sièges -->
        @if (picked() && fromOrd && toOrd) {
          <section class="card">
            <div class="sec-title">
              Plan des sièges
              <span class="chip chip-blue">{{ selSeats().length }} sélectionné{{ selSeats().length > 1 ? 's' : '' }}</span>
              <div class="legend">
                <span><i class="dot dot-f"></i>Libre</span>
                <span><i class="dot dot-t"></i>Occupé</span>
                <span><i class="dot dot-s"></i>Sélectionné</span>
              </div>
            </div>

            @if (loadMap()) {
              <div class="loading-txt">Chargement du plan…</div>
            } @else {
              <!-- ✅ 🚌 → NavIconComponent -->
              <div class="bus-hd">
                <div class="bus-icon-wrap">
                  <fas-nav-icon [path]="icons.bus" [size]="20" color="var(--brand)" />
                </div>
                <div class="bus-info">
                  <b>{{ freeN() }}</b> libres
                  <small>Capacité bus : {{ picked()!.totalSeats }} sièges</small>
                </div>
              </div>
              <div class="seatmap">
                @for (row of grid(); track $index) {
                  <div class="seat-row">
                    @for (n of row; track n) {
                      @if (n === 0) { <div class="aisle"></div> }
                      @else {
                        <button class="seat"
                          [class.taken]="isTaken(n)"
                          [class.sel]="isSel(n)"
                          [disabled]="isTaken(n)"
                          (click)="toggle(n)">{{ n }}</button>
                      }
                    }
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- SECTION 4 — Passagers -->
        @if (paxForms().length) {
          <section class="card">
            <div class="sec-title">Informations passagers</div>
            @for (p of paxForms(); track p.seatNumber; let i = $index) {
              <div class="pax-card">
                <div class="pax-hd">
                  <span class="pax-seat">#{{ p.seatNumber }}</span>
                  <span class="pax-lbl">Passager {{ i + 1 }}</span>
                </div>
                <div class="pax-row">
                  <div class="field">
                    <label>Nom complet <span class="req">*</span></label>
                    <input type="text"
                      [ngModel]="p.name"
                      (ngModelChange)="setPax(i, 'name', $event)"
                      placeholder="ex: Amadou Diallo" />
                  </div>
                  <div class="field">
                    <label>Téléphone <span class="req">*</span></label>
                    <input type="tel"
                      [ngModel]="p.phone"
                      (ngModelChange)="setPax(i, 'phone', $event)"
                      placeholder="+223 7X XX XX XX" />
                  </div>
                </div>
              </div>
            }
          </section>
        }

        <!-- SECTION 5 — Mode de paiement -->
        @if (paxForms().length) {
          <section class="card">
            <div class="sec-title">Mode de paiement</div>
            <div class="pm-row">
              <!-- ✅ PMS sans emojis 🪙 📱 — icônes SVG + label -->
              @for (pm of PMS; track pm.v) {
                <label class="pm-opt" [class.pm-active]="payM === pm.v">
                  <input type="radio" name="pm" [value]="pm.v" [(ngModel)]="payM" />
                  <fas-nav-icon [path]="pm.icon" [size]="15" color="currentColor" />
                  <span>{{ pm.label }}</span>
                </label>
              }
            </div>
            @if (payM !== CASH) {
              <div class="field" style="max-width:320px;margin-top:14px">
                <label>Référence transaction <span class="req">*</span></label>
                <input type="text" [(ngModel)]="extRef" placeholder="ex: OM-123456789" />
              </div>
            }
          </section>
        }

        @if (errMsg()) { <div class="err-bar">{{ errMsg() }}</div> }
      </div>

      <!-- ════ DROITE — RÉCAP ════ -->
      <aside class="right">
        <div class="recap">
          <div class="recap-hd">
            <div>
              <div class="recap-co">SOTRAMA BAMAKO</div>
              <div class="recap-sub">Billet électronique</div>
            </div>
            <div class="recap-ref">REF-{{ yr }}-••••••••</div>
          </div>

          @if (picked()) {
            <div class="recap-route">
              <div>
                <b>{{ fromCity() }}</b>
                <small>{{ fmtTime(picked()!.departureDateTime) }}</small>
              </div>
              <div class="r-line"></div>
              <!-- ✅ style="text-align:right" → classe -->
              <div class="text-right">
                <b>{{ toCity() }}</b>
                <small>{{ fmtTime(picked()!.arrivalDateTime) }}</small>
              </div>
            </div>
          } @else {
            <div class="recap-ph">— Sélectionnez un voyage —</div>
          }

          <div class="recap-rows">
            <div class="rr"><span>Date</span><span>{{ picked() ? fmtDate(picked()!.departureDateTime) : '—' }}</span></div>
            <div class="rr">
              <span>Siège{{ selSeats().length > 1 ? 's' : '' }}</span>
              <span class="seat-chips">
                @if (selSeats().length) { @for (s of selSeats(); track s) { <b>#{{ s }}</b> } } @else { — }
              </span>
            </div>
            <div class="rr"><span>Bus</span><span>{{ picked()?.bus?.plate ?? '—' }}</span></div>
            <div class="rr"><span>Canal</span><span class="chip chip-blue">● Guichet</span></div>
          </div>

          <div class="recap-sep"></div>

          <div class="recap-total">
            <span>Total</span>
            <span>{{ selSeats().length > 0 ? selSeats().length + ' siège' + (selSeats().length > 1 ? 's' : '') : '—' }}</span>
          </div>

          <div class="recap-qr">
            <fas-nav-icon [path]="icons.qrCode" [size]="32" color="var(--gray-300)" />
            <small>À la confirmation</small>
          </div>

          <button class="btn-confirm" [disabled]="!ready() || saving()" (click)="confirm()">
            @if (saving()) {
              Enregistrement…
            } @else {
              <!-- ✅ ✅ → NavIconComponent -->
              <fas-nav-icon [path]="icons.check" [size]="15" color="currentColor" />
              Confirmer &amp; Imprimer
            }
          </button>

          @if (!ready() && paxForms().length) {
            <div class="recap-hint">{{ hint() }}</div>
          }
        </div>
      </aside>
    </div>
  }
</div>
  `,
  styleUrl: './ticket-office.component.scss',
})
export class TicketOfficeComponent {
  private readonly api        = inject(ReservationsApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly icons    = ICONS;

  readonly today       = todayStr();
  readonly yr          = new Date().getFullYear();
  readonly CASH        = PaymentMethod.CASH;
  readonly fmtTime     = fmtTime;
  readonly fmtDate     = fmtDate;
  readonly fmtAmt      = fmtAmt;
  readonly calcDur     = calcDur;
  readonly ticketSteps = TICKET_STEPS;

  /** ✅ PMS : emojis 🪙 📱 remplacés par paths SVG Lucide */
  readonly PMS = [
    { v: PaymentMethod.CASH,                icon: ICONS.dollarSign, label: 'Espèces'      },
    { v: PaymentMethod.MOBILE_MONEY_ORANGE, icon: ICONS.smartphone,  label: 'Orange Money' },
    { v: PaymentMethod.MOBILE_MONEY_MOOV,   icon: ICONS.smartphone,  label: 'Moov Money'   },
  ];

  // ── Signals ──────────────────────────────────────────────────
  scheds      = signal<ScheduleForSale[]>([]);
  picked      = signal<ScheduleForSale | null>(null);
  seatMapData = signal<SeatInfo[]>([]);
  selSeats    = signal<number[]>([]);
  paxForms    = signal<PassengerForm[]>([]);
  result      = signal<BulkResult | null>(null);
  tickets     = signal<TicketDto[]>([]);
  loadScheds  = signal(false);
  loadMap     = signal(false);
  saving      = signal(false);
  errMsg      = signal<string | null>(null);

  // ── Plain state ───────────────────────────────────────────────
  sFrom = ''; sTo = ''; sDate = todayStr();
  fromOrd = 0; toOrd = 0;
  payM: PaymentMethod = PaymentMethod.CASH;
  extRef = '';

  // ── Stepper step courant (0-based) ────────────────────────────
  readonly currentStep = computed((): number => {
    if (this.done()) return 5;
    if (this.paxForms().length && this.payM) return 4;
    if (this.paxForms().length) return 3;
    if (this.selSeats().length > 0) return 3;
    if (this.picked() && this.fromOrd && this.toOrd) return 2;
    if (this.picked()) return 1;
    return 0;
  });

  // ── Computed ──────────────────────────────────────────────────
  done  = computed(() => !!this.result());

  stops = computed<RouteStop[]>(() => {
    const s = this.picked(); return s ? sortStop(s.trip.route.stops) : [];
  });

  cities = computed(() => {
    const c = new Set<string>();
    this.scheds().forEach(s => s.trip.route.stops.forEach(st => c.add(st.cityName)));
    return [...c].sort();
  });

  fromCity = computed(() => this.stops().find(s => s.order === this.fromOrd)?.cityName ?? '—');
  toCity   = computed(() => this.stops().find(s => s.order === this.toOrd)?.cityName   ?? '—');
  freeN    = computed(() => this.seatMapData().filter(s => s.status === 'free').length);

  grid = computed<number[][]>(() => {
    const tot = this.picked()?.totalSeats ?? 0;
    const rows: number[][] = []; let n = 1;
    while (n <= tot) rows.push([n <= tot ? n++ : 0, n <= tot ? n++ : 0, 0, n <= tot ? n++ : 0, n <= tot ? n++ : 0]);
    return rows;
  });

  ready = computed(() => {
    if (!this.picked() || !this.selSeats().length) return false;
    if (!this.paxForms().every(p => p.name.trim() && p.phone.trim())) return false;
    if (this.payM !== PaymentMethod.CASH && !this.extRef.trim()) return false;
    return true;
  });

  hint = computed(() => {
    if (!this.picked()) return 'Sélectionnez un voyage';
    if (!this.selSeats().length) return 'Sélectionnez au moins un siège';
    if (!this.paxForms().every(p => p.name.trim() && p.phone.trim()))
      return 'Remplissez les infos de chaque passager';
    if (this.payM !== PaymentMethod.CASH && !this.extRef.trim())
      return 'Référence de transaction obligatoire';
    return '';
  });

  // ── Helpers ───────────────────────────────────────────────────
  isTaken  = (n: number) => this.seatMapData().find(s => s.seatNumber === n)?.status === 'taken';
  isSel    = (n: number) => this.selSeats().includes(n);
  firstCity = (s: ScheduleForSale) => sortStop(s.trip.route.stops)[0]?.cityName ?? '—';
  lastCity  = (s: ScheduleForSale) => sortStop(s.trip.route.stops).at(-1)?.cityName ?? '—';

  // ── Search ────────────────────────────────────────────────────
  private _t: ReturnType<typeof setTimeout> | null = null;

  trigSearch() {
    if (this._t) clearTimeout(this._t);
    this._t = setTimeout(() => this.loadSchedules(), 300);
  }

  async loadSchedules() {
    if (!this.sDate) return;
    this.loadScheds.set(true); this.clearSel();
    try {
      const r = await firstValueFrom(this.api.getSchedulesForSale({
        date: this.sDate,
        fromStopName: this.sFrom || undefined,
        toStopName:   this.sTo   || undefined,
      }));
      this.scheds.set(r);
    } catch { this.scheds.set([]); }
    finally { this.loadScheds.set(false); }
  }

  // ── Pick schedule ──────────────────────────────────────────────
  pick(s: ScheduleForSale) {
    this.picked.set(s);
    const stops = sortStop(s.trip.route.stops);
    this.fromOrd = stops[0]?.order ?? 0;
    this.toOrd   = stops.at(-1)?.order ?? 0;
    this.clearSel();
    this.fetchMap();
  }

  onSeg() { this.clearSel(); this.fetchMap(); }

  async fetchMap() {
    const s = this.picked();
    if (!s || !this.fromOrd || !this.toOrd || this.fromOrd >= this.toOrd) return;
    this.loadMap.set(true);
    try {
      const map = await firstValueFrom(this.api.getSeatMap(s.id, this.fromOrd, this.toOrd));
      this.seatMapData.set(map.seats);
    } catch { this.seatMapData.set([]); }
    finally { this.loadMap.set(false); }
  }

  // ── Seats ─────────────────────────────────────────────────────
  toggle(n: number) {
    if (this.isTaken(n)) return;
    const cur  = this.selSeats();
    const next = this.isSel(n)
      ? cur.filter(x => x !== n)
      : [...cur, n].sort((a, b) => a - b);
    this.selSeats.set(next);
    this.paxForms.set(next.map(seat => {
      const ex = this.paxForms().find(p => p.seatNumber === seat);
      return ex ?? { seatNumber: seat, name: '', phone: '' };
    }));
  }

  // ── Pax ───────────────────────────────────────────────────────
  setPax(i: number, f: 'name' | 'phone', v: string) {
    const forms = [...this.paxForms()];
    forms[i] = { ...forms[i], [f]: v };
    this.paxForms.set(forms);
  }

  // ── Confirm ───────────────────────────────────────────────────
  async confirm() {
    this.errMsg.set(null);
    if (!this.ready()) return;
    this.saving.set(true);
    try {
      const passengers: PassengerPayload[] = this.paxForms().map(p => ({
        seatNumber: p.seatNumber, passengerName: p.name.trim(), passengerPhone: p.phone.trim(),
      }));
      const bulk = await firstValueFrom(this.api.createBulk({
        scheduleId: this.picked()!.id,
        fromStopOrder: this.fromOrd, toStopOrder: this.toOrd,
        saleChannel: SaleChannel.AGENCY, paymentMethod: this.payM,
        externalRef: this.extRef || undefined, passengers,
      }));
      this.result.set(bulk);
      const tks = await Promise.all(
        bulk.reservations.map(r => firstValueFrom(this.api.getTicket(r.reference)))
      );
      this.tickets.set(tks);
    } catch (e: any) {
      const m = e?.error?.message;
      this.errMsg.set(Array.isArray(m) ? m.join(' · ') : m ?? 'Erreur lors de la réservation.');
    } finally { this.saving.set(false); }
  }

  // ── Reset ─────────────────────────────────────────────────────
  clearSel() { this.selSeats.set([]); this.paxForms.set([]); this.seatMapData.set([]); this.errMsg.set(null); }

  reset() {
    this.result.set(null); this.tickets.set([]);
    this.picked.set(null); this.scheds.set([]);
    this.clearSel();
    this.sFrom = ''; this.sTo = ''; this.sDate = todayStr();
    this.payM = PaymentMethod.CASH; this.extRef = '';
    this.loadSchedules();
  }

  constructor() {
    this.destroyRef.onDestroy(() => { if (this._t) clearTimeout(this._t); });
    this.loadSchedules();
  }
}
