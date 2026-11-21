import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar" *ngIf="auth.currentUser()">
      <div class="nav-left">
        <!-- V4Journey Logo matching Figma -->
        <a routerLink="/dashboard" class="brand-logo">
          <div class="logo-mark">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#FF4500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#FF4500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#FF4500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-title">V4Journey</span>
            <span class="brand-subtitle">Every mile brings a smile!</span>
          </div>
        </a>

        <!-- Main Navigation Items -->
        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Dashboard</a>
          <a routerLink="/trips" routerLinkActive="active" class="nav-link">Trip Management</a>
          <a routerLink="/resources" routerLinkActive="active" class="nav-link">Own & Partners</a>
          <a routerLink="/team" routerLinkActive="active" class="nav-link">Team Members</a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-link">Settings</a>
        </nav>
      </div>

      <!-- Action items on the right -->
      <div class="nav-right">
        <!-- Quick Create Dropdown Menu -->
        <div class="create-dropdown-wrapper">
          <button class="btn-create" (click)="toggleCreateMenu()">
            <span>+ Create</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div class="create-menu" *ngIf="showCreateMenu()">
            <a routerLink="/trips/create" (click)="closeCreateMenu()" class="menu-item">
              <span class="icon">✈</span> New Trip
            </a>
            <a routerLink="/resources" (click)="closeCreateMenu()" class="menu-item">
              <span class="icon">🚗</span> New Resource / Partner
            </a>
            <a routerLink="/team" (click)="closeCreateMenu()" class="menu-item">
              <span class="icon">👤</span> New Team Member
            </a>
          </div>
        </div>

        <!-- Tenant Badge -->
        <div class="tenant-badge" title="Active Tenant">
          {{ auth.currentTenant()?.name }}
        </div>

        <!-- User Profile Avatar with Initials & Sign Out -->
        <div class="user-menu-wrapper">
          <button class="user-avatar" (click)="toggleUserMenu()" title="{{ auth.currentUser()?.fullName }} ({{ auth.currentUser()?.role }})">
            <span>{{ getUserInitial() }}</span>
          </button>

          <div class="user-dropdown" *ngIf="showUserMenu()">
            <div class="user-dropdown-info">
              <strong>{{ auth.currentUser()?.fullName }}</strong>
              <span>{{ auth.currentUser()?.email }}</span>
              <span class="role-pill">{{ auth.currentUser()?.role }}</span>
            </div>
            <hr class="dropdown-divider" />
            <button class="dropdown-item btn-signout" (click)="logout()">
              <span>🚪 Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: 64px;
      background: #111117;
      border-bottom: 1px solid #1f1f2a;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      position: sticky;
      top: 0;
      z-index: 500;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 40px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-mark {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 0.62rem;
      color: #8b8b9f;
      margin-top: -2px;
      font-weight: 400;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-link {
      padding: 8px 14px;
      font-size: 0.86rem;
      font-weight: 500;
      color: #9292a8;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
      position: relative;
    }

    .nav-link:hover {
      color: #fff;
    }

    .nav-link.active {
      color: #ffffff;
      font-weight: 600;
    }

    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: -13px;
      left: 14px;
      right: 14px;
      height: 3px;
      background: var(--primary);
      border-radius: 3px 3px 0 0;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .create-dropdown-wrapper {
      position: relative;
    }

    .btn-create {
      background: var(--primary);
      color: #ffffff;
      padding: 7px 16px;
      font-size: 0.86rem;
      font-weight: 700;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-create:hover {
      background: var(--primary-hover);
    }

    .create-menu {
      position: absolute;
      top: 42px;
      right: 0;
      background: #191923;
      border: 1px solid #2a2a3a;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 25px rgba(0,0,0,0.6);
      width: 200px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 100;
      animation: fadeIn 0.15s ease;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      font-size: 0.84rem;
      font-weight: 500;
      color: #d1d1e0;
      border-radius: var(--radius-sm);
    }

    .menu-item:hover {
      background: #252533;
      color: #fff;
    }

    .tenant-badge {
      font-size: 0.75rem;
      padding: 4px 10px;
      background: #1c1c27;
      border: 1px solid #282839;
      color: #9d9db3;
      border-radius: var(--radius-full);
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-menu-wrapper {
      position: relative;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #0d9488;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.3);
    }

    .user-dropdown {
      position: absolute;
      top: 44px;
      right: 0;
      width: 220px;
      background: #181824;
      border: 1px solid #28283a;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 12px;
      z-index: 600;
    }

    .user-dropdown-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .user-dropdown-info strong {
      font-size: 13px;
      color: #fff;
    }

    .user-dropdown-info span {
      font-size: 11px;
      color: var(--text-muted);
    }

    .role-pill {
      display: inline-block;
      margin-top: 4px;
      font-size: 10px;
      padding: 2px 6px;
      background: var(--primary-light);
      color: var(--primary);
      border-radius: 4px;
      align-self: flex-start;
      font-weight: 600;
    }

    .dropdown-divider {
      border: 0;
      border-top: 1px solid #28283a;
      margin: 10px 0;
    }

    .dropdown-item {
      width: 100%;
      background: none;
      border: none;
      color: #ef4444;
      text-align: left;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s;
    }

    .dropdown-item:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  showCreateMenu = signal(false);
  showUserMenu = signal(false);

  toggleCreateMenu() {
    this.showCreateMenu.update(v => !v);
    this.showUserMenu.set(false);
  }

  closeCreateMenu() {
    this.showCreateMenu.set(false);
  }

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
    this.showCreateMenu.set(false);
  }

  getUserInitial(): string {
    const name = this.auth.currentUser()?.fullName;
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  logout() {
    this.showUserMenu.set(false);
    this.auth.logout();
  }
}

