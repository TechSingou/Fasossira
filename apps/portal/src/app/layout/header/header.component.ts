// apps/portal/src/app/layout/header/header.component.ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'fas-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <a routerLink="/search" class="header-logo">
        <div class="logo-mark">Fs</div>
        <div>
          <div class="logo-name">Fasossira</div>
          <div class="logo-sub">Réservation en ligne</div>
        </div>
      </a>

      <nav class="header-nav">
        <a routerLink="/search" routerLinkActive="nav-active"
          [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
          Voyages
        </a>
        <a routerLink="/my-ticket" routerLinkActive="nav-active" class="nav-link">
          Mes billets
        </a>
      </nav>
    </header>
  `,
  styles: [`
    .header {
      background: var(--brand);
      height: 56px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }

    .logo-mark {
      width: 32px; height: 32px;
      background: rgba(255,255,255,.2);
      border-radius: var(--radius-sm);
      display: grid; place-items: center;
      font-size: 13px; font-weight: 800;
      color: var(--white); flex-shrink: 0;
    }

    .logo-name { font-size: .9rem; font-weight: 700; color: var(--white); }
    .logo-sub  { font-size: .55rem; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .8px; }

    .header-nav { display: flex; gap: 6px; align-items: center; }

    .nav-link {
      font-size: .8rem; font-weight: 600;
      color: rgba(255,255,255,.75);
      text-decoration: none;
      padding: 6px 14px;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      transition: all .15s;

      &:hover { color: var(--white); background: rgba(255,255,255,.1); }
    }

    .nav-link.nav-active {
      color: var(--white);
      border-color: rgba(255,255,255,.3);
      background: rgba(255,255,255,.12);
    }
  `],
})
export class HeaderComponent {}
