import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <div class="app-layout">
      <app-navbar *ngIf="!isPublicRoute()"></app-navbar>
      <main class="main-viewport">
        <router-outlet></router-outlet>
      </main>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-app);
    }
    .main-viewport {
      flex: 1;
    }
  `]
})
export class App {
  private router = inject(Router);

  isPublicRoute(): boolean {
    return this.router.url.startsWith('/public/');
  }
}
