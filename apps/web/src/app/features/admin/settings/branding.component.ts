/**
 * BrandingComponent v2
 *
 * Fichier : apps/web/src/app/features/admin/settings/branding.component.ts
 *
 * Migrations vs v1 :
 *   ✅ styles: [...] inline → branding.component.scss
 *   ✅ Règle "1 couleur signature" appliquée :
 *      - Champ "couleur secondaire" supprimé du formulaire
 *      - Palettes ne proposent qu'une couleur principale (règle FlixBus)
 *      - secondaryColor calculé automatiquement depuis primaryColor (teinte plus claire)
 *      - Preview ticket et mini-shell n'utilisent plus que la couleur signature
 *   ✅ Emojis 🏢 🎨 🖼 🔄 🗑 ⚠️ ✅ 📞 → NavIconComponent
 *   ✅ style inline sur ticket-val → classe CSS
 *   ✅ Variable --g* → var(--gray-*)
 *   ✅ Couleurs hardcodées #0B3D91 dans styles → var(--brand) ou héritage de [style]
 *   ✅ Logique métier : inchangée (BrandingStore, AuthStore)
 *
 * Palettes (règle couleur unique) :
 *   Chaque palette = 1 couleur signature identitaire.
 *   Fond toujours blanc. Gris/noir pour le texte.
 *   Inspiré de l'identité visuelle des transporteurs professionnels (FlixBus, BlaBlaCar, Ouibus).
 */
import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrandingStore } from './branding.store';
import { AuthStore } from '../../../core/auth/auth.store';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ICONS } from '../../../shared/tokens/icons';

/**
 * Palette : 1 couleur signature.
 * description = comment l'utiliser / son esprit.
 */
interface Palette {
  name:        string;
  primary:     string;
  description: string;
}

/**
 * Calcule une version claire de la couleur pour les hover states,
 * en ajoutant ~30% d'opacité sur fond blanc (approximation hexadécimale).
 * Utilisé pour le preview uniquement — pas stocké.
 */
function lighten(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Mélange 20% couleur + 80% blanc
  const lr = Math.round(r * 0.2 + 255 * 0.8);
  const lg = Math.round(g * 0.2 + 255 * 0.8);
  const lb = Math.round(b * 0.2 + 255 * 0.8);
  return `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`;
}

const PALETTES: Palette[] = [
  { name: 'Bleu Mali',    primary: '#0B3D91', description: 'Bleu institutionnel profond — couleur signature Fasossira' },
  { name: 'Bleu Nuit',    primary: '#1A237E', description: 'Bleu nuit intense, sérieux et fiable' },
  { name: 'Cobalt',       primary: '#0277BD', description: 'Bleu ciel vif, dynamique et moderne' },
  { name: 'Ardoise',      primary: '#334155', description: 'Gris ardoise élégant, sobre et neutre' },
  { name: 'Graphite',     primary: '#1e293b', description: 'Noir graphite premium — maximal lisibilité' },
  { name: 'Forêt',        primary: '#1B5E20', description: 'Vert foncé naturel, fiabilité et sécurité' },
  { name: 'Teal',         primary: '#00695C', description: 'Teal profond, moderne et distinctif' },
  { name: 'Bordeaux',     primary: '#880E4F', description: 'Bordeaux raffiné, prestige et élégance' },
  { name: 'Indigo',       primary: '#3730a3', description: 'Indigo tech, confiance et innovation' },
  { name: 'Ocre Sahel',   primary: '#78350f', description: 'Brun ocre chaud, ancrage local et authenticité' },
];

