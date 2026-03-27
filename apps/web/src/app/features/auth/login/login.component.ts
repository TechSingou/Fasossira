/**
 * LoginComponent v2
 *
 * Fichier : apps/web/src/app/features/auth/login/login.component.ts
 *
 * Changements vs v1 :
 *   ✅ Styles extraits du styles: [...] inline → login.component.scss
 *   ✅ Emojis features (🎫 🗺 📊 🏢) → NavIconComponent SVG
 *   ✅ Emojis toggle password (🙈 👁) → SVG eye / eye-off
 *   ✅ Emoji alerte ⚠️ → SVG warning icon
 *   ✅ Gradient brand panel → var(--brand) / var(--brand-darker)
 *   ✅ font-family: 'Sora' inline → var(--font)
 */
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { AuthStore } from '../../../core/auth/auth.store';
import { NavIconComponent } from '../../../shared/components/nav-icon/nav-icon.component';
import { ICONS } from '../../../shared/tokens/icons';

/* SVG paths pour l'œil (toggle password) — pas dans ICONS car très spécifiques */
const EYE_OPEN  = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>`;
const EYE_CLOSE = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
  a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8
  a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
  <line x1="1" y1="1" x2="23" y2="23"/>`;

interface FeatureItem {
  iconKey: keyof typeof ICONS;
  label: string;
}

@Component({
  selector: 'fas-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NavIconComponent],
  template: `
    <div class="login-page">

      <!-- ── Panel gauche : branding ── -->
      <div class="login-brand">
        <div class="brand-content">

          <div class="brand-logo">
            <div class="logo-mark">Fs</div>
            <span class="logo-name">Fasossira</span>
          </div>

          <h1 class="brand-tagline">
            Gérez votre compagnie<br>de transport
          </h1>

          <p class="brand-sub">
            Vente de billets · Gestion des voyages<br>
            Suivi des passagers · Analytics
          </p>

          <ul class="brand-features" aria-label="Fonctionnalités">
            @for (f of features; track f.iconKey) {
              <li class="feature-item">
                <!-- ✅ SVG icon — plus d'emoji -->
                <span class="feature-icon" aria-hidden="true">
                  <fas-nav-icon [path]="icons[f.iconKey]" [size]="16" color="rgba(255,255,255,.8)" />
                </span>
                <span>{{ f.label }}</span>
              </li>
            }
          </ul>
        </div>
      </div>

      <!-- ── Panel droit : formulaire ── -->
      <div class="login-form-panel">
        <div class="login-form-container">

          <div class="form-header">
            <h2>Connexion</h2>
            <p>Accédez à votre espace de gestion</p>
          </div>

          <!-- Alerte erreur -->
          @if (authStore.error()) {
            <div class="alert alert-error" role="alert">
              <!-- ✅ SVG warning — plus de ⚠️ emoji -->
              <fas-nav-icon [path]="icons.warning" [size]="16" color="currentColor" />
              <span>{{ authStore.error() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label" for="email">Adresse email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-control"
                [class.is-invalid]="isInvalid('email')"
                placeholder="votre@email.com"
                autocomplete="email"
              />
              @if (isInvalid('email')) {
                <span class="form-error">{{ getError('email') }}</span>
              }
            </div>

            <!-- Mot de passe -->
            <div class="form-group">
              <label class="form-label" for="password">Mot de passe</label>
              <div class="input-wrapper">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="form-control has-suffix"
                  [class.is-invalid]="isInvalid('password')"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <!-- ✅ SVG eye icon — plus de 🙈/👁 emojis -->
                <button
                  type="button"
                  class="toggle-password"
                  (click)="showPassword.set(!showPassword())"
                  [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                >
                  <fas-nav-icon
                    [path]="showPassword() ? eyeClose : eyeOpen"
                    [size]="16"
                    color="currentColor"
                  />
                </button>
              </div>
              @if (isInvalid('password')) {
                <span class="form-error">{{ getError('password') }}</span>
              }
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="btn-submit"
              [disabled]="authStore.loading() || form.invalid"
            >
              @if (authStore.loading()) {
                <!-- ✅ .spinning depuis styles.scss — pas de @keyframes inline -->
                <span class="spinner spinning" aria-hidden="true"></span>
                Connexion en cours…
              } @else {
                Se connecter
              }
            </button>

          </form>

          <footer class="form-footer">
            <span>Fasossira © 2026</span>
            <span aria-hidden="true">·</span>
            <span>Transport SaaS</span>
          </footer>

        </div>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  protected readonly authStore = inject(AuthStore);
  private  readonly fb         = inject(FormBuilder);

  protected readonly icons      = ICONS;
  protected readonly eyeOpen    = EYE_OPEN;
  protected readonly eyeClose   = EYE_CLOSE;
  protected showPassword        = signal(false);

  /* ✅ Tableau typé avec iconKey — plus d'emojis */
  protected readonly features: FeatureItem[] = [
    { iconKey: 'ticket',     label: 'Vente de billets guichet & en route' },
    { iconKey: 'map',        label: 'Gestion réseau & tarification segment' },
    { iconKey: 'activity',   label: 'Analytics & rapports en temps réel' },
    { iconKey: 'layers',     label: 'Multi-tenant white-label' },
  ];

  protected form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected isInvalid(field: string): boolean {
    const ctrl = this.form.get(field) as AbstractControl;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected getError(field: string): string {
    const ctrl = this.form.get(field) as AbstractControl;
    if (ctrl.errors?.['required'])   return 'Ce champ est obligatoire';
    if (ctrl.errors?.['email'])      return 'Adresse email invalide';
    if (ctrl.errors?.['minlength'])  return 'Mot de passe trop court (min. 6 caractères)';
    return '';
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.value;
    await this.authStore.login(email!, password!);
  }
}
