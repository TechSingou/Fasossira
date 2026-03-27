/**
 * StatusBadgeComponent
 *
 * Fichier : apps/web/src/app/shared/components/status-badge/status-badge.component.ts
 *
 * Remplace tous les badges avec [style.color]/[style.background] inline.
 * Utilisé dans fleet-list, routes-list, schedules-list, reservations-list.
 *
 * Usage :
 *   <fas-status-badge variant="success" label="Active" />
 *   <fas-status-badge variant="warning" label="Maintenance" />
 *   <fas-status-badge variant="danger"  label="Annulé" />
 *   <fas-status-badge variant="neutral" label="Inactif" />
 *   <fas-status-badge variant="brand"   label="Planifié" />
 *
 * Mapping fleet-list v1 :
 *   STATUS_LABELS.ACTIVE      → variant="success"
 *   STATUS_LABELS.MAINTENANCE → variant="warning"
 *   STATUS_LABELS.RETIRED     → variant="neutral"
 *
 * Mapping routes-list v1 :
 *   route.isActive = true  → variant="success" label="Active"
 *   route.isActive = false → variant="neutral" label="Inactive"
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'brand';

@Component({
  selector: 'fas-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="badgeClass()">
      {{ label() }}
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }

    .badge {
      display: inline-flex;
      align-items: center;
      font-size: .67rem;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: var(--radius-pill);
      white-space: nowrap;
      letter-spacing: .2px;
      line-height: 1;
    }

    /* ── Variantes — toutes via tokens, zéro couleur inline ── */
    .badge--success {
      background: var(--success-bg);
      color: var(--success);
    }
    .badge--warning {
      background: var(--warning-bg);
      color: var(--warning);
    }
    .badge--danger {
      background: var(--danger-bg);
      color: var(--danger);
    }
    .badge--neutral {
      background: var(--gray-100);
      color: var(--gray-600);
    }
    .badge--brand {
      background: var(--brand-lighter);
      color: var(--brand);
    }
  `],
})
export class StatusBadgeComponent {
  readonly variant = input.required<BadgeVariant>();
  readonly label   = input.required<string>();

  protected readonly badgeClass = computed(
    () => `badge--${this.variant()}`,
  );
}
