/**
 * KpiCardComponent — CORRIGÉ
 *
 * Fichier : apps/web/src/app/shared/components/kpi-card/kpi-card.component.ts
 *
 * Fix : CSS BEM nesting `&--blue` interdit dans styles: [...] Angular
 *       → remplacé par sélecteurs complets `.kpi-card--blue`
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { NavIconComponent } from '../nav-icon/nav-icon.component';

export type KpiAccent = 'blue' | 'green' | 'amber' | 'neutral';

@Component({
  selector: 'fas-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavIconComponent],
  template: `
    <div class="kpi-card" [class]="'kpi-card--' + accent()">
      <div class="kpi-top">
        <div class="kpi-icon-wrap" [class]="'kpi-icon-wrap--' + accent()">
          <fas-nav-icon [path]="iconPath()" [size]="16" color="currentColor" />
        </div>
        @if (delta() !== null) {
          <span class="kpi-delta"
            [class.kpi-delta--up]="delta()! >= 0"
            [class.kpi-delta--down]="delta()! < 0">
            {{ delta()! >= 0 ? '↑' : '↓' }} {{ deltaAbs() }}%
          </span>
        }
      </div>

      <div class="kpi-value">{{ value() }}</div>
      @if (unit()) {
        <div class="kpi-unit">{{ unit() }}</div>
      }
      <div class="kpi-label">{{ label() }}</div>
      @if (prevLabel()) {
        <div class="kpi-prev">{{ prevLabel() }}</div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .kpi-card {
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      position: relative;
      overflow: hidden;
      transition: box-shadow .15s, transform .15s;
    }

    /* ── Barre de couleur (::before) ── */
    /* FIX : sélecteurs complets au lieu de &--blue::before */
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .kpi-card--blue::before   { background: var(--brand); }
    .kpi-card--green::before  { background: var(--success); }
    .kpi-card--amber::before  { background: var(--warning); }
    .kpi-card--neutral::before { background: var(--gray-400); }

    .kpi-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    /* ── Top row ── */
    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    /* ── Icon wrapper ── */
    .kpi-icon-wrap {
      width: 36px; height: 36px;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
    }

    /* FIX : sélecteurs complets */
    .kpi-icon-wrap--blue    { background: var(--brand-lighter); color: var(--brand); }
    .kpi-icon-wrap--green   { background: var(--success-bg);    color: var(--success); }
    .kpi-icon-wrap--amber   { background: var(--warning-bg);    color: var(--warning); }
    .kpi-icon-wrap--neutral { background: var(--gray-100);      color: var(--gray-500); }

    /* ── Delta badge ── */
    .kpi-delta {
      font-size: .7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-pill);
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    /* FIX : sélecteurs complets */
    .kpi-delta--up   { background: var(--success-bg); color: var(--success); }
    .kpi-delta--down { background: var(--danger-bg);  color: var(--danger); }

    /* ── Values ── */
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--gray-900);
      line-height: 1.1;
      letter-spacing: -.5px;
    }

    .kpi-unit  { font-size: .72rem; color: var(--gray-400); margin-top: 2px; }
    .kpi-label { font-size: .8rem; font-weight: 600; color: var(--gray-500); margin-top: 8px; }
    .kpi-prev  { font-size: .7rem; color: var(--gray-400); margin-top: 3px; }
  `],
})
export class KpiCardComponent {
  readonly label     = input.required<string>();
  readonly value     = input.required<string | number>();
  readonly unit      = input<string>('');
  readonly iconPath  = input.required<string>();
  readonly accent    = input<KpiAccent>('blue');
  readonly delta     = input<number | null>(null);
  readonly prevLabel = input<string>('');

  protected readonly deltaAbs = computed(() =>
    Math.abs(this.delta() ?? 0).toFixed(0),
  );
}
