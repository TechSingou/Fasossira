/**
 * NavIconComponent
 *
 * Fichier : apps/web/src/app/shared/components/nav-icon/nav-icon.component.ts
 *
 * Composant partagé pour afficher une icône SVG Lucide.
 * Remplace TOUS les emojis dans shell.component.ts et ailleurs.
 *
 * Usage :
 *   <fas-nav-icon [path]="ICONS.dashboard" />
 *   <fas-nav-icon [path]="ICONS.bus" [size]="20" />
 *   <fas-nav-icon [path]="ICONS.check" color="var(--success)" />
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';

@Component({
  selector: 'fas-nav-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      [attr.stroke]="color()"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="ariaHidden()"
      [attr.aria-label]="label() || null"
      [innerHTML]="safeHtml()"
    ></svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    svg {
      /* Hérite la couleur du parent par défaut via currentColor */
      display: block;
    }
  `],
})
export class NavIconComponent {
  /** SVG path data — contenu interne du SVG (pas le tag <svg> lui-même) */
  readonly path = input.required<string>();

  /** Taille en pixels (width et height identiques) */
  readonly size = input<number>(16);

  /** Couleur stroke — par défaut hérite du parent via CSS currentColor */
  readonly color = input<string>('currentColor');

  /** Accessible label (optionnel — si absent, aria-hidden="true") */
  readonly label = input<string>('');

  readonly ariaHidden = computed(() => this.label() ? null : 'true');

  private readonly sanitizer = inject(DomSanitizer);

  /** Sanitize le SVG path pour l'injection innerHTML */
  readonly safeHtml = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.path())
  );
}
