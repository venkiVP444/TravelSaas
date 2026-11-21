import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { PublicTrip } from '../../models/models';

@Component({
  selector: 'app-public-trip',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="public-trip-page" *ngIf="trip(); else loadingOrNotFound">
      <!-- Public Brand Banner -->
      <header class="public-nav">
        <div class="nav-container">
          <div class="brand-row">
            <div class="brand-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#FF4500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="#FF4500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#FF4500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="brand-names">
                <span class="brand-title">{{ trip()?.companyName || 'V4Journey' }}</span>
                <span class="brand-tagline">Verified Tour Package</span>
              </div>
            </div>

            <button class="btn btn-primary" (click)="openBookingInquiry()">
              Book / Inquire Now
            </button>
          </div>
        </div>
      </header>

      <!-- Main Showcase Layout -->
      <main class="showcase-content">
        <!-- Hero Section -->
        <div class="hero-card">
          <div class="hero-image-box">
            <img *ngIf="trip()?.thumbnailUrl" [src]="trip()?.thumbnailUrl" alt="Tour Hero" />
            <div *ngIf="!trip()?.thumbnailUrl" class="placeholder-hero">
              <span>✈️ 🌄</span>
            </div>
          </div>

          <div class="hero-details">
            <div class="category-code-row">
              <span class="badge badge-upcoming">{{ trip()?.category }}</span>
              <span class="trip-code">{{ trip()?.tripCode }}</span>
            </div>

            <h1 class="tour-title trip-title">{{ trip()?.name }}</h1>

            <div class="tour-highlights-grid">
              <div class="highlight-item">
                <span class="h-icon">📍</span>
                <div>
                  <span class="h-label">Route</span>
                  <strong>{{ trip()?.origin }} → {{ trip()?.destination }}</strong>
                </div>
              </div>

              <div class="highlight-item">
                <span class="h-icon">📅</span>
                <div>
                  <span class="h-label">Dates & Duration</span>
                  <strong>{{ trip()?.startDateTime | date:'dd MMM yyyy' }} - {{ trip()?.endDateTime | date:'dd MMM yyyy' }} ({{ trip()?.duration }})</strong>
                </div>
              </div>

              <div class="highlight-item">
                <span class="h-icon">🍽️</span>
                <div>
                  <span class="h-label">Food Info</span>
                  <strong>{{ trip()?.foodInfo }}</strong>
                </div>
              </div>

              <div class="highlight-item">
                <span class="h-icon">🚖</span>
                <div>
                  <span class="h-label">Pickup & Drop</span>
                  <strong>{{ trip()?.pickupDrop }}</strong>
                </div>
              </div>
            </div>

            <p class="tour-description" *ngIf="trip()?.description">
              {{ trip()?.description }}
            </p>
          </div>
        </div>

        <!-- Pricing & Seats Card -->
        <div class="package-details-row">
          <div class="pricing-card">
            <h3 class="card-heading">Package Pricing</h3>
            <div class="price-tags-grid">
              <div class="price-tag-box">
                <span class="pt-label">Adult Price</span>
                <strong class="pt-val">₹{{ trip()?.adultPrice | number }}</strong>
                <span class="pt-sub">Per person all inclusive</span>
              </div>

              <div class="price-tag-box" *ngIf="(trip()?.childPrice || 0) > 0">
                <span class="pt-label">Child Price</span>
                <strong class="pt-val">₹{{ trip()?.childPrice | number }}</strong>
                <span class="pt-sub">Below 12 years</span>
              </div>
            </div>
          </div>

          <div class="seats-card">
            <h3 class="card-heading">Availability</h3>
            <div class="seats-meter">
              <div class="seats-stats">
                <span>Available Seats:</span>
                <strong class="text-success">{{ trip()?.availableSeats }} seats remaining</strong>
              </div>
              <div class="seats-progress">
                <div class="progress-bar" [style.width.%]="calcSeatPercentage()"></div>
              </div>
              <span class="total-seats-hint">Total group size: {{ trip()?.totalSeats }} passengers</span>
            </div>
          </div>
        </div>

        <!-- Itinerary Schedule Section -->
        <div class="itinerary-section">
          <h2 class="section-heading">Detailed Day-by-Day Itinerary</h2>

          <div class="itinerary-timeline">
            <div *ngFor="let item of trip()?.itinerary" class="itinerary-node">
              <div class="node-badge">Day {{ item.dayNumber }}</div>
              <div class="node-card">
                <div class="time-loc-row">
                  <span class="node-time">⏰ {{ item.timeString }}</span>
                  <span class="node-loc" *ngIf="item.location">📍 {{ item.location }}</span>
                </div>
                <strong class="node-activity">{{ item.activity }}</strong>
              </div>
            </div>

            <div *ngIf="!trip()?.itinerary?.length" class="empty-itinerary">
              Comprehensive schedule provided upon booking confirmation.
            </div>
          </div>
        </div>

        <!-- Booking CTA Footer -->
        <div class="cta-banner">
          <div>
            <h2>Ready to book your next adventure?</h2>
            <p>Direct bookings are supported with fast WhatsApp confirmation & seat reservation.</p>
          </div>
          <button class="btn btn-primary btn-lg" (click)="openBookingInquiry()">
            Book Your Seats Now →
          </button>
        </div>
      </main>
    </div>

    <ng-template #loadingOrNotFound>
      <div class="loading-or-error">
        <div class="err-box" *ngIf="errorMessage; else loadingTpl">
          <span class="err-icon">🔒</span>
          <h2>Trip Not Found or Private</h2>
          <p>{{ errorMessage }}</p>
          <a routerLink="/dashboard" class="btn btn-secondary" style="margin-top: 14px;">Return to Home</a>
        </div>
        <ng-template #loadingTpl>
          <p>Loading tour package details...</p>
        </ng-template>
      </div>
    </ng-template>
  `,
  styles: [`
    .public-trip-page {
      min-height: 100vh;
      background: #0d0d12;
      color: #fff;
    }

    .public-nav {
      height: 70px;
      background: #14141c;
      border-bottom: 1px solid #232332;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      height: 100%;
      padding: 0 24px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-names {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
    }

    .brand-tagline {
      font-size: 0.72rem;
      color: #38bdf8;
    }

    .showcase-content {
      max-width: 1100px;
      margin: 36px auto 60px;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .hero-card {
      background: #15151e;
      border: 1px solid #262638;
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .hero-image-box {
      width: 100%;
      height: 380px;
      background: #1c1c28;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-image-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder-hero {
      font-size: 4rem;
    }

    .hero-details {
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .category-code-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .trip-code {
      color: var(--text-muted);
      font-size: 0.86rem;
      font-weight: 600;
    }

    .tour-title {
      font-size: 2.2rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
    }

    .tour-highlights-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      background: #1b1b26;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 18px;
    }

    .highlight-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .h-icon {
      font-size: 1.5rem;
    }

    .h-label {
      font-size: 0.74rem;
      color: var(--text-muted);
      display: block;
    }

    .highlight-item strong {
      font-size: 0.88rem;
      color: #fff;
    }

    .tour-description {
      font-size: 0.95rem;
      color: #c4c4d6;
      line-height: 1.6;
    }

    .package-details-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .pricing-card, .seats-card {
      background: #15151e;
      border: 1px solid #262638;
      border-radius: var(--radius-md);
      padding: 24px;
    }

    .card-heading {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 18px;
      border-bottom: 1px solid #222232;
      padding-bottom: 10px;
    }

    .price-tags-grid {
      display: flex;
      gap: 20px;
    }

    .price-tag-box {
      background: #1c1c28;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .pt-label {
      font-size: 0.76rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .pt-val {
      font-size: 1.8rem;
      color: var(--primary);
    }

    .pt-sub {
      font-size: 0.74rem;
      color: var(--text-dim);
    }

    .seats-meter {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .seats-stats {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }

    .seats-progress {
      height: 8px;
      background: #252538;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: #10b981;
      border-radius: var(--radius-full);
    }

    .total-seats-hint {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .itinerary-section {
      background: #15151e;
      border: 1px solid #262638;
      border-radius: var(--radius-md);
      padding: 28px;
    }

    .section-heading {
      font-size: 1.3rem;
      font-weight: 800;
      margin-bottom: 24px;
    }

    .itinerary-timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .itinerary-node {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .node-badge {
      background: var(--primary);
      color: #fff;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      min-width: 65px;
      text-align: center;
    }

    .node-card {
      background: #1c1c28;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 14px 18px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .time-loc-row {
      display: flex;
      gap: 14px;
      font-size: 0.78rem;
      color: #38bdf8;
    }

    .node-activity {
      font-size: 0.92rem;
      color: #fff;
    }

    .cta-banner {
      background: linear-gradient(135deg, #221310 0%, #151520 100%);
      border: 1px solid #4a1f18;
      border-radius: var(--radius-md);
      padding: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cta-banner h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
    }

    .cta-banner p {
      font-size: 0.88rem;
      color: #c4c4d6;
    }

    .btn-lg {
      padding: 12px 24px;
      font-size: 0.95rem;
    }

    .loading-or-error {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
    }

    .err-box {
      background: #171722;
      border: 1px solid #2b2b3e;
      border-radius: var(--radius-md);
      padding: 40px;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .err-icon {
      font-size: 3rem;
    }
  `]
})
export class PublicTripComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  trip = signal<PublicTrip | null>(null);
  errorMessage = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadTrip(slug);
      }
    });
  }

  loadTrip(slug: string) {
    this.api.getPublicTrip(slug).subscribe({
      next: data => this.trip.set(data),
      error: err => {
        this.errorMessage = err.error?.message || 'The requested tour package could not be retrieved.';
      }
    });
  }

  calcSeatPercentage(): number {
    const t = this.trip();
    if (!t || t.totalSeats === 0) return 0;
    return Math.min(100, Math.round(((t.totalSeats - t.availableSeats) / t.totalSeats) * 100));
  }

  openBookingInquiry() {
    const t = this.trip();
    alert(`Thank you for your interest in "${t?.name}"!\nPlease contact ${t?.companyName} at bookings@v4journey.com or +91 9442892326.`);
  }
}

