/**
 * EmptyStateComponent
 *
 * Fichier : apps/web/src/app/shared/components/empty-state/empty-state.component.ts
 *
 * Composant réutilisable pour tous les états vides de l'app.
 * Remplace les blocs `@empty { <div class="empty-icon">🚌</div> }` inline.
 *
 * Usage — liste vide sans filtre actif :
 *   <fas-empty-state
 *     variant="fleet"
 *     title="Aucun bus enregistré"
 *     subtitle="Ajoutez votre premier véhicule pour planifier des voyages."
 *     ctaLabel="Ajouter un bus"
 *     (ctaClick)="openCreateModal()"
 *   />
 *
 * Usage — liste vide suite à une recherche :
 *   <fas-empty-state
 *     variant="search"
 *     title="Aucun résultat"
 *     subtitle="Aucune route ne correspond à votre recherche."
 *     ctaLabel="Effacer les filtres"
 *     (ctaClick)="store.resetFilters()"
 *   />
 *
 * Variantes disponibles (illustrations SVG inline) :
 *   'fleet' | 'routes' | 'schedules' | 'reservations' | 'agencies' | 'search' | 'generic'
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';

export type EmptyStateVariant =
  | 'fleet'
  | 'routes'
  | 'schedules'
  | 'reservations'
  | 'agencies'
  | 'search'
  | 'generic';

@Component({
  selector: 'fas-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state" [class]="'empty-state--' + variant()">

      <!-- Illustration SVG inline par variante -->
      <div class="empty-illustration" aria-hidden="true">
        @switch (variant()) {
          @case ('fleet') { <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" fill="var(--brand-lighter)"/>
            <rect x="12" y="28" width="38" height="26" rx="4" fill="var(--brand-light)" stroke="var(--brand)" stroke-width="1.5"/>
            <polygon points="50,36 62,36 68,43 68,54 50,54" fill="var(--brand-light)" stroke="var(--brand)" stroke-width="1.5"/>
            <circle cx="23" cy="58" r="5" fill="var(--brand)"/>
            <circle cx="57" cy="58" r="5" fill="var(--brand)"/>
            <line x1="12" y1="46" x2="68" y2="46" stroke="var(--brand)" stroke-width="1.5" stroke-dasharray="4 2"/>
            <line x1="50" y1="36" x2="50" y2="54" stroke="var(--brand)" stroke-width="1.5"/>
            <line x1="28" y1="28" x2="28" y2="46" stroke="var(--brand)" stroke-width="1" opacity=".5"/>
          </svg> }

          @case ('routes') { <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" fill="var(--brand-lighter)"/>
            <circle cx="18" cy="52" r="7" fill="var(--brand)" opacity=".9"/>
            <circle cx="62" cy="28" r="7" fill="var(--brand)" opacity=".9"/>
            <path d="M18 52 C18 30 62 50 62 28" stroke="var(--brand)" stroke-width="2" stroke-dasharray="5 3" fill="none"/>
            <circle cx="40" cy="42" r="5" fill="var(--brand-light)" stroke="var(--brand)" stroke-width="1.5"/>
            <circle cx="18" cy="52" r="3" fill="white"/>
            <circle cx="62" cy="28" r="3" fill="white"/>
          </svg> }

          @case ('schedules') { <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" fill="var(--brand-lighter)"/>
            <rect x="16" y="18" width="48" height="44" rx="6" fill="var(--brand-light)" stroke="var(--brand)" stroke-width="1.5"/>
            <line x1="16" y1="30" x2="64" y2="30" stroke="var(--brand)" stroke-width="1.5"/>
            <line x1="28" y1="14" x2="28" y2="22" stroke="var(--brand)" stroke-width="2" stroke-linecap="round"/>
            <line x1="52" y1="14" x2="52" y2="22" stroke="var(--brand)" stroke-width="2" stroke-linecap="round"/>
            <rect x="24" y="38" width="10" height="8" rx="2" fill="var(--brand)" opacity=".6"/>
            <rect x="40" y="38" width="10" height="8" rx="2" fill="var(--brand)" opacity=".3"/>
            <rect x="24" y="52" width="10" height="6" rx="2" fill="var(--brand)" opacity=".2"/>
            <rect x="40" y="52" width="10" height="6" rx="2" fill="var(--brand)" opacity=".5"/>
          </svg> }

          @case ('reservations') { <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" fill="var(--brand-lighter)"/>
            <rect x="14" y="20" width="52" height="40" rx="5" fill="var(--brand-light)" stroke="var(--brand)" stroke-width="1.5"/>
            <path d="M14 32h52" stroke="var(--brand)" stroke-width="1.5"/>
            <path d="M26 32v28" stroke="var(--brand)" stroke-width="1" opacity=".4"/>
            <rect x="18" y="22" width="6" height="8" rx="1" fill="var(--brand)" opacity=".4"/>
            <rect x="28" y="36" width="24" height="3" rx="1.5" fill="var(--brand)" opacity=".6"/>
            <rect x="28" y="44" width="18" height="3" rx="1.5" fill="var(--brand)" opacity=".4"/>
            <rect x="28" y="52" width="12" height="3" rx="1.5" fill="var(--brand)" opacity=".3"/>
          </svg> }

          @case ('agencies') { <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" fill="var(--brand-lighter)"/>
            <rect x="20" y="28" width="40" height="32" rx="4" fill="var(--brand-light)" stroke="var(--brand)" stroke-width="1.5"/>
            <path d="M20 38h40" stroke="var(--brand)" stroke-width="1.5"/>
            <rect x="30" y="18" width="20" height="12" rx="3" fill="var(--brand)" opacity=".7"/>
            <circle cx="32" cy="50" r="4" fill="var(--brand)" opacity=".5"/>
            <circle cx="48" cy="50" r="4" fill="var(--brand)" opacity=".5"/>
            <line x1="36" y1="50" x2="44" y2="50" stroke="var(--brand)" stroke-width="1.5"/>
          </svg> }

          @case ('search') { <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" fill="var(--brand-lighter)"/>
            <circle cx="35" cy="34" r="14" fill="var(--brand-light)" stroke="var(--brand)" stroke-width="2"/>
            <line x1="46" y1="45" x2="58" y2="57" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="30" y1="30" x2="40" y2="30" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>
            <line x1="30" y1="35" x2="38" y2="35" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" opacity=".35"/>
          </svg> }

          @default { <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" fill="var(--brand-lighter)"/>
            <rect x="20" y="22" width="40" height="36" rx="6" fill="var(--brand-light)" stroke="var(--brand)" stroke-width="1.5"/>
            <line x1="28" y1="34" x2="52" y2="34" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="28" y1="42" x2="46" y2="42" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>
            <line x1="28" y1="50" x2="38" y2="50" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" opacity=".4"/>
          </svg> }
        }
      </div>

      <!-- Texte -->
      <h3 class="empty-title">{{ title() }}</h3>
      @if (subtitle()) {
        <p class="empty-subtitle">{{ subtitle() }}</p>
      }

      <!-- CTA optionnel -->
      @if (ctaLabel()) {
        <button
          class="empty-cta"
          [class.empty-cta--outline]="ctaVariant() === 'outline'"
          (click)="ctaClick.emit()"
        >
          {{ ctaLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .empty-state {
      grid-column: 1 / -1;  /* span toutes les colonnes dans un grid parent */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 56px 24px;
      text-align: center;
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      animation: fade-in .2s ease;
    }

    .empty-illustration {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--gray-800);
      margin-bottom: 8px;
      letter-spacing: -.2px;
    }

    .empty-subtitle {
      font-size: .82rem;
      color: var(--gray-500);
      margin-bottom: 24px;
      max-width: 300px;
      line-height: 1.6;
    }

    .empty-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      background: var(--brand);
      color: var(--white);
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font);
      font-size: .82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background .12s;

      &:hover { background: var(--brand-dark); }

      &.empty-cta--outline {
        background: var(--white);
        color: var(--gray-600);
        border: 1px solid var(--gray-200);

        &:hover {
          background: var(--gray-50);
          border-color: var(--gray-300);
        }
      }
    }
  `],
})
export class EmptyStateComponent {
  readonly variant  = input<EmptyStateVariant>('generic');
  readonly title    = input.required<string>();
  readonly subtitle = input<string>('');
  readonly ctaLabel = input<string>('');

  /** 'primary' (default) = bouton plein bleu | 'outline' = bordure grise */
  readonly ctaVariant = input<'primary' | 'outline'>('primary');

  readonly ctaClick = output<void>();
}
