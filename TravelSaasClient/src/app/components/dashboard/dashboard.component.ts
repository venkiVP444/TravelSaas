import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardStats } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Executive Dashboard</h1>
          <p class="page-subtitle">Real-time overview of your fleet, bookings, revenue, and travel operations</p>
        </div>
        <div class="header-actions">
          <a routerLink="/trips/create" class="btn btn-primary">+ Create New Trip</a>
        </div>
      </div>

      <!-- 4 Core Metric KPI Cards (Clickable) -->
      <div class="kpi-grid">
        <!-- Total Trips Card -->
        <div class="kpi-card" (click)="navigateToTrips('all')">
          <div class="kpi-header">
            <span class="kpi-label">Total Trips</span>
            <span class="kpi-icon trips-icon">✈</span>
          </div>
          <div class="kpi-value">{{ stats()?.totalTrips ?? 0 }}</div>
          <div class="kpi-footer">
            <span class="kpi-trend positive">Active & completed tours</span>
            <span class="kpi-link">View all →</span>
          </div>
        </div>

        <!-- Upcoming Trips Card -->
        <div class="kpi-card highlight-card" (click)="navigateToTrips('Upcoming')">
          <div class="kpi-header">
            <span class="kpi-label">Upcoming Trips</span>
            <span class="kpi-icon upcoming-icon">📅</span>
          </div>
          <div class="kpi-value text-primary">{{ stats()?.upcomingTrips ?? 0 }}</div>
          <div class="kpi-footer">
            <span class="kpi-trend">Scheduled departures</span>
            <span class="kpi-link">Filter list →</span>
          </div>
        </div>

        <!-- Revenue Card -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Estimated Revenue</span>
            <span class="kpi-icon revenue-icon">₹</span>
          </div>
          <div class="kpi-value text-success">
            ₹{{ (stats()?.totalRevenue ?? 0) | number:'1.0-0' }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-trend positive">From confirmed bookings</span>
          </div>
        </div>

        <!-- Total Travellers Card -->
        <div class="kpi-card" (click)="navigateToTrips('Active')">
          <div class="kpi-header">
            <span class="kpi-label">Active Travellers</span>
            <span class="kpi-icon traveller-icon">👥</span>
          </div>
          <div class="kpi-value">{{ stats()?.totalTravellers ?? 0 }}</div>
          <div class="kpi-footer">
            <span class="kpi-trend">Booked passenger seats</span>
            <span class="kpi-link">View trips →</span>
          </div>
        </div>
      </div>

      <!-- Secondary Metrics Row -->
      <div class="secondary-grid">
        <div class="stat-box" routerLink="/resources">
          <div class="stat-number">{{ stats()?.activeResources ?? 0 }}</div>
          <div class="stat-desc">
            <strong>Active Resources & Partners</strong>
            <span>Vehicles, Hotels, Restaurants & Lodges</span>
          </div>
          <span class="stat-arrow">→</span>
        </div>

        <div class="stat-box" routerLink="/team">
          <div class="stat-number">{{ stats()?.totalTeamMembers ?? 0 }}</div>
          <div class="stat-desc">
            <strong>Team Members</strong>
            <span>Drivers, Guiders, Helpers & Staff</span>
          </div>
          <span class="stat-arrow">→</span>
        </div>
      </div>

      <!-- Operations & Activity Feeds -->
      <div class="bottom-grid">
        <!-- Recent Activity Feed -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="card-title">Live Operational Audit Feed</h2>
            <span class="live-pill">● Real-time</span>
          </div>
          <div class="activity-list">
            <div *ngFor="let log of stats()?.recentActivities" class="activity-item">
              <div class="activity-icon" [ngClass]="log.action.toLowerCase()">
                {{ log.action === 'Create' ? '✚' : log.action === 'Publish' ? '🌐' : '✎' }}
              </div>
              <div class="activity-details">
                <p class="activity-desc">{{ log.description }}</p>
                <div class="activity-meta">
                  <span>{{ log.userName }}</span>
                  <span>•</span>
                  <span>{{ log.timestamp | date:'short' }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="!stats()?.recentActivities?.length" class="empty-state">
              No recent audit activity found.
            </div>
          </div>
        </div>

        <!-- Quick Access Shortcuts -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="card-title">Quick Actions</h2>
          </div>
          <div class="shortcuts-list">
            <a routerLink="/trips/create" class="shortcut-item">
              <div class="shortcut-icon">🚀</div>
              <div>
                <div class="shortcut-title">Create New Trip</div>
                <div class="shortcut-subtitle">Plan itinerary, configure seats, set margins & publish</div>
              </div>
            </a>

            <a routerLink="/resources" class="shortcut-item">
              <div class="shortcut-icon">🚗</div>
              <div>
                <div class="shortcut-title">Own & Partners Resource Hub</div>
                <div class="shortcut-subtitle">Manage Vehicles, Hotels, Restaurants, and partner terms</div>
              </div>
            </a>

            <a routerLink="/team" class="shortcut-item">
              <div class="shortcut-icon">👥</div>
              <div>
                <div class="shortcut-title">Team Rosters & Payroll</div>
                <div class="shortcut-subtitle">Manage Guiders, Drivers, and track trip payouts</div>
              </div>
            </a>

            <a routerLink="/settings" class="shortcut-item">
              <div class="shortcut-icon">⚙️</div>
              <div>
                <div class="shortcut-title">Dynamic Custom Fields</div>
                <div class="shortcut-subtitle">Configure passport, emergency contacts, or new resource schemas</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 32px 36px;
      max-width: 1440px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #fff;
    }

    .page-subtitle {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 22px 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .kpi-card:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .highlight-card {
      border-left: 3px solid var(--primary);
    }

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .kpi-label {
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-icon {
      font-size: 1.1rem;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1e1e2b;
    }

    .kpi-value {
      font-size: 2.1rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .text-primary {
      color: var(--primary) !important;
    }

    .text-success {
      color: var(--success) !important;
    }

    .kpi-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      border-top: 1px solid #1f1f2d;
      padding-top: 10px;
    }

    .kpi-trend {
      color: var(--text-dim);
    }

    .kpi-trend.positive {
      color: #34d399;
    }

    .kpi-link {
      color: var(--primary);
      font-weight: 600;
    }

    .secondary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }

    .stat-box {
      background: #14141d;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 18px 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .stat-box:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-light);
    }

    .stat-number {
      font-size: 1.8rem;
      font-weight: 800;
      color: #fff;
      background: #20202e;
      width: 54px;
      height: 54px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-desc {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .stat-desc strong {
      font-size: 0.95rem;
      color: #fff;
    }

    .stat-desc span {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .stat-arrow {
      color: var(--text-dim);
      font-size: 1.2rem;
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 24px;
    }

    .content-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 22px 24px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      border-bottom: 1px solid #1f1f2e;
      padding-bottom: 12px;
    }

    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
    }

    .live-pill {
      font-size: 0.72rem;
      color: var(--success);
      background: var(--success-bg);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-weight: 600;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      background: #171722;
      border: 1px solid #20202d;
    }

    .activity-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      background: #252538;
      color: #fff;
      flex-shrink: 0;
    }

    .activity-icon.create {
      background: rgba(16, 185, 129, 0.2);
      color: var(--success);
    }

    .activity-icon.publish {
      background: rgba(59, 130, 246, 0.2);
      color: var(--info);
    }

    .activity-desc {
      font-size: 0.84rem;
      color: #e2e2ec;
      font-weight: 500;
    }

    .activity-meta {
      font-size: 0.74rem;
      color: var(--text-dim);
      margin-top: 4px;
      display: flex;
      gap: 6px;
    }

    .shortcuts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .shortcut-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px;
      border-radius: var(--radius-sm);
      background: #171722;
      border: 1px solid #20202d;
      transition: all 0.15s ease;
    }

    .shortcut-item:hover {
      background: #1e1e2d;
      border-color: var(--border-light);
    }

    .shortcut-icon {
      font-size: 1.4rem;
    }

    .shortcut-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #fff;
    }

    .shortcut-subtitle {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .empty-state {
      padding: 30px;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.86rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.api.getDashboardStats().subscribe({
      next: data => this.stats.set(data),
      error: () => {}
    });
  }

  navigateToTrips(status: string) {
    if (status === 'all') {
      this.router.navigate(['/trips']);
    } else {
      this.router.navigate(['/trips'], { queryParams: { status } });
    }
  }
}

