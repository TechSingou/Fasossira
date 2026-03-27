// apps/portal/src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';

@Component({
  selector: 'fas-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="portal-shell">
      <fas-header />
      <main class="portal-main">
        <router-outlet />
      </main>
      <footer class="portal-footer">
        <span>© {{ year }} Fasossira · Transport SaaS</span>
      </footer>
    </div>
  `,
  styles: [`
    .portal-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .portal-main  { flex: 1; }
    .portal-footer {
      padding: 14px 24px;
      text-align: center;
      font-size: .72rem;
      color: var(--gray-400);
      border-top: 1px solid var(--gray-200);
      background: var(--white);
    }
  `],
})
export class AppComponent {
  readonly year = new Date().getFullYear();
}