@Component({
  selector: 'fas-branding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NavIconComponent, ToastComponent],
  template: `
<div class="pg">

  <!-- En-tête -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Branding &amp; Personnalisation</h1>
      <p class="page-sub">Personnalisez l'apparence de votre espace et de vos tickets</p>
    </div>
  </div>

  <!-- ✅ ToastComponent -->
  <fas-toast type="success" [message]="store.successMessage()" />
  <fas-toast type="error"   [message]="store.error()" />

  @if (store.loading()) {
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Chargement des paramètres…</span>
    </div>

  } @else if (store.error() && !store.settings()) {
    <div class="error-state">
      <fas-nav-icon [path]="icons.warning" [size]="36" color="var(--danger)" />
      <div class="error-title">Impossible de charger les paramètres</div>
      <div class="error-detail">{{ store.error() }}</div>
      <button class="btn-primary" (click)="retryLoad()">Réessayer</button>
    </div>

  } @else {
    <div class="layout">

      <!-- ════ GAUCHE : Formulaire ════ -->
      <div class="form-col">

        <!-- Identité -->
        <section class="card">
          <div class="card-head">
            <!-- ✅ 🏢 → NavIconComponent -->
            <div class="card-icon-wrap">
              <fas-nav-icon [path]="icons.building" [size]="18" color="var(--brand)" />
            </div>
            <div>
              <h2 class="card-title">Identité de la compagnie</h2>
              <p class="card-sub">Nom affiché sur les tickets et l'interface</p>
            </div>
          </div>
          <div class="fld">
            <label>Nom d'affichage <span class="req">*</span></label>
            <input type="text" [(ngModel)]="draft.companyDisplayName"
              placeholder="ex: Sotrama Bamako Express" maxlength="100" />
          </div>
          <div class="fld">
            <label>Contact support</label>
            <input type="text" [(ngModel)]="draft.supportContact"
              placeholder="+223 20 XX XX XX ou support@…" maxlength="100" />
          </div>
          <div class="fld">
            <label>Pied de page ticket</label>
            <textarea [(ngModel)]="draft.ticketFooter" rows="2"
              placeholder="ex: Votre sécurité est notre priorité" maxlength="200"></textarea>
            <span class="fhint">Affiché en bas de chaque ticket imprimé</span>
          </div>
        </section>

        <!-- Couleur signature -->
        <section class="card">
          <div class="card-head">
            <!-- ✅ 🎨 → NavIconComponent -->
            <div class="card-icon-wrap">
              <fas-nav-icon [path]="icons.activity" [size]="18" color="var(--brand)" />
            </div>
            <div>
              <h2 class="card-title">Couleur signature</h2>
              <p class="card-sub">Une seule couleur forte — fond blanc + gris pour le reste</p>
            </div>
          </div>

          <!-- Sélecteur unique -->
          <div class="color-row">
            <div class="color-input-wrap">
              <input type="color" [(ngModel)]="draft.primaryColor" class="color-picker" />
              <input type="text" [(ngModel)]="draft.primaryColor"
                class="color-hex" placeholder="#0B3D91"
                pattern="^#[0-9A-Fa-f]{6}$" maxlength="7" />
            </div>
            <div class="color-preview-strip" [style.background]="draft.primaryColor">
              <span class="color-preview-label">Couleur signature</span>
              <span class="color-preview-light" [style.background]="primaryLight()"></span>
            </div>
          </div>

          <!-- Palettes prédéfinies — 1 couleur chacune -->
          <div class="presets-label">Palettes prédéfinies</div>
          <div class="presets">
            @for (p of palettes; track p.name) {
              <button class="preset-btn" (click)="applyPalette(p)"
                [class.active]="draft.primaryColor === p.primary"
                [title]="p.description">
                <!-- Swatch couleur unique -->
                <span class="preset-swatch" [style.background]="p.primary"></span>
                <!-- Aperçu blanc + gris pour rappeler la règle -->
                <span class="preset-white"></span>
                <span class="preset-name">{{ p.name }}</span>
              </button>
            }
          </div>

          <div class="color-rule-note">
            <fas-nav-icon [path]="icons.info" [size]="13" color="var(--gray-400)" />
            <span>La couleur signature est utilisée pour les éléments clés. Le fond reste toujours blanc, le texte gris/noir.</span>
          </div>
        </section>

        <!-- Logo -->
        <section class="card">
          <div class="card-head">
            <!-- ✅ 🖼 → NavIconComponent -->
            <div class="card-icon-wrap">
              <fas-nav-icon [path]="icons.image" [size]="18" color="var(--brand)" />
            </div>
            <div>
              <h2 class="card-title">Logo de la compagnie</h2>
              <p class="card-sub">JPEG, PNG, WebP ou SVG — max 2 MB</p>
            </div>
          </div>

          <div class="logo-zone">
            @if (store.logoUrl()) {
              <div class="logo-current">
                <img [src]="apiBase + store.logoUrl()" alt="Logo actuel" class="logo-img" />
                <div class="logo-actions">
                  <label class="btn-ghost-sm" for="logo-input">
                    <!-- ✅ 🔄 → NavIconComponent -->
                    <fas-nav-icon [path]="icons.refresh" [size]="13" color="currentColor" />
                    Remplacer
                  </label>
                  <button class="btn-danger-soft" (click)="deleteLogo()"
                    [disabled]="store.saving()">
                    <!-- ✅ 🗑 → NavIconComponent -->
                    <fas-nav-icon [path]="icons.warning" [size]="13" color="currentColor" />
                    Supprimer
                  </button>
                </div>
              </div>
            } @else {
              <label class="logo-dropzone" for="logo-input"
                [class.dragging]="isDragging()"
                (dragover)="onDragOver($event)"
                (dragleave)="isDragging.set(false)"
                (drop)="onDrop($event)">
                <!-- ✅ 🖼 → NavIconComponent -->
                <fas-nav-icon [path]="icons.image" [size]="32" color="var(--gray-300)" />
                <div class="dz-text">
                  Glissez votre logo ici ou <span class="dz-link">cliquez pour parcourir</span>
                </div>
                <div class="dz-hint">PNG, JPG, SVG — max 2 MB recommandé</div>
              </label>
            }
            <input id="logo-input" type="file" accept="image/*" class="file-hidden"
              (change)="onFileSelect($event)" />
          </div>

          @if (store.uploadingLogo()) {
            <div class="upload-progress">
              <div class="progress-bar"><div class="progress-fill"></div></div>
              <span>Upload en cours…</span>
            </div>
          }
        </section>

        <!-- Actions -->
        <div class="form-actions">
          <button class="btn-ghost-md" (click)="resetDraft()" [disabled]="store.saving()">
            Annuler les modifications
          </button>
          <button class="btn-primary" (click)="save()"
            [disabled]="store.saving() || !isValid()">
            {{ store.saving() ? 'Sauvegarde…' : 'Sauvegarder les paramètres' }}
          </button>
        </div>
      </div>

      <!-- ════ DROITE : Preview live ════ -->
      <div class="preview-col">
        <div class="preview-sticky">
          <div class="preview-eyebrow">Aperçu en temps réel</div>

          <!-- Mini shell -->
          <div class="preview-card">
            <div class="preview-title">Interface application</div>
            <div class="mini-shell">
              <div class="mini-sidebar" [style.background]="draft.primaryColor">
                <div class="mini-logo-area">
                  @if (store.logoUrl()) {
                    <img [src]="apiBase + store.logoUrl()" alt="Logo" class="mini-logo-img" />
                  } @else {
                    <div class="mini-logo-ph">{{ initials() }}</div>
                  }
                  <div class="mini-company-name">{{ draft.companyDisplayName || 'Votre compagnie' }}</div>
                </div>
                <div class="mini-nav">
                  <!-- ✅ Couleur signature uniquement — pas de secondaryColor -->
                  <div class="mini-nav-item mini-nav-active" [style.background]="primaryLight()">
                    Dashboard
                  </div>
                  <div class="mini-nav-item">Flotte Bus</div>
                  <div class="mini-nav-item">Routes</div>
                  <div class="mini-nav-item">Paramètres</div>
                </div>
              </div>
              <div class="mini-content">
                <div class="mini-topbar" [style.border-color]="draft.primaryColor + '33'">
                  <div class="mini-breadcrumb">{{ draft.companyDisplayName || 'Votre compagnie' }}</div>
                  <div class="mini-badge" [style.background]="draft.primaryColor">Admin</div>
                </div>
                <div class="mini-main">
                  <div class="mini-kpi" [style.border-left-color]="draft.primaryColor">
                    <div class="mini-kpi-val">24</div>
                    <div class="mini-kpi-lbl">Bus actifs</div>
                  </div>
                  <!-- ✅ Fond blanc + gris pour le second KPI — pas de secondary -->
                  <div class="mini-kpi mini-kpi--neutral">
                    <div class="mini-kpi-val">18</div>
                    <div class="mini-kpi-lbl">Voyages</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mini ticket -->
          <div class="preview-card" style="margin-top:14px">
            <div class="preview-title">Aperçu ticket</div>
            <div class="mini-ticket">
              <div class="ticket-header" [style.background]="draft.primaryColor">
                @if (store.logoUrl()) {
                  <img [src]="apiBase + store.logoUrl()" alt="Logo" class="ticket-logo" />
                } @else {
                  <div class="ticket-logo-ph">{{ initials() }}</div>
                }
                <div class="ticket-company">{{ draft.companyDisplayName || 'Votre compagnie' }}</div>
                <!-- ✅ Badge blanc sur fond couleur signature — plus de secondaryColor -->
                <div class="ticket-badge-white">TICKET</div>
              </div>
              <div class="ticket-body">
                <div class="ticket-row">
                  <span class="ticket-lbl">De</span>
                  <span class="ticket-val">Bamako</span>
                </div>
                <div class="ticket-row">
                  <span class="ticket-lbl">À</span>
                  <span class="ticket-val">Mopti</span>
                </div>
                <div class="ticket-row">
                  <span class="ticket-lbl">Date</span>
                  <span class="ticket-val">15 Mar 2026</span>
                </div>
                <div class="ticket-row">
                  <span class="ticket-lbl">Départ</span>
                  <!-- ✅ style inline font-weight:700 → classe CSS, color via primary -->
                  <span class="ticket-val ticket-val--accent" [style.color]="draft.primaryColor">07:00</span>
                </div>
                <div class="ticket-divider"></div>
                <!-- ✅ Prix en couleur signature — plus de secondaryColor -->
                <div class="ticket-price" [style.color]="draft.primaryColor">5 000 F CFA</div>
              </div>
              @if (draft.ticketFooter) {
                <div class="ticket-footer"
                  [style.background]="draft.primaryColor + '12'"
                  [style.border-color]="draft.primaryColor + '33'">
                  {{ draft.ticketFooter }}
                </div>
              }
              @if (draft.supportContact) {
                <div class="ticket-contact">
                  <!-- ✅ 📞 → NavIconComponent -->
                  <fas-nav-icon [path]="icons.phone" [size]="11" color="var(--gray-400)" />
                  {{ draft.supportContact }}
                </div>
              }
            </div>
          </div>

        </div>
      </div>

    </div>
  }

</div>
  `,
  styleUrl: './branding.component.scss',
})
export class BrandingComponent implements OnInit {
  protected readonly store     = inject(BrandingStore);
  private readonly authStore   = inject(AuthStore);
  protected readonly icons     = ICONS;
  protected readonly palettes  = PALETTES;

