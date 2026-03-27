import {
    Component, ChangeDetectionStrategy, inject,
    signal, computed, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
    ReservationsApiService,
    ScheduleForSale, SeatInfo, RouteStop,
    BulkResult, TicketDto, PassengerPayload,
} from '../ticket-office/services/reservations.service';
import { SaleChannel, PaymentMethod } from '@fasossira/shared-types';

const todayStr = () => new Date().toISOString().split('T')[0];
const fmtTime  = (dt: string) => dt ? new Date(dt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '—';
const fmtDate  = (d:  string) => d  ? new Date(d).toLocaleDateString('fr-FR',  { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';
const fmtAmt   = (n:  number) => `${Number(n).toLocaleString('fr-FR')} FCFA`;
const fmtAmtK  = (n:  number) => n >= 1000 ? `${(n/1000).toLocaleString('fr-FR')}K` : `${n}`;
const sortStop = (s: RouteStop[]) => [...s].sort((a, b) => a.order - b.order);

interface PassengerForm { seatNumber: number; name: string; phone: string; }

@Component({
    selector: 'fas-on-route',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule],
    template: `
<div class="or-wrap">

  <!-- TOP BAR -->
  <div class="or-topbar">
    <div><h1>Vente en Route</h1><p>Interface agent à bord</p></div>
    @if (!done()) {
      <button class="or-btn-new" (click)="newSale()">+ Nouvelle Vente</button>
    } @else {
      <button class="or-btn-new" (click)="fullReset()">+ Nouvelle Vente</button>
    }
  </div>

  <!-- ── CONFIRMATION ── -->
  @if (done()) {
    <div class="or-confirm">
      <div class="or-confirm-icon">✅</div>
      <div>
        <strong>{{ lastResult()!.created }} billet{{ lastResult()!.created > 1 ? 's' : '' }} créé{{ lastResult()!.created > 1 ? 's' : '' }}</strong>
        <span class="or-confirm-sub"> · {{ fmtAmt(lastResult()!.totalAmount) }} encaissé{{ lastResult()!.created > 1 ? 's' : '' }}</span>
      </div>
      <button class="or-outline-btn" onclick="window.print()">🖨 Imprimer</button>
    </div>
    <div class="or-tickets">
      @for (t of tickets(); track t.reference) {
        <div class="or-tk">
          <div class="or-tk-hd">
            <div><div class="or-tk-co">FASOSSIRA</div><div class="or-tk-ref">{{ t.reference }}</div></div>
            <span>🎫</span>
          </div>
          <div class="or-tk-body">
            <div class="or-tk-route">
              <div><b>{{ t.fromCityName }}</b><small>{{ fmtTime(t.departureDateTime) }}</small></div>
              <div class="or-tk-bar"></div>
              <div style="text-align:right"><b>{{ t.toCityName }}</b><small>{{ fmtTime(t.arrivalDateTime) }}</small></div>
            </div>
            <div class="or-tk-rows">
              <div class="or-tk-r"><span>Passager</span><span>{{ t.passengerName }}</span></div>
              <div class="or-tk-r"><span>Siège</span><span>#{{ t.seatNumber }}</span></div>
              <div class="or-tk-r"><span>Date</span><span>{{ fmtDate(t.departureDateTime) }}</span></div>
            </div>
          </div>
          <div class="or-tk-ft">{{ fmtAmt(t.amount) }}<span class="or-ok">✓ Confirmé</span></div>
        </div>
      }
    </div>
  }

  <!-- ── CONTENU PRINCIPAL ── -->
  @if (!done()) {
    <div class="or-body">

      <!-- ════ GAUCHE : sélection voyage + progression ════ -->
      <div class="or-left">

        <!-- Sélecteur de voyage actif -->
        @if (!activeSchedule()) {
          <div class="or-card">
            <div class="or-card-title">Voyage en cours aujourd'hui</div>
            <div class="or-field">
              <label>Date</label>
              <input type="date" [(ngModel)]="sDate" [max]="today" [min]="today" />
            </div>
            @if (loadScheds()) {
              <div class="or-skel"></div><div class="or-skel"></div>
            } @else if (!scheds().length) {
              <div class="or-empty">Aucun voyage actif · <button class="or-link" (click)="loadSchedules()">Actualiser</button></div>
            } @else {
              @for (s of scheds(); track s.id) {
                <button class="or-sched-btn" (click)="setActive(s)">
                  <div class="or-sb-route">🚌 {{ s.trip.route.name }}</div>
                  <div class="or-sb-meta">{{ fmtTime(s.departureDateTime) }} · {{ s.status === 'IN_PROGRESS' ? 'En cours' : 'Planifié' }}</div>
                  <div class="or-sb-badge" [class.in-progress]="s.status==='IN_PROGRESS'">
                    {{ s.status === 'IN_PROGRESS' ? 'En route' : 'Planifié' }}
                  </div>
                </button>
              }
            }
          </div>
        }

        <!-- Bandeau voyage actif -->
        @if (activeSchedule()) {
          <div class="or-active-banner">
            <div class="or-banner-top">
              <div>
                <div class="or-banner-route">🚌 {{ activeSchedule()!.trip.route.name }}</div>
                <div class="or-banner-meta">{{ fmtDate(activeSchedule()!.departureDateTime) }} · Départ {{ fmtTime(activeSchedule()!.departureDateTime) }}</div>
              </div>
              <span class="or-status-badge" [class.in-progress]="activeSchedule()!.status==='IN_PROGRESS'">
                {{ activeSchedule()!.status === 'IN_PROGRESS' ? 'En route' : 'Planifié' }}
              </span>
            </div>
            <div class="or-banner-stats">
              <div class="or-stat">
                <span class="or-stat-n">{{ boardedCount() }}</span>
                <span class="or-stat-l">À bord</span>
              </div>
              <div class="or-stat">
                <span class="or-stat-n">{{ freeCount() }}</span>
                <span class="or-stat-l">Libres</span>
              </div>
              <div class="or-stat">
                <span class="or-stat-n">{{ fmtAmtK(revenueK()) }}K</span>
                <span class="or-stat-l">FCFA</span>
              </div>
            </div>
            <button class="or-change-btn" (click)="changeSchedule()">Changer de voyage</button>
          </div>

          <!-- Progression du trajet -->
          <div class="or-card">
            <div class="or-card-title-sm">PROGRESSION DU TRAJET</div>
            <div class="or-progress">
              @for (stop of activeStops(); track stop.order; let i = $index) {
                <div class="or-prog-item">
                  <div class="or-prog-dot"
                       [class.done]="stop.order < currentStopOrder()"
                       [class.current]="stop.order === currentStopOrder()">
                    @if (stop.order < currentStopOrder()) { ✓ }
                    @else if (stop.order === currentStopOrder()) { ● }
                    @else { {{ stop.order }} }
                  </div>
                  <div class="or-prog-label">{{ stop.cityName }}</div>
                  @if (!$last) { <div class="or-prog-line" [class.done]="stop.order < currentStopOrder()"></div> }
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- ════ DROITE : formulaire embarquement ════ -->
      @if (activeSchedule()) {
        <div class="or-right">
          <div class="or-card">
            <div class="or-card-title">Embarquement passager{{ paxForms().length > 1 ? 's' : '' }}</div>

            <!-- Segment -->
            <div class="or-segment">
              <div class="or-field">
                <label>Montée</label>
                <select [(ngModel)]="fromOrd" (ngModelChange)="onSegChange()">
                  @for (st of activeStops(); track st.order) {
                    @if (st.order < toOrd || !toOrd) { <option [ngValue]="st.order">{{ st.cityName }}{{ st.order === currentStopOrder() ? ' (actuel)' : '' }}</option> }
                  }
                </select>
              </div>
              <div class="or-seg-arrow">→</div>
              <div class="or-field">
                <label>Descente</label>
                <select [(ngModel)]="toOrd" (ngModelChange)="onSegChange()">
                  @for (st of activeStops(); track st.order) {
                    @if (st.order > fromOrd) { <option [ngValue]="st.order">{{ st.cityName }}</option> }
                  }
                </select>
              </div>
            </div>

            <!-- Champs passagers dynamiques -->
            @for (p of paxForms(); track p.seatNumber; let i = $index) {
              <div class="or-pax">
                <div class="or-pax-hd">
                  <span class="or-pax-seat">#{{ p.seatNumber }}</span>
                  <span>Passager {{ i + 1 }}</span>
                </div>
                <div class="or-pax-row">
                  <div class="or-field">
                    <label>Nom passager <span class="req">*</span></label>
                    <input type="text" [ngModel]="p.name"
                           (ngModelChange)="setPax(i,'name',$event)"
                           placeholder="Nom complet" />
                  </div>
                  <div class="or-field">
                    <label>Téléphone <span class="req">*</span></label>
                    <input type="tel" [ngModel]="p.phone"
                           (ngModelChange)="setPax(i,'phone',$event)"
                           placeholder="+223 ..." />
                  </div>
                </div>
              </div>
            }

            <!-- Sélecteur de siège libre -->
            @if (fromOrd && toOrd) {
              <div class="or-seat-picker">
                <div class="or-field">
                  <label>Siège libre <span class="req">*</span></label>
                  @if (loadMap()) {
                    <div class="or-loading">Chargement…</div>
                  } @else {
                    <div class="or-freelist">
                      @for (s of freeSeats(); track s.seatNumber) {
                        <button class="or-free-seat"
                                [class.or-free-selected]="isSelected(s.seatNumber)"
                                (click)="toggleSeat(s.seatNumber)">
                          #{{ s.seatNumber }}
                        </button>
                      }
                      @if (!freeSeats().length) {
                        <span class="or-empty-seats">Aucun siège libre sur ce segment</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Prix + siège sélectionné -->
            @if (selSeats().length > 0 && fromOrd && toOrd) {
              <div class="or-price-row">
                <div>
                  <div class="or-price-label">Prix {{ fromCityName() }} → {{ toCityName() }}</div>
                  <div class="or-price-amount">— FCFA</div>
                </div>
                <div style="text-align:right">
                  <div class="or-price-label">Siège{{ selSeats().length > 1 ? 's' : '' }} libre{{ selSeats().length > 1 ? 's' : '' }}</div>
                  <div class="or-seat-badge">{{ selSeatsStr() }}</div>
                </div>
              </div>
            }

            <!-- Mode de paiement -->
            @if (paxForms().length) {
              <div class="or-pm-section">
                <label class="or-pm-label">Mode de paiement</label>
                <div class="or-pm-row">
                  @for (pm of PMS; track pm.v) {
                    <label class="or-pm-opt" [class.active]="payM === pm.v">
                      <input type="radio" name="or-pm" [value]="pm.v" [(ngModel)]="payM" />
                      <span>{{ pm.icon }}</span><span>{{ pm.label }}</span>
                    </label>
                  }
                </div>
                @if (payM !== CASH) {
                  <div class="or-field" style="margin-top:10px">
                    <label>Référence transaction <span class="req">*</span></label>
                    <input type="text" [(ngModel)]="extRef" placeholder="ex: OM-123456789" />
                  </div>
                }
              </div>
            }

            @if (errMsg()) { <div class="or-err">{{ errMsg() }}</div> }

            <button class="or-btn-encaisser" [disabled]="!ready() || saving()" (click)="confirm()">
              {{ saving() ? 'Enregistrement…' : '🪙 Encaisser &amp; Créer le billet' }}
            </button>
          </div>
        </div>
      }

    </div>
  }

</div>
  `,
    styles: [`
    :host {
      --B:    #1a3a6b; --Bl: #2563eb; --Bx: #eff6ff;
      --G:    #15803d; --Gl: #dcfce7;
      --R:    #dc2626; --Rl: #fee2e2;
      --g50:  #f8fafc; --g100:#f1f5f9; --g200:#e2e8f0;
      --g400: #94a3b8; --g500:#64748b; --g700:#334155; --g900:#0f172a;
      --mono: 'JetBrains Mono','Fira Mono',monospace;
      --rad:  10px; --sh: 0 1px 4px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05);
    }

    .or-wrap { max-width:1100px; margin:0 auto; padding:0 16px 80px; }

    /* Topbar */
    .or-topbar { display:flex; justify-content:space-between; align-items:flex-start;
                 padding:24px 0 18px; border-bottom:1px solid var(--g200); margin-bottom:24px; }
    .or-topbar h1 { margin:0; font-size:1.5rem; font-weight:800; color:var(--g900); }
    .or-topbar p  { margin:3px 0 0; font-size:.78rem; color:var(--g500); }
    .or-btn-new   { padding:10px 20px; background:var(--B); color:#fff;
                    border:none; border-radius:8px; font-size:.88rem; font-weight:600; cursor:pointer; }

    /* Body */
    .or-body { display:grid; grid-template-columns:1fr 1fr; gap:24px; align-items:start; }

    /* Card */
    .or-card { background:#fff; border-radius:var(--rad); box-shadow:var(--sh);
               padding:20px 24px; margin-bottom:16px; }
    .or-card-title { font-size:.95rem; font-weight:700; color:var(--g900); margin-bottom:16px; }
    .or-card-title-sm { font-size:.68rem; font-weight:700; color:var(--g500);
                        letter-spacing:.8px; text-transform:uppercase; margin-bottom:14px; }

    /* Fields */
    .or-field { display:flex; flex-direction:column; gap:5px; }
    .or-field label { font-size:.74rem; font-weight:600; color:var(--g700); }
    .req { color:var(--R); }
    .or-field input, .or-field select {
      padding:10px 12px; border:1.5px solid var(--g200); border-radius:8px;
      font-size:.9rem; color:var(--g900); background:var(--g50); width:100%;
      outline:none; transition:border-color .15s;
    }
    .or-field input:focus, .or-field select:focus { border-color:var(--Bl); background:#fff; }

    /* Sched buttons */
    .or-sched-btn {
      display:flex; align-items:center; gap:12px; width:100%;
      padding:13px 16px; border:1.5px solid var(--g200); border-radius:var(--rad);
      background:#fff; cursor:pointer; text-align:left; margin-bottom:8px;
      transition:border-color .15s,background .15s;
    }
    .or-sched-btn:hover { border-color:var(--Bl); background:var(--Bx); }
    .or-sb-route { font-size:.9rem; font-weight:700; color:var(--g900); flex:1; }
    .or-sb-meta  { font-size:.75rem; color:var(--g500); }
    .or-sb-badge, .or-status-badge {
      padding:3px 10px; border-radius:20px; font-size:.72rem; font-weight:700;
      background:var(--g100); color:var(--g700);
    }
    .or-sb-badge.in-progress, .or-status-badge.in-progress {
      background:#fff7ed; color:#c2410c;
    }

    /* Active banner */
    .or-active-banner { background:var(--B); border-radius:var(--rad); padding:20px 24px;
                        margin-bottom:16px; color:#fff; }
    .or-banner-top { display:flex; justify-content:space-between; align-items:flex-start;
                     margin-bottom:16px; }
    .or-banner-route { font-size:1.1rem; font-weight:800; }
    .or-banner-meta  { font-size:.75rem; opacity:.8; margin-top:4px; }
    .or-banner-stats { display:grid; grid-template-columns:repeat(3,1fr);
                       gap:12px; margin-bottom:14px; }
    .or-stat { text-align:center; }
    .or-stat-n { display:block; font-size:1.6rem; font-weight:800; font-family:var(--mono); }
    .or-stat-l { display:block; font-size:.7rem; opacity:.75; margin-top:2px; }
    .or-change-btn { font-size:.75rem; color:rgba(255,255,255,.6); background:transparent;
                     border:1px solid rgba(255,255,255,.2); border-radius:6px;
                     padding:4px 12px; cursor:pointer; }
    .or-change-btn:hover { background:rgba(255,255,255,.1); }

    /* Progression */
    .or-progress { display:flex; align-items:flex-start; gap:0; overflow-x:auto; padding-bottom:4px; }
    .or-prog-item { display:flex; flex-direction:column; align-items:center; position:relative; }
    .or-prog-dot {
      width:30px; height:30px; border-radius:50%; border:2px solid var(--g200);
      background:#fff; color:var(--g400); font-size:.72rem; font-weight:700;
      display:grid; place-items:center; position:relative; z-index:1; flex-shrink:0;
    }
    .or-prog-dot.done    { background:var(--G); border-color:var(--G); color:#fff; }
    .or-prog-dot.current { background:var(--Bl); border-color:var(--Bl); color:#fff; }
    .or-prog-label { font-size:.7rem; color:var(--g500); margin-top:6px; text-align:center;
                     white-space:nowrap; max-width:70px; overflow:hidden; text-overflow:ellipsis; }
    .or-prog-line { position:absolute; top:15px; left:100%; width:40px; height:2px;
                    background:var(--g200); z-index:0; }
    .or-prog-line.done { background:var(--G); }

    /* Embarquement form */
    .or-segment { display:flex; align-items:flex-end; gap:10px; margin-bottom:16px; }
    .or-segment .or-field { flex:1; }
    .or-seg-arrow { font-size:1.1rem; color:var(--g400); padding-bottom:10px; }

    /* Passenger cards */
    .or-pax { border:1.5px solid var(--g200); border-radius:var(--rad);
              margin-bottom:10px; overflow:hidden; }
    .or-pax-hd { display:flex; align-items:center; gap:10px; padding:8px 14px;
                 background:var(--g50); border-bottom:1px solid var(--g200); font-size:.8rem; font-weight:600; color:var(--g700); }
    .or-pax-seat { font-family:var(--mono); font-size:.82rem; font-weight:800;
                   color:var(--B); background:var(--Bx); padding:2px 10px; border-radius:20px; }
    .or-pax-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:14px; }

    /* Free seats */
    .or-seat-picker { background:var(--g50); border-radius:8px; padding:14px; margin-bottom:14px; }
    .or-freelist { display:flex; flex-wrap:wrap; gap:8px; margin-top:6px; }
    .or-free-seat {
      padding:6px 12px; border:1.5px solid var(--g200); border-radius:7px;
      background:#fff; font-family:var(--mono); font-size:.82rem; font-weight:700;
      color:var(--g700); cursor:pointer; transition:all .12s;
    }
    .or-free-seat:hover { border-color:var(--Bl); background:var(--Bx); color:var(--B); }
    .or-free-seat.or-free-selected { border-color:var(--B); background:var(--B); color:#fff; }
    .or-empty-seats { font-size:.8rem; color:var(--g400); }

    /* Price row */
    .or-price-row { display:flex; justify-content:space-between; align-items:flex-end;
                    background:var(--g50); border-radius:8px; padding:14px 16px;
                    margin-bottom:14px; }
    .or-price-label  { font-size:.72rem; color:var(--g500); margin-bottom:4px; }
    .or-price-amount { font-size:1.2rem; font-weight:800; color:var(--g900);
                       font-family:var(--mono); }
    .or-seat-badge   { font-size:1rem; font-weight:800; color:var(--G); font-family:var(--mono); }

    /* Payment */
    .or-pm-section { margin-bottom:14px; }
    .or-pm-label   { font-size:.74rem; font-weight:600; color:var(--g700); display:block; margin-bottom:8px; }
    .or-pm-row { display:flex; gap:8px; flex-wrap:wrap; }
    .or-pm-opt { display:flex; align-items:center; gap:7px; padding:9px 14px;
                 border:2px solid var(--g200); border-radius:var(--rad);
                 cursor:pointer; font-size:.82rem; font-weight:600; color:var(--g700);
                 transition:all .12s; user-select:none; }
    .or-pm-opt input { display:none; }
    .or-pm-opt:hover { border-color:var(--Bl); background:var(--Bx); }
    .or-pm-opt.active { border-color:var(--B); background:var(--Bx); color:var(--B); }

    /* Buttons */
    .or-btn-encaisser { width:100%; padding:15px; background:#e63946; color:#fff;
                        border:none; border-radius:var(--rad); font-size:.95rem;
                        font-weight:800; cursor:pointer; margin-top:4px;
                        transition:opacity .15s; }
    .or-btn-encaisser:hover:not(:disabled) { opacity:.9; }
    .or-btn-encaisser:disabled { opacity:.35; cursor:not-allowed; }
    .or-link { background:none; border:none; color:var(--Bl); cursor:pointer;
               font-size:.88rem; text-decoration:underline; }
    .or-outline-btn { margin-left:auto; padding:9px 18px; background:#fff;
                      border:1.5px solid var(--G); color:var(--G);
                      border-radius:8px; font-weight:600; cursor:pointer; }

    /* Misc */
    .or-err { background:var(--Rl); color:var(--R); padding:10px 14px;
              border-radius:8px; font-size:.85rem; margin-bottom:10px; }
    .or-empty, .or-loading { font-size:.88rem; color:var(--g500); padding:16px 0; }
    .or-skel { height:54px; border-radius:var(--rad); margin-bottom:8px;
               background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
               background-size:200%; animation:sk 1.4s infinite; }
    @keyframes sk { 0%{background-position:200%} 100%{background-position:-200%} }

    /* Confirmation */
    .or-confirm { display:flex; align-items:center; gap:14px; padding:16px 22px;
                  background:var(--Gl); border-radius:var(--rad); margin-bottom:20px; flex-wrap:wrap; }
    .or-confirm-icon { font-size:2rem; }
    .or-confirm strong { font-size:1rem; font-weight:800; color:var(--G); }
    .or-confirm-sub { font-size:.85rem; color:var(--G); }
    .or-tickets { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
    .or-tk { background:#fff; border-radius:var(--rad); box-shadow:var(--sh); overflow:hidden; }
    .or-tk-hd { background:var(--B); color:#fff; padding:12px 16px;
                display:flex; justify-content:space-between; align-items:center; }
    .or-tk-co  { font-size:.62rem; font-weight:700; letter-spacing:1px; text-transform:uppercase; opacity:.8; }
    .or-tk-ref { font-family:var(--mono); font-size:.8rem; font-weight:700; margin-top:2px; }
    .or-tk-body { padding:14px; }
    .or-tk-route { display:flex; align-items:center; gap:8px; margin-bottom:10px;
                   padding-bottom:10px; border-bottom:1px dashed var(--g200); }
    .or-tk-route > div { flex:1; }
    .or-tk-route b { font-size:.88rem; font-weight:800; color:var(--g900); display:block; }
    .or-tk-route small { font-size:.68rem; color:var(--g500); display:block; }
    .or-tk-bar { flex:1; height:2px; background:linear-gradient(90deg,var(--B),var(--Bl)); }
    .or-tk-rows { display:flex; flex-direction:column; gap:5px; }
    .or-tk-r { display:flex; justify-content:space-between; font-size:.78rem; }
    .or-tk-r span:first-child { color:var(--g500); }
    .or-tk-r span:last-child  { font-weight:600; }
    .or-tk-ft { background:var(--B); color:#fff; padding:9px 16px;
                display:flex; justify-content:space-between; font-size:.82rem; font-weight:700; }
    .or-ok { background:var(--G); border-radius:4px; padding:1px 8px; font-size:.68rem; }

    @media(max-width:800px){ .or-body{grid-template-columns:1fr} }
    @media print {
      .or-topbar,.or-body,.or-confirm { display:none !important; }
      :host { display:block !important; padding:0 !important; }
      .or-wrap { max-width:100% !important; padding:0 !important; margin:0 !important; }
      .or-tickets {
        display:grid !important;
        grid-template-columns:1fr 1fr !important;
        gap:16px !important;
        padding:16px !important;
      }
      .or-tk {
        box-shadow:none !important;
        border:1px solid #e2e8f0 !important;
        break-inside:avoid !important;
        page-break-inside:avoid !important;
        background:#fff !important;
      }
      .or-tk-hd {
        background:none !important;
        color:#1a3a6b !important;
        padding:12px 16px 8px !important;
        border-bottom:1px dashed #e2e8f0 !important;
      }
      .or-tk-co  { color:#94a3b8 !important; }
      .or-tk-ref { color:#1a3a6b !important; font-weight:700 !important; }
      .or-tk-bar { background:#1a3a6b !important;
                   -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .or-tk-route { border-bottom:1px dashed #e2e8f0 !important; }
      .or-tk-route b     { color:#0f172a !important; }
      .or-tk-route small { color:#64748b !important; }
      .or-tk-r span:first-child { color:#64748b !important; }
      .or-tk-r span:last-child  { color:#0f172a !important; font-weight:600 !important; }
      .or-tk-ft {
        background:none !important;
        color:#0f172a !important;
        border-top:1px dashed #e2e8f0 !important;
        padding:10px 16px !important;
      }
      .or-ok { background:none !important; color:#15803d !important; font-weight:700 !important; }
    }
  `],
})
export class OnRouteComponent {
    private readonly api = inject(ReservationsApiService);
    private readonly destroyRef = inject(DestroyRef);

    readonly today = todayStr();
    readonly CASH  = PaymentMethod.CASH;
    readonly fmtTime = fmtTime; readonly fmtDate = fmtDate;
    readonly fmtAmt = fmtAmt;  readonly fmtAmtK = fmtAmtK;

    readonly PMS = [
        { v: PaymentMethod.CASH,                icon: '🪙', label: 'Espèces' },
        { v: PaymentMethod.MOBILE_MONEY_ORANGE, icon: '📱', label: 'Orange Money' },
        { v: PaymentMethod.MOBILE_MONEY_MOOV,  icon: '📱', label: 'Moov Money' },
    ];

    // ── signals
    scheds        = signal<ScheduleForSale[]>([]);
    activeSchedule= signal<ScheduleForSale | null>(null);
    seatMapData   = signal<SeatInfo[]>([]);
    selSeats      = signal<number[]>([]);
    paxForms      = signal<PassengerForm[]>([]);
    lastResult    = signal<BulkResult | null>(null);
    tickets       = signal<TicketDto[]>([]);
    loadScheds    = signal(false);
    loadMap       = signal(false);
    saving        = signal(false);
    errMsg        = signal<string | null>(null);

    sDate = todayStr();
    fromOrd = 0; toOrd = 0;
    payM: PaymentMethod = PaymentMethod.CASH;
    extRef = '';

    // Simulated stats (updated after each sale in a real app)
    boardedCount  = signal(0);
    revenueK      = signal(0);

    // ── computed
    done = computed(() => !!this.lastResult());

    activeStops = computed<RouteStop[]>(() => {
        const s = this.activeSchedule();
        return s ? sortStop(s.trip.route.stops) : [];
    });

    // Stop "actuel" = le prochain non encore franchi (simplifié : basé sur l'heure)
    currentStopOrder = computed(() => {
        const stops = this.activeStops();
        if (!stops.length) return 0;
        // MVP: retourner le 2e stop si le voyage est en cours
        if (this.activeSchedule()?.status === 'IN_PROGRESS') return stops[1]?.order ?? stops[0].order;
        return stops[0].order;
    });

    fromCityName = computed(() => this.activeStops().find(s => s.order === this.fromOrd)?.cityName ?? '—');
    toCityName   = computed(() => this.activeStops().find(s => s.order === this.toOrd)?.cityName   ?? '—');

    freeCount = computed(() => this.seatMapData().filter(s => s.status === 'free').length);

    freeSeats   = computed(() => this.seatMapData().filter(s => s.status === 'free'));
    selSeatsStr = computed(() => this.selSeats().map(n => '#' + n).join(' · '));

    ready = computed(() => {
        if (!this.activeSchedule() || !this.selSeats().length) return false;
        if (!this.fromOrd || !this.toOrd) return false;
        if (!this.paxForms().every(p => p.name.trim() && p.phone.trim())) return false;
        if (this.payM !== PaymentMethod.CASH && !this.extRef.trim()) return false;
        return true;
    });

    // ── helpers
    isSelected = (n: number) => this.selSeats().includes(n);

    // ── load schedules
    async loadSchedules() {
        this.loadScheds.set(true);
        try {
            const r = await firstValueFrom(this.api.getSchedulesForSale({ date: this.sDate }));
            this.scheds.set(r.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS'));
        } catch { this.scheds.set([]); }
        finally { this.loadScheds.set(false); }
    }

    setActive(s: ScheduleForSale) {
        this.activeSchedule.set(s);
        const stops = sortStop(s.trip.route.stops);
        // Default: from current stop to last stop
        const cur = stops.find(st => st.order === this.currentStopOrder()) ?? stops[0];
        this.fromOrd = cur?.order ?? stops[0]?.order ?? 0;
        this.toOrd   = stops.at(-1)?.order ?? 0;
        this.clearSel();
        this.fetchMap();
    }

    changeSchedule() {
        this.activeSchedule.set(null);
        this.clearSel();
    }

    // ── segment
    onSegChange() { this.clearSel(); this.fetchMap(); }

    async fetchMap() {
        const s = this.activeSchedule();
        if (!s || !this.fromOrd || !this.toOrd || this.fromOrd >= this.toOrd) return;
        this.loadMap.set(true);
        try {
            const map = await firstValueFrom(this.api.getSeatMap(s.id, this.fromOrd, this.toOrd));
            this.seatMapData.set(map.seats);
        } catch { this.seatMapData.set([]); }
        finally { this.loadMap.set(false); }
    }

    // ── seats — sélection depuis la liste des sièges libres
    toggleSeat(n: number) {
        const cur  = this.selSeats();
        const next = this.isSelected(n)
            ? cur.filter(x => x !== n)
            : [...cur, n].sort((a, b) => a - b);
        this.selSeats.set(next);
        this.paxForms.set(next.map(seat => {
            const ex = this.paxForms().find(p => p.seatNumber === seat);
            return ex ?? { seatNumber: seat, name: '', phone: '' };
        }));
    }

    // ── pax
    setPax(i: number, f: 'name' | 'phone', v: string) {
        const forms = [...this.paxForms()];
        forms[i] = { ...forms[i], [f]: v };
        this.paxForms.set(forms);
    }

    // ── confirm
    async confirm() {
        this.errMsg.set(null);
        if (!this.ready()) return;
        this.saving.set(true);
        try {
            const passengers: PassengerPayload[] = this.paxForms().map(p => ({
                seatNumber: p.seatNumber, passengerName: p.name.trim(), passengerPhone: p.phone.trim(),
            }));
            const bulk = await firstValueFrom(this.api.createBulk({
                scheduleId:    this.activeSchedule()!.id,
                fromStopOrder: this.fromOrd, toStopOrder: this.toOrd,
                saleChannel:   SaleChannel.ON_ROUTE, paymentMethod: this.payM,
                externalRef:   this.extRef || undefined, passengers,
            }));
            this.lastResult.set(bulk);
            this.boardedCount.update(n => n + bulk.created);
            this.revenueK.update(n => n + bulk.totalAmount);
            const tks = await Promise.all(
                bulk.reservations.map(r => firstValueFrom(this.api.getTicket(r.reference)))
            );
            this.tickets.set(tks);
        } catch (e: any) {
            const m = e?.error?.message;
            this.errMsg.set(Array.isArray(m) ? m.join(' · ') : m ?? 'Erreur lors de la création.');
        } finally { this.saving.set(false); }
    }

    // ── reset
    clearSel() { this.selSeats.set([]); this.paxForms.set([]); this.seatMapData.set([]); this.errMsg.set(null); }

    newSale() {
        this.lastResult.set(null); this.tickets.set([]);
        this.clearSel();
        // Recharge la map pour mettre à jour les sièges libres
        this.fetchMap();
    }

    fullReset() {
        this.lastResult.set(null); this.tickets.set([]);
        this.activeSchedule.set(null); this.scheds.set([]);
        this.clearSel();
        this.payM = PaymentMethod.CASH; this.extRef = '';
        this.loadSchedules();
    }

    constructor() {
        this.loadSchedules();
    }
}
