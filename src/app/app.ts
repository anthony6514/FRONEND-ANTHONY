import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { trigger, transition, style, animate, query } from '@angular/animations';

import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { ChatbotComponent } from './shared/components/chatbot/chatbot.component';
import { AuthService } from './core/services/auth.service';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(12px)' }),
      animate('280ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
    ], { optional: true }),
  ])
]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, ChatbotComponent],
  animations: [routeAnimations],
  template: `
    <ng-container *ngIf="showShell(); else noShell">
      <div class="app-layout">
        <app-sidebar [(collapsed)]="sidebarCollapsed" />
        <div class="app-main">
          <app-topbar />
          <main class="app-content" [@routeAnimations]="getRouteState(outlet)">
            <router-outlet #outlet="outlet" />
          </main>
        </div>
      </div>
      <app-chatbot />
    </ng-container>
    <ng-template #noShell>
      <router-outlet />
    </ng-template>
  `,
  styles: [`
    .app-layout { display: flex; min-height: 100vh; }
    .app-main   { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow-x: hidden; }
    .app-content{ flex: 1; padding: 24px; }
  `]
})
export class App {
  auth    = inject(AuthService);
  router  = inject(Router);
  sidebarCollapsed = false;

  showShell() {
    const url = this.router.url;
    return this.auth.isLoggedIn() && !url.startsWith('/login');
  }

  getRouteState(outlet: any) {
    return outlet?.activatedRouteData?.['animation'] ?? Math.random();
  }
}