  readonly apiBase = '';

  draft = {
    companyDisplayName: '',
    supportContact:     '',
    ticketFooter:       '',
    primaryColor:       '#0B3D91',
    /** Conservé pour compatibilité API — calculé depuis primaryColor, jamais exposé dans le formulaire */
    secondaryColor:     '#f1f5f9',
  };

  isDragging = signal(false);

  /** Teinte claire calculée dynamiquement pour le hover/preview */
  protected primaryLight(): string {
    return lighten(this.draft.primaryColor);
  }

  ngOnInit(): void {
    const companyId = this.authStore.companyId();
    this.store.loadSettings(companyId).then(() => this.syncDraft());
  }

  async retryLoad(): Promise<void> {
    this.store.reset();
    const companyId = this.authStore.companyId();
    await this.store.loadSettings(companyId);
    this.syncDraft();
  }

  private syncDraft(): void {
    const s = this.store.settings();
    if (!s) return;
    this.draft = {
      companyDisplayName: s.companyDisplayName,
      supportContact:     s.supportContact,
      ticketFooter:       s.ticketFooter,
      primaryColor:       s.primaryColor,
      secondaryColor:     s.secondaryColor ?? '#f1f5f9',
    };
  }

  resetDraft(): void {
    this.syncDraft();
    this.store.clearMessages();
  }

  isValid(): boolean {
    return !!this.draft.companyDisplayName && this.draft.companyDisplayName.length >= 2;
  }

  async save(): Promise<void> {
    if (!this.isValid()) return;
    // secondaryColor = version claire de la couleur signature (calculée)
    const secondaryColor = lighten(this.draft.primaryColor);
    await this.store.saveSettings({ ...this.draft, secondaryColor });
    setTimeout(() => this.store.clearMessages(), 4000);
  }

  applyPalette(p: Palette): void {
    this.draft.primaryColor   = p.primary;
    this.draft.secondaryColor = lighten(p.primary);
  }

  initials(): string {
    return (this.draft.companyDisplayName || 'FS')
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'FS';
  }

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.store.uploadLogo(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.store.uploadLogo(file);
  }

  async deleteLogo(): Promise<void> {
    await this.store.deleteLogo();
  }
}
