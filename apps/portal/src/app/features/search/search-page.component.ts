// apps/portal/src/app/features/search/search-page.component.ts
import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PublicSearchService, PublicSchedule, CompanyInfo,
} from '../../core/services/public-search.service';
import { BookingStateService } from '../../core/services/booking-state.service';
import { NavIconComponent } from '../../shared/components/nav-icon/nav-icon.component';
import { ICONS } from '../../shared/tokens/icons';

@Component({
  selector: 'fas-search-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NavIconComponent],
  template: `
<div class="search-page">

  <!-- ── Hero + Formulaire ── -->
  <div class="hero">
    <h1 class="hero-title">Voyagez partout au Mali</h1>
    <p class="hero-sub">Comparez et réservez les billets de toutes les compagnies</p>

    <div class="search-box">
      <div class="search-grid">
        <div class="field">
          <label class="field-label">Départ</label>
          <input type="text" class="field-input" [(ngModel)]="fromStop"
            placeholder="ex: Bamako" (keyup.enter)="search()" />
        </div>
        <div class="field">
          <label class="field-label">Destination</label>
          <input type="text" class="field-input" [(ngModel)]="toStop"
            placeholder="ex: Mopti" (keyup.enter)="search()" />
        </div>
        <div class="field">
          <label class="field-label">Date</label>
          <input type="date" class="field-input" [(ngModel)]="date" />
        </div>
      </div>

      <!-- Filtre compagnie -->
      <div class="company-bar">
        <span class="company-bar-label">Compagnie</span>
        <div class="company-chips">
          <button class="chip" [class.chip-active]="selectedSlug() === ''"
            (click)="selectCompany('')">
            Toutes
            <span class="chip-count">{{ schedules().length }}</span>
          </button>
          @for (co of availableCompanies(); track co.id) {
            <button class="chip" [class.chip-active]="selectedSlug() === co.slug"
              (click)="selectCompany(co.slug)">
              <span class="co-dot" [style.background]="co.primaryColor"></span>
              {{ co.name }}
              <span class="chip-count">{{ countForCo(co.id) }}</span>
            </button>
          }
        </div>
      </div>

      <button class="btn-search" (click)="search()" [disabled]="loading()">
        <fas-nav-icon [path]="icons.activity" [size]="15" color="currentColor" />
        @if (loading()) { Recherche en cours… } @else { Rechercher les voyages }
      </button>
    </div>
  </div>

  <!-- ── Résultats ── -->
  @if (searched()) {
    <div class="results-section">
      <div class="content-wrap">

        @if (loading()) {
          <div class="skeleton-list">
            @for (_ of [1,2,3]; track $index) {
              <div class="skeleton-card">
                <div class="sk sk-co"></div>
                <div class="sk-body">
                  <div class="sk sk-title"></div>
                  <div class="sk sk-sub"></div>
                </div>
                <div class="sk sk-price"></div>
              </div>
            }
          </div>

        } @else if (error()) {
          <div class="status-card status-error">
            <fas-nav-icon [path]="icons.warning" [size]="24" color="var(--danger)" />
            <div class="status-title">Erreur de connexion</div>
            <div class="status-desc">{{ error() }}</div>
            <button class="btn-action" (click)="search()">Réessayer</button>
          </div>

        } @else if (filteredSchedules().length === 0) {
          <div class="status-card">
            <fas-nav-icon [path]="icons.activity" [size]="32" color="var(--gray-300)" />
            <div class="status-title">Aucun voyage trouvé</div>
            <div class="status-desc">
              @if (selectedSlug()) {
                Essayez "Toutes les compagnies" ou modifiez la date.
              } @else {
                Aucun voyage disponible pour ce trajet à cette date.
              }
            </div>
            @if (selectedSlug()) {
              <button class="btn-action" (click)="selectCompany('')">
                Voir toutes les compagnies
              </button>
            }
          </div>

        } @else {
          <!-- Header résultats -->
          <div class="results-header">
            <div class="results-title">
              {{ fromStop || 'Tous départs' }} → {{ toStop || 'Toutes destinations' }}
            </div>
            <div class="results-meta">
              @if (selectedSlug()) {
                <div class="filter-badge"
                  [style.border-color]="activeCompany()?.primaryColor"
                  [style.color]="activeCompany()?.primaryColor">
                  <span class="filter-dot"
                    [style.background]="activeCompany()?.primaryColor"></span>
                  {{ activeCompany()?.name }}
                  <button class="filter-clear"
                    [style.color]="activeCompany()?.primaryColor"
                    (click)="selectCompany('')">✕</button>
                </div>
              }
              <span class="results-count">
                {{ filteredSchedules().length }} voyage(s) disponible(s)
              </span>
            </div>
          </div>

          <!-- Liste voyages -->
          @for (s of filteredSchedules(); track s.scheduleId; let i = $index) {
            <div class="trip-card"
              [class.trip-full]="s.availableSeats === 0"
              [style.animation-delay]="i * 40 + 'ms'">

              <!-- Logo compagnie -->
              <div class="trip-co">
                @if (s.company.logoUrl) {
                  <img [src]="s.company.logoUrl" [alt]="s.company.name" class="co-logo-img" />
                } @else {
                  <div class="co-logo-mark" [style.background]="s.company.primaryColor">
                    {{ s.company.name.slice(0,2).toUpperCase() }}
                  </div>
                }
                <div class="co-name">{{ s.company.name }}</div>
              </div>

              <!-- Horaires -->
              <div class="trip-times">
                <div class="time-block">
                  <div class="trip-time">{{ fmtTime(s.departureDateTime) }}</div>
                  <div class="trip-city">{{ firstStop(s) }}</div>
                </div>
                <div class="trip-arrow">
                  <div class="arrow-line"></div>
                  <div class="trip-dur">{{ duration(s) }}</div>
                </div>
                <div class="time-block">
                  <div class="trip-time">{{ fmtTime(s.arrivalDateTime) }}</div>
                  <div class="trip-city">{{ lastStop(s) }}</div>
                </div>
              </div>

              <!-- Disponibilité -->
              <div class="trip-avail">
                @if (s.availableSeats === 0) {
                  <div class="avail-label avail-full">Complet</div>
                  <span class="avail-badge badge-full">Indisponible</span>
                } @else if (s.availableSeats <= 5) {
                  <div class="avail-label avail-few">{{ s.availableSeats }} places</div>
                  <span class="avail-badge badge-few">Dernières places</span>
                } @else {
                  <div class="avail-label avail-ok">{{ s.availableSeats }} places</div>
                  <span class="avail-badge badge-ok">Disponible</span>
                }
              </div>

              <!-- CTA -->
              <div class="trip-cta">
                <div class="price-note">Prix selon segment</div>
                @if (s.availableSeats > 0) {
                  <button class="btn-book"
                    [style.background]="s.company.primaryColor"
                    (click)="openBooking(s)">
                    Choisir →
                  </button>
                } @else {
                  <button class="btn-book btn-book-disabled" disabled>Complet</button>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  }

</div>
  `,
  styleUrl: './search-page.component.scss',
})
export class SearchPageComponent implements OnInit {
  private readonly api = inject(PublicSearchService);
  private readonly state = inject(BookingStateService);
  private readonly router = inject(Router);
  protected readonly icons = ICONS;

