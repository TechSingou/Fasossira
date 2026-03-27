/**
 * PlanLimitBannerComponent v2
 *
 * Fichier : apps/web/src/app/shared/components/plan-limit-banner/plan-limit-banner.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] inline → plan-limit-banner.component.scss
 *   ✅ Emojis 🚫 ⚠️ dans banner → NavIconComponent
 *   ✅ Emojis 🚌 🏢 👤 dans limit-gauge-only → NavIconComponent
 *   ✅ Couleurs hardcodées (background:#d1fae5...) → tokens globaux
 *   ✅ Logique métier : inchangée
 */
import {
  Component, ChangeDetectionStrategy, inject, Input, computed,
} from '@angular/core';
import { QuotasStore } from '../../../core/stores/quotas.store';
import { QuotaInfo, isUnlimited } from '../../../core/services/quotas.service';
import { NavIconComponent } from '../nav-icon/nav-icon.component';
import { ICONS } from '../../tokens/icons';

type Resource = 'buses' | 'agencies' | 'users';

const RESOURCE_CONFIG: Record<Resource, { iconPath: string; label: string; singulier: string }> = {
  buses:    { iconPath: ICONS.bus,     label: 'Bus',           singulier: 'bus'          },
  agencies: { iconPath: ICONS.building, label: 'Agences',      singulier: 'agence'       },
  users:    { iconPath: ICONS.users,   label: 'Utilisateurs',  singulier: 'utilisateur'  },
};

@Component({
  selector: 'fas-plan-limit-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavIconComponent],
  template: `
    @if (quota()) {
      @let q = quota()!;
      @let cfg = config();
      @let unlim = unlimited();
      @let pct = percentage();
      @let isLimit = q.limitReached;
      @let isWarn = !isLimit && !unlim && pct >= 80;

      @if (isLimit || isWarn) {
        <div class="limit-banner"
          [class.limit-banner--error]="isLimit"
          [class.limit-banner--warn]="isWarn">

          <div class="limit-banner__icon-wrap"
            [class.icon-wrap--error]="isLimit"
            [class.icon-wrap--warn]="isWarn">
            <!-- ✅ 🚫 ⚠️ → NavIconComponent -->
            <fas-nav-icon
              [path]="isLimit ? icons.warning : icons.activity"
              [size]="15"
              color="currentColor"
            />
          </div>

          <div class="limit-banner__content">
            <div class="limit-banner__title">
              @if (isLimit) { Limite {{ cfg.label }} atteinte }
              @else         { Limite {{ cfg.label }} bientôt atteinte }
            </div>
            <div class="limit-banner__desc">
              @if (isLimit) {
                Votre plan <strong>{{ q.planName }}</strong> autorise
                <strong>{{ maxLabel() }}</strong> {{ cfg.singulier }}(s).
                Vous avez atteint la limite — impossible d'en ajouter un(e) autre.
              } @else {
                {{ q.current }} / {{ maxLabel() }} {{ cfg.label.toLowerCase() }} utilisé(e)s.
                Il vous reste <strong>{{ q.remaining }}</strong> emplacement(s).
              }
            </div>

            @if (!unlim) {
              <div class="limit-gauge">
                <div class="limit-gauge__track">
                  <div class="limit-gauge__fill"
                    [style.width.%]="pct"
                    [class.limit-gauge__fill--error]="isLimit"
                    [class.limit-gauge__fill--warn]="isWarn"
                    [class.limit-gauge__fill--ok]="!isLimit && !isWarn">
                  </div>
                </div>
                <span class="limit-gauge__label">{{ q.current }} / {{ maxLabel() }}</span>
              </div>
            }

            @if (isLimit) {
              <div class="limit-banner__upgrade">
                Contactez votre administrateur pour passer à un plan supérieur.
              </div>
            }
          </div>
        </div>

      } @else if (!compact && !unlim) {
        <!-- Mode neutre : jauge seule avec icône SVG -->
        <div class="limit-gauge-only">
          <div class="limit-gauge-only__header">
            <!-- ✅ 🚌 🏢 👤 → NavIconComponent -->
            <fas-nav-icon [path]="cfg.iconPath" [size]="13" color="var(--gray-500)" />
            <span class="limit-gauge-only__label">
              {{ cfg.label }} : {{ q.current }} / {{ maxLabel() }}
            </span>
          </div>
          <div class="limit-gauge">
            <div class="limit-gauge__track">
              <div class="limit-gauge__fill limit-gauge__fill--ok" [style.width.%]="pct"></div>
            </div>
          </div>
        </div>
      }
    }
  `,
  styleUrl: './plan-limit-banner.component.scss',
})
export class PlanLimitBannerComponent {
  @Input() resource!: Resource;
  @Input() compact = false;

  private readonly quotasStore = inject(QuotasStore);
  protected readonly icons = ICONS;

  protected readonly config = computed(() => RESOURCE_CONFIG[this.resource]);

  protected readonly quota = computed((): QuotaInfo | null => {
    const q = this.quotasStore.quotas();
    if (!q) return null;
    return q[this.resource];
  });

  protected readonly unlimited = computed((): boolean => {
    const q = this.quota();
    return q ? isUnlimited(q) : false;
  });

  protected readonly maxLabel = computed((): string => {
    const q = this.quota();
    if (!q) return '0';
    return isUnlimited(q) ? '∞' : String(q.max);
  });

  protected readonly percentage = computed((): number => {
    const q = this.quota();
    if (!q || isUnlimited(q) || q.max === 0) return 0;
    return Math.min(100, Math.round((q.current / q.max) * 100));
  });
}
