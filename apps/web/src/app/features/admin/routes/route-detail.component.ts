import {
  Component, ChangeDetectionStrategy, inject, OnInit, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoutesStore } from './routes.store';
import { RouteStop, SegmentPricePayload } from './services/routes.service';

const SKELETON_STOPS = Array(3).fill(0);
const SKELETON_PRICES = Array(4).fill(0);

interface ConfirmDialog {
  title: string; message: string; confirmLabel: string; onConfirm: () => void;
}

@Component({
  selector: 'fas-route-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-wrap">

      <div class="page-header anim-fade-in">
        <div class="header-left">
          <a routerLink="/admin/routes" class="back-btn">← Routes</a>
          @if (store.selectedRoute()) {
            <div>
              <h1 class="page-title">{{ store.selectedRoute()!.name }}</h1>
              <p class="page-subtitle">{{ store.selectedRoute()!.description }}</p>
            </div>
          }
        </div>
      </div>

      @if (store.error()) {
        <div class="alert-error">⚠️ {{ store.error() }}</div>
      }
      @if (store.successMessage()) {
        <div class="alert-success">✅ {{ store.successMessage() }}</div>
      }

      <!-- ─── Skeleton ─── -->
      @if (store.loading()) {
        <div class="detail-grid">
          <div class="card anim-row">
            <div class="card-header">
              <div class="sk sk-title-sm"></div>
              <div class="sk sk-btn-sm"></div>
            </div>
            <div class="card-body">
              @for (i of skeletonStops; track $index) {
                <div class="sk-stop-row" [style.animation-delay]="$index * 50 + 'ms'">
                  <div class="sk sk-circle"></div>
                  <div class="sk sk-stop-input"></div>
                  <div class="sk sk-stop-num"></div>
                </div>
              }
              <div class="sk sk-full-btn"></div>
            </div>
          </div>
          <div class="card anim-row" style="animation-delay:.06s">
            <div class="card-header">
              <div class="sk sk-title-sm"></div>
              <div class="sk sk-badge-sm"></div>
            </div>
            <div class="card-body">
              @for (i of skeletonPrices; track $index) {
                <div class="sk-price-row" [style.animation-delay]="$index * 40 + 'ms'">
                  <div class="sk sk-seg-label"></div>
                  <div class="sk sk-price-input"></div>
                </div>
              }
            </div>
          </div>
        </div>

      } @else if (store.selectedRoute()) {
        <div class="detail-grid">

          <!-- ─── Arrêts ─── -->
          <div class="card anim-row">
            <div class="card-header">
              <div class="card-title">Arrêts de la route</div>
              <button class="btn btn-sm btn-ghost" (click)="addStop()">+ Ajouter</button>
            </div>
            <div class="card-body">

              @for (stop of editableStops(); track stop.order; let i = $index) {
                <div class="stop-edit-row anim-row"
                  [style.animation-delay]="i * 40 + 'ms'">
                  <div class="stop-order-badge">{{ stop.order }}</div>
                  <div class="stop-inputs">
                    <input class="form-control fc-sm"
                      [value]="stop.cityName"
                      (input)="updateStopField(i, 'cityName', $any($event.target).value)"
                      placeholder="Ville" />
                    <input class="form-control fc-sm fc-num" type="number"
                      [value]="stop.distanceFromStart"
                      (input)="updateStopField(i, 'distanceFromStart', +$any($event.target).value)"
                      placeholder="km" />
                    <span class="km-label">km</span>
                  </div>
                  <button class="btn-delete" (click)="removeStop(i)"
                    [disabled]="editableStops().length <= 2"
                    title="Supprimer cet arrêt">✕</button>
                </div>
              }

              @if (editableStops().length >= 2) {
                <div class="stops-preview anim-fade-in">
                  @for (s of editableStops(); track s.order; let last = $last) {
                    <span class="preview-city">{{ s.cityName || '?' }}</span>
                    @if (!last) { <span class="preview-arrow">→</span> }
                  }
                </div>
              }

              <button class="btn btn-full"
                [class.btn-primary]="!stopsDirty()"
                [class.btn-dirty]="stopsDirty()"
                (click)="requestSaveStops()"
                [disabled]="store.saving() || editableStops().length < 2">
                @if (store.saving()) {
                  Sauvegarde…
                } @else if (stopsDirty()) {
                  ● Sauvegarder les arrêts
                } @else {
                  💾 Arrêts sauvegardés
                }
              </button>
            </div>
          </div>

          <!-- ─── Prix ─── -->
          <div class="card anim-row" style="animation-delay:.06s">
            <div class="card-header">
              <div class="card-title">Grille des prix (FCFA)</div>
              <span class="segment-total">
                {{ store.possibleSegments().length }} segments
              </span>
            </div>
            <div class="card-body">
              @if (store.possibleSegments().length === 0) {
                <div class="empty-prices">
                  Sauvegardez d'abord les arrêts pour configurer les prix.
                </div>
              } @else {
                <div class="prices-grid">
                  @for (seg of store.possibleSegments(); track seg.label; let i = $index) {
                    <div class="price-row anim-row"
                      [style.animation-delay]="i * 30 + 'ms'">
                      <div class="seg-label">
                        <span class="seg-from">{{ seg.from.cityName }}</span>
                        <span class="seg-arrow">→</span>
                        <span class="seg-to">{{ seg.to.cityName }}</span>
                      </div>
                      <div class="price-input-wrap">
                        <input type="number" class="form-control fc-price"
                          [ngModel]="getPrice(seg.from.order, seg.to.order)"
                          (ngModelChange)="setPrice(seg.from.order, seg.to.order, $event)"
                          placeholder="0" min="0" />
                        <span class="currency">FCFA</span>
                      </div>
                    </div>
                  }
                </div>

                <button class="btn btn-full"
                  [class.btn-primary]="!pricesDirty()"
                  [class.btn-dirty]="pricesDirty()"
                  (click)="requestSavePrices()"
                  [disabled]="store.saving()"
                  style="margin-top:16px">
                  @if (store.saving()) {
                    Sauvegarde…
                  } @else if (pricesDirty()) {
                    ● Sauvegarder les prix
                  } @else {
                    💾 Prix sauvegardés
                  }
                </button>
              }
            </div>
          </div>

        </div>
      }

      <!-- ─── Modal confirmation ─── -->
      @if (confirmDialog()) {
        <div class="modal-backdrop" (click)="cancelConfirm()">
          <div class="modal modal-anim" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ confirmDialog()!.title }}</h2>
              <button class="modal-close" (click)="cancelConfirm()">✕</button>
            </div>
            <div class="modal-body">
              <p class="confirm-message" style="white-space:pre-line">
                {{ confirmDialog()!.message }}
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" (click)="cancelConfirm()">Annuler</button>
              <button class="btn btn-primary" (click)="executeConfirm()"
                [disabled]="store.saving()">
                @if (store.saving()) { En cours… }
                @else { {{ confirmDialog()!.confirmLabel }} }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ─── Keyframes ─────────────────────────────────────────── */
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes rowIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(16px) scale(.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes pulse-dirty {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,.45); }
      50%       { box-shadow: 0 0 0 7px rgba(245,158,11,0); }
    }

    /* ─── Classes d'animation ───────────────────────────────── */
    .anim-fade-in { animation: fadeSlideUp 200ms ease both; }
    .anim-row     { animation: rowIn 180ms ease both; opacity: 0; }
    .modal-backdrop { animation: fadeIn 150ms ease both; }
    .modal-anim   { animation: modalIn 200ms cubic-bezier(.16,1,.3,1) both; }
    .alert-error,
    .alert-success { animation: fadeSlideUp 200ms ease both; }

    /* ─── Skeleton ───────────────────────────────────────────── */
    .sk {
      border-radius: 6px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e8edf4 50%, #f1f5f9 75%);
      background-size: 600px 100%;
      animation: shimmer 1.4s infinite linear;
    }
    .sk-title-sm    { width: 140px; height: 16px; }
    .sk-btn-sm      { width: 80px;  height: 30px; border-radius: 8px; }
    .sk-badge-sm    { width: 70px;  height: 18px; border-radius: 20px; }
    .sk-circle      { width: 28px;  height: 28px; border-radius: 50%; flex-shrink: 0; }
    .sk-stop-input  { flex: 1;      height: 34px; border-radius: 8px; }
    .sk-stop-num    { width: 60px;  height: 34px; border-radius: 8px; }
    .sk-full-btn    { width: 100%;  height: 38px; border-radius: 10px; }
    .sk-seg-label   { flex: 1;      height: 14px; }
    .sk-price-input { width: 100px; height: 34px; border-radius: 8px; }
    .sk-stop-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px; background: #f8fafc; border-radius: 10px;
      animation: rowIn 180ms ease both; opacity: 0;
    }
    .sk-price-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 8px 10px; background: #f8fafc; border-radius: 8px;
      animation: rowIn 180ms ease both; opacity: 0;
    }

    /* ─── Layout ─────────────────────────────────────────────── */
    .page-wrap { max-width: 1100px; }
    .page-header { margin-bottom: 28px; }
    .header-left { display: flex; flex-direction: column; gap: 8px; }
    .back-btn {
      font-size: .82rem; color: #0B3D91; font-weight: 600;
      text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
      transition: opacity .15s;
      &:hover { opacity: .75; }
    }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .page-subtitle { font-size: .875rem; color: #64748b; margin-top: 4px; }

    .alert-error {
      padding: 12px 16px; border-radius: 10px;
      background: #fee2e2; color: #b91c1c;
      margin-bottom: 16px; font-size: .875rem;
    }
    .alert-success {
      padding: 12px 16px; border-radius: 10px;
      background: #dcfce7; color: #15803d;
      margin-bottom: 16px; font-size: .875rem;
    }

    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
    }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }

    .card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 4px 20px rgba(0,0,0,.07);
    }
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 22px; border-bottom: 1px solid #f1f5f9;
    }
    .card-title { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .card-body {
      padding: 20px 22px; display: flex; flex-direction: column; gap: 12px;
    }
    .segment-total { font-size: .75rem; color: #94a3b8; font-weight: 500; }

    /* ─── Arrêts ─────────────────────────────────────────────── */
    .stop-edit-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px; background: #f8fafc; border-radius: 10px;
      transition: box-shadow .15s;
      &:hover { box-shadow: 0 0 0 1.5px #0B3D91; }
    }
    .stop-order-badge {
      width: 28px; height: 28px; border-radius: 50%;
      background: #0B3D91; color: #fff;
      display: grid; place-items: center;
      font-size: .75rem; font-weight: 700; flex-shrink: 0;
    }
    .stop-inputs { display: flex; align-items: center; gap: 8px; flex: 1; }
    .km-label { font-size: .72rem; color: #94a3b8; white-space: nowrap; }
    .btn-delete {
      background: none; border: 1.5px solid #e2e8f0; border-radius: 6px;
      color: #94a3b8; cursor: pointer; width: 28px; height: 28px;
      font-size: 12px; display: grid; place-items: center;
      transition: all .15s; flex-shrink: 0;
      &:hover:not(:disabled) { border-color: #dc2626; color: #dc2626; background: #fee2e2; }
      &:disabled { opacity: .3; cursor: not-allowed; }
    }

    .stops-preview {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      padding: 10px 14px; background: #eff4ff; border-radius: 10px; font-size: .82rem;
    }
    .preview-city { font-weight: 700; color: #0B3D91; }
    .preview-arrow { color: #94a3b8; }

    /* ─── Prix ───────────────────────────────────────────────── */
    .prices-grid { display: flex; flex-direction: column; gap: 8px; }
    .price-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 8px 10px; background: #f8fafc; border-radius: 8px;
      transition: box-shadow .15s;
      &:hover { box-shadow: 0 0 0 1.5px #e2e8f0; }
    }
    .seg-label { display: flex; align-items: center; gap: 6px; font-size: .82rem; flex: 1; }
    .seg-from, .seg-to { font-weight: 600; color: #1e293b; }
    .seg-arrow { color: #94a3b8; font-size: .75rem; }
    .price-input-wrap { display: flex; align-items: center; gap: 6px; }
    .currency { font-size: .72rem; color: #64748b; font-weight: 600; white-space: nowrap; }
    .empty-prices {
      text-align: center; padding: 32px 20px;
      color: #94a3b8; font-size: .875rem;
    }

    /* ─── Formulaire ─────────────────────────────────────────── */
    .form-control {
      padding: 8px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-family: 'Sora', sans-serif; font-size: .875rem; outline: none;
      transition: border-color .15s, box-shadow .15s;
      &:focus { border-color: #0B3D91; box-shadow: 0 0 0 3px rgba(11,61,145,.08); }
    }
    .fc-sm    { flex: 1; }
    .fc-num   { width: 70px; flex: none; }
    .fc-price { width: 90px; text-align: right; }

    /* ─── Boutons ────────────────────────────────────────────── */
    .btn {
      padding: 9px 18px; border-radius: 10px; font-weight: 600;
      font-size: .875rem; cursor: pointer; font-family: 'Sora', sans-serif;
      border: none; transition: all .2s;
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    }
    .btn-primary {
      background: #0B3D91; color: #fff;
      &:hover:not(:disabled) { background: #072d6e; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }
    .btn-ghost {
      background: #f1f5f9; color: #475569;
      &:hover { background: #e2e8f0; }
    }
    .btn-dirty {
      background: #f59e0b; color: #fff;
      animation: pulse-dirty 1.8s ease infinite;
      &:hover:not(:disabled) { background: #d97706; }
      &:disabled { opacity: .5; cursor: not-allowed; animation: none; }
    }
    .btn-sm   { padding: 7px 14px; font-size: .8rem; }
    .btn-full { width: 100%; }

    /* ─── Modal ──────────────────────────────────────────────── */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.4);
      display: grid; place-items: center; z-index: 1000; padding: 20px;
    }
    .modal {
      background: #fff; border-radius: 16px; width: 100%;
      max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.2);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
    }
    .modal-header h2 { font-size: 1.05rem; font-weight: 700; color: #0f172a; }
    .modal-close {
      background: none; border: none; cursor: pointer;
      font-size: 18px; color: #94a3b8;
      transition: color .12s; &:hover { color: #475569; }
    }
    .modal-body { padding: 24px; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px; border-top: 1px solid #f1f5f9;
    }
    .confirm-message { font-size: .9rem; color: #334155; line-height: 1.6; margin: 0; }
  `],
})
export class RouteDetailComponent implements OnInit {
  protected readonly store = inject(RoutesStore);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly skeletonStops = SKELETON_STOPS;
  protected readonly skeletonPrices = SKELETON_PRICES;

  protected editableStops = signal<RouteStop[]>([]);
  protected editablePrices = signal<Map<string, number>>(new Map());
  protected confirmDialog = signal<ConfirmDialog | null>(null);

  // ─── Snapshots pour dirty tracking ──────────────────────────
  private initialStops = signal<RouteStop[]>([]);
  private initialPrices = signal<Map<string, number>>(new Map());

  protected stopsDirty = computed(() => {
    const current = this.editableStops();
    const initial = this.initialStops();
    if (current.length !== initial.length) return true;
    return current.some((s, i) =>
      s.cityName !== initial[i]?.cityName ||
      s.distanceFromStart !== initial[i]?.distanceFromStart
    );
  });

  protected pricesDirty = computed(() => {
    const current = this.editablePrices();
    const initial = this.initialPrices();
    if (current.size !== initial.size) return true;
    for (const [key, val] of current) {
      if (initial.get(key) !== val) return true;
    }
    return false;
  });

  // ─── Init ────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id')!;
    this.store.selectRoute(id).then(() => this.initEditableData());
  }

  private initEditableData(): void {
    const route = this.store.selectedRoute();
    if (!route) return;

    const stops = [...(route.stops ?? [])].sort((a, b) => a.order - b.order);
    this.editableStops.set(stops.map((s) => ({ ...s })));
    this.initialStops.set(stops.map((s) => ({ ...s }))); // snapshot

    const priceMap = new Map<string, number>();
    (route.segmentPrices ?? []).forEach((p) => {
      priceMap.set(`${p.fromStopOrder}-${p.toStopOrder}`, Number(p.price));
    });
    this.editablePrices.set(priceMap);
    this.initialPrices.set(new Map(priceMap)); // snapshot
  }

  // ─── Arrêts ──────────────────────────────────────────────────

  protected addStop(): void {
    const stops = this.editableStops();
    const nextOrder = stops.length > 0
      ? Math.max(...stops.map((s) => s.order)) + 1 : 1;
    this.editableStops.set([
      ...stops,
      { cityName: '', order: nextOrder, distanceFromStart: 0 },
    ]);
  }

  protected removeStop(index: number): void {
    const stops = [...this.editableStops()];
    stops.splice(index, 1);
    stops.forEach((s, i) => (s.order = i + 1));
    this.editableStops.set(stops);
  }

  protected updateStopField(
    index: number, field: keyof RouteStop, value: string | number,
  ): void {
    const stops = this.editableStops().map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    this.editableStops.set(stops);
  }

  protected requestSaveStops(): void {
    const stops = this.editableStops().filter((s) => s.cityName.trim());
    if (stops.length < 2) return;
    this.confirmDialog.set({
      title: '💾 Sauvegarder les arrêts',
      message: `Confirmer la mise à jour des ${stops.length} arrêts ?\nLes prix des segments supprimés seront effacés, les autres seront conservés.`,
      confirmLabel: 'Sauvegarder',
      onConfirm: async () => {
        const route = this.store.selectedRoute();
        if (!route) return;
        await this.store.saveStops(route.id, stops);
        this.confirmDialog.set(null);
        this.initEditableData(); // reset snapshot → bouton repasse en bleu
      },
    });
  }

  // ─── Prix ────────────────────────────────────────────────────

  protected getPrice(fromOrder: number, toOrder: number): number {
    return this.editablePrices().get(`${fromOrder}-${toOrder}`) ?? 0;
  }

  protected setPrice(fromOrder: number, toOrder: number, value: number): void {
    const map = new Map(this.editablePrices());
    map.set(`${fromOrder}-${toOrder}`, Number(value) || 0);
    this.editablePrices.set(map);
  }

  protected requestSavePrices(): void {
    const route = this.store.selectedRoute();
    if (!route) return;
    const prices: SegmentPricePayload[] = [];
    this.editablePrices().forEach((price, key) => {
      const [from, to] = key.split('-').map(Number);
      if (price > 0 && from < to && !isNaN(from) && !isNaN(to)) {
        prices.push({ fromStopOrder: from, toStopOrder: to, price: Number(price) });
      }
    });
    if (prices.length === 0) {
      alert('Aucun prix à sauvegarder. Saisissez au moins un prix supérieur à 0.');
      return;
    }
    this.confirmDialog.set({
      title: '💰 Sauvegarder les prix',
      message: `Confirmer la mise à jour de ${prices.length} prix de segments ?`,
      confirmLabel: 'Sauvegarder',
      onConfirm: async () => {
        await this.store.saveSegmentPrices(route.id, prices);
        this.confirmDialog.set(null);
        this.initEditableData(); // reset snapshot → bouton repasse en bleu
      },
    });
  }

  // ─── Confirmation ────────────────────────────────────────────

  protected executeConfirm(): void { this.confirmDialog()?.onConfirm(); }
  protected cancelConfirm(): void { this.confirmDialog.set(null); }
}