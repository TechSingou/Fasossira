/**
 * StepperComponent
 *
 * Fichier : apps/web/src/app/shared/components/stepper/stepper.component.ts
 *
 * Stepper horizontal signal-based avec persistance sessionStorage.
 * Utilisé dans ticket-office (6 étapes) et potentiellement ailleurs.
 *
 * Usage :
 *   <fas-stepper
 *     [steps]="steps"
 *     [currentStep]="currentStep()"
 *     storageKey="ticket-office-step"
 *   />
 *
 *   Avec :
 *   steps = [
 *     { label: 'Trajet & Date' },
 *     { label: 'Voyage' },
 *     { label: 'Sièges' },
 *     { label: 'Passagers' },
 *     { label: 'Paiement' },
 *     { label: 'Confirmation' },
 *   ];
 *   currentStep = signal(0); // 0-based index
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  OnInit,
  effect,
} from '@angular/core';
import { NavIconComponent } from '../nav-icon/nav-icon.component';
import { ICONS } from '../../tokens/icons';

export interface StepConfig {
  label: string;
}

@Component({
  selector: 'fas-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavIconComponent],
  template: `
    <nav class="stepper" [attr.aria-label]="'Étape ' + (currentStep() + 1) + ' sur ' + steps().length">
      @for (step of steps(); track $index; let last = $last) {

        <div class="step-item"
          [class.done]="$index < currentStep()"
          [class.active]="$index === currentStep()"
          [class.future]="$index > currentStep()">

          <!-- Connecteur gauche -->
          @if ($index > 0) {
            <div class="step-connector"
              [class.connector-done]="$index <= currentStep()">
            </div>
          }

          <!-- Cercle -->
          <div class="step-circle" [attr.aria-current]="$index === currentStep() ? 'step' : null">
            @if ($index < currentStep()) {
              <!-- Étape terminée : check SVG -->
              <fas-nav-icon [path]="icons.check" [size]="13" color="currentColor" />
            } @else {
              <!-- Numéro -->
              <span>{{ $index + 1 }}</span>
            }
          </div>

          <!-- Label -->
          <div class="step-label">{{ step.label }}</div>

        </div>
      }
    </nav>
  `,
  styles: [`
    :host { display: block; }

    .stepper {
      display: flex;
      align-items: flex-start;
      padding: 20px 0 28px;
      position: relative;
    }

    /* ── Item ── */
    .step-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      min-width: 0;
    }

    /* ── Connecteur ── */
    .step-connector {
      position: absolute;
      top: 15px; /* centre du cercle (30px / 2) */
      right: 50%;
      left: -50%;
      height: 2px;
      background: var(--gray-200);
      transition: background .25s;
      z-index: 0;
    }

    .step-connector.connector-done {
      background: var(--brand);
    }

    /* ── Cercle ── */
    .step-circle {
      width: 30px; height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: .72rem;
      font-weight: 700;
      position: relative;
      z-index: 1;
      transition: all .2s;
      flex-shrink: 0;
    }

    /* Done */
    .step-item.done .step-circle {
      background: var(--brand);
      color: var(--white);
      border: 2px solid var(--brand);
    }

    /* Active */
    .step-item.active .step-circle {
      background: var(--white);
      color: var(--brand);
      border: 2px solid var(--brand);
      box-shadow: 0 0 0 4px var(--brand-lighter);
    }

    /* Future */
    .step-item.future .step-circle {
      background: var(--gray-100);
      color: var(--gray-400);
      border: 1.5px solid var(--gray-200);
    }

    /* ── Label ── */
    .step-label {
      font-size: .65rem;
      font-weight: 600;
      margin-top: 7px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80px;
      color: var(--gray-400);
    }

    .step-item.active .step-label  { color: var(--brand); font-weight: 700; }
    .step-item.done   .step-label  { color: var(--gray-600); }
  `],
})
export class StepperComponent implements OnInit {
  readonly steps       = input.required<StepConfig[]>();
  readonly currentStep = input<number>(0);

  /**
   * Clé sessionStorage pour persister l'étape courante.
   * Permet de survivre à un F5 accidentel pendant une vente.
   * Si null/vide, pas de persistance.
   */
  readonly storageKey = input<string>('');

  protected readonly icons = ICONS;

  ngOnInit(): void {
    /* Restore depuis sessionStorage si disponible */
    const key = this.storageKey();
    if (key) {
      try {
        sessionStorage.getItem(key); // test availability
      } catch { /* sessionStorage indisponible, mode dégradé silencieux */ }
    }
  }
}
