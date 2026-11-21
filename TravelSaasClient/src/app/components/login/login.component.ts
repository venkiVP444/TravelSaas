import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <!-- Logo -->
        <div class="brand-header">
          <div class="logo-mark">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#FF4500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#FF4500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#FF4500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="brand-title">V4Journey</h1>
          <p class="brand-subtitle">Every mile brings a smile! — Travel SaaS Platform</p>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-title">Sign In to Your Workspace</div>

          <div *ngIf="errorMessage()" class="alert-box">
            {{ errorMessage() }}
          </div>

          <div class="field-group">
            <label>Work Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="e.g. admin@v4journey.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="field-group">
            <label>Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="loading()">
            <span *ngIf="!loading()">Sign In →</span>
            <span *ngIf="loading()">Authenticating...</span>
          </button>
        </form>

        <!-- Quick Demo Profiles for Instant Evaluation -->
        <div class="quick-profiles">
          <span class="quick-lbl">Quick Demo Accounts:</span>
          <div class="profiles-row">
            <button class="btn-profile" (click)="fillCredentials('admin@v4journey.com', 'Admin@123')">
              <strong>V4Journey Director</strong>
              <span>admin&#64;v4journey.com</span>
            </button>
            <button class="btn-profile" (click)="fillCredentials('operator@skyway.com', 'SkyWay@123')">
              <strong>SkyWay Holidays</strong>
              <span>operator&#64;skyway.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-app);
      padding: 24px;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: 36px 32px;
      box-shadow: var(--shadow-lg);
    }

    .brand-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .logo-mark {
      margin-bottom: 12px;
    }

    .brand-title {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.5px;
    }

    .brand-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-title {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }

    .alert-box {
      background: var(--danger-bg);
      border: 1px solid var(--danger);
      color: #fca5a5;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-group label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
    }

    .field-group input {
      height: 44px;
      padding: 0 14px;
      background: var(--bg-input);
      border: 1px solid var(--bg-input-border);
      border-radius: var(--radius-md);
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .field-group input:focus {
      border-color: var(--primary);
    }

    .btn-primary {
      height: 46px;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 600;
      justify-content: center;
    }

    .quick-profiles {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .quick-lbl {
      display: block;
      font-size: 12px;
      color: var(--text-dim);
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .profiles-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .btn-profile {
      background: #191924;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 3px;
      transition: all 0.2s;
    }

    .btn-profile:hover {
      border-color: var(--primary);
      background: #20202e;
    }

    .btn-profile strong {
      font-size: 12px;
      color: #fff;
    }

    .btn-profile span {
      font-size: 11px;
      color: var(--text-muted);
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  email = 'admin@v4journey.com';
  password = 'Admin@123';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  fillCredentials(e: string, p: string) {
    this.email = e;
    this.password = p;
    this.errorMessage.set(null);
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: res => {
        this.loading.set(false);
        this.toast.success(`Welcome back, ${res.user.fullName}!`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid email or password. Please try again.');
      }
    });
  }
}

