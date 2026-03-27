/**
 * ToastComponent
 *
 * Fichier : apps/web/src/app/shared/components/toast/toast.component.ts
 *
 * Remplace les `<div class="toast toast-success">✅ message</div>` inline
 * présents dans routes-list, fleet-list, schedules-list, agencies-list.
 *
 * Usage :
 *   <fas-toast type="success" [message]="store.successMessage()" />
 *   <fas-toast type="error"   [message]="store.error()" />
 *
 * Affiche rien si message est null ou vide (pas besoin de @if côté parent).
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { NavIconComponent } from '../nav-icon/nav-icon.component';
import { ICONS } from '../../tokens/icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'fas-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavIconComponent],
  template: `
    @if (message()) {
      <div class="toast" [class]="toastClass()" role="alert" aria-live="polite">
        <fas-nav-icon [path]="iconPath()" [size]="15" color="currentColor" />
        <span>{{ message() }}</span>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 16px;
      border-radius: var(--radius-md);
      font-size: .82rem;
      font-weight: 500;
      margin-bottom: 16px;
      animation: fade-in .2s ease;
    }

    .toast--success {
      background: var(--success-bg);
      color: var(--success);
      border: 1px solid var(--success-border);
    }

    .toast--error {
      background: var(--danger-bg);
      color: var(--danger);
      border: 1px solid var(--danger-border);
    }

    .toast--warning {
      background: var(--warning-bg);
      color: var(--warning);
      border: 1px solid var(--warning-border);
    }

    .toast--info {
      background: var(--brand-lighter);
      color: var(--brand);
      border: 1px solid var(--brand-light);
    }
  `],
})
export class ToastComponent {
  readonly type    = input<ToastType>('success');
  readonly message = input<string | null>(null);

  protected readonly icons = ICONS;

  protected readonly toastClass = computed(() => `toast--${this.type()}`);

  protected readonly iconPath = computed(() => {
    switch (this.type()) {
      case 'success': return ICONS.check;
      case 'error':
      case 'warning': return ICONS.warning;
      default:        return ICONS.info;
    }
  });
}