  fromStop = '';
  toStop = '';
  date = '';

  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly error = signal<string | null>(null);
  readonly schedules = signal<PublicSchedule[]>([]);
  readonly selectedSlug = signal('');

  readonly availableCompanies = computed<CompanyInfo[]>(() => {
    const seen = new Set<string>();
    return this.schedules()
      .map(s => s.company)
      .filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
  });

  readonly filteredSchedules = computed(() =>
    this.selectedSlug()
      ? this.schedules().filter(s => s.company.slug === this.selectedSlug())
      : this.schedules()
  );

  readonly activeCompany = computed(() =>
    this.availableCompanies().find(c => c.slug === this.selectedSlug()) ?? null
  );

  ngOnInit(): void {
    this.date = new Date().toISOString().split('T')[0];
  }

  search(): void {
    this.loading.set(true);
    this.error.set(null);
    this.searched.set(true);
    this.schedules.set([]);
    this.selectedSlug.set('');

    this.api.search({
      date: this.date,
      fromStop: this.fromStop.trim() || undefined,
      toStop: this.toStop.trim() || undefined,
    }).subscribe({
      next: s => { this.schedules.set(s); this.loading.set(false); },
      error: e => {
        this.error.set(e?.error?.message ?? 'Impossible de contacter le serveur');
        this.loading.set(false);
      },
    });
  }

  selectCompany(slug: string): void { this.selectedSlug.set(slug); }

  countForCo(id: string): number {
    return this.schedules().filter(s => s.company.id === id).length;
  }

  openBooking(s: PublicSchedule): void {
    if (s.availableSeats === 0) return;
    this.state.setSchedule(s, 0, 0, '', '');
    this.router.navigate(['/book', s.scheduleId]);
  }

  fmtTime(dt: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  firstStop(s: PublicSchedule): string {
    const stops = s.trip.route.stops;
    return stops.length ? stops[0].cityName : '—';
  }

  lastStop(s: PublicSchedule): string {
    const stops = s.trip.route.stops;
    return stops.length ? stops[stops.length - 1].cityName : '—';
  }

  duration(s: PublicSchedule): string {
    if (!s.departureDateTime || !s.arrivalDateTime) return '';
    const ms = new Date(s.arrivalDateTime).getTime() - new Date(s.departureDateTime).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`;
  }
}
