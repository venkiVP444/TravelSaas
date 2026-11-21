import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { TripDetail, MemberItem, ResourceItem } from '../../models/models';

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="trip-details-page" *ngIf="trip(); else loadingTpl">
      <!-- Top Header Navigation -->
      <div class="details-header">
        <div class="header-left">
          <a routerLink="/trips" class="back-btn">←</a>
          <div>
            <h1 class="page-title">Trip Details</h1>
            <p class="page-subtitle">Here you can see all details about this trip</p>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary" (click)="openPublishModal()">
            <span *ngIf="trip()?.isPublished">🌐 Share Public Link</span>
            <span *ngIf="!trip()?.isPublished">🌐 Publish Trip</span>
          </button>
          <button class="btn btn-secondary" (click)="editTrip()">✎ Edit</button>
          <a routerLink="/trips/create" class="btn btn-primary">+ Create Trip</a>
        </div>
      </div>

      <!-- Main Layout: Left Hero & Timeline + Right Metrics & Tables -->
      <div class="details-body">
        <!-- Left Column: Overview, Hero Image & Journey Timeline -->
        <div class="left-col">
          <div class="hero-card">
            <div class="hero-image-box">
              <img *ngIf="trip()?.thumbnailUrl" [src]="trip()?.thumbnailUrl" alt="Thumbnail" />
              <div *ngIf="!trip()?.thumbnailUrl" class="placeholder-img">
                <span>🌄</span>
              </div>
            </div>

            <div class="hero-meta">
              <div class="code-category-row">
                <span class="trip-code">( {{ trip()?.tripCode }} )</span>
                <span class="trip-category">{{ trip()?.category }}</span>
                <span class="badge" [ngClass]="'badge-' + trip()?.status?.toLowerCase()">
                  {{ trip()?.status }}
                </span>
              </div>

              <h2 class="trip-title">{{ trip()?.name }}</h2>

              <div class="trip-dates-row">
                <span>{{ trip()?.startDateTime | date:'dd MMM yyyy' }} - {{ trip()?.endDateTime | date:'dd MMM yyyy' }}</span>
                <span class="duration-tag">{{ trip()?.duration }}</span>
              </div>

              <p class="trip-desc" *ngIf="trip()?.description">
                {{ trip()?.description }}
              </p>
            </div>

            <!-- Trip Journey Progress -->
            <div class="journey-progress-box">
              <div class="progress-labels">
                <span class="progress-title">Trip Journey</span>
                <span class="progress-pct">{{ progressPercent() }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="progressPercent()"></div>
              </div>
            </div>

            <!-- Vertical Timeline / Itinerary -->
            <div class="timeline-box">
              <h3 class="timeline-title">Journey Schedule</h3>

              <div class="timeline-tree">
                <div *ngFor="let sched of trip()?.schedules; let idx = index" class="timeline-node">
                  <div class="node-marker">
                    <span class="marker-dot"></span>
                    <span class="marker-line" *ngIf="idx < (trip()?.schedules?.length || 0) - 1"></span>
                  </div>
                  <div class="node-content">
                    <span class="node-time">Day {{ sched.dayNumber }} • {{ sched.timeString }}</span>
                    <strong class="node-act">{{ sched.activity }}</strong>
                    <span class="node-loc" *ngIf="sched.location">📍 {{ sched.location }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Metrics & Dynamic Tables -->
        <div class="right-col">
          <!-- Top Horizontal Metrics Bar matching Figma -->
          <div class="summary-bar">
            <div class="metric-item">
              <span class="lbl">Pickup and Drop</span>
              <strong class="val">{{ trip()?.pickupDrop }}</strong>
            </div>
            <div class="metric-item">
              <span class="lbl">Created Date</span>
              <strong class="val">{{ trip()?.createdAt | date:'dd MMM yyyy' }}</strong>
            </div>
            <div class="metric-item">
              <span class="lbl">Publish Date</span>
              <strong class="val">{{ trip()?.publishedAt ? (trip()?.publishedAt | date:'dd MMM yyyy') : 'Unpublished' }}</strong>
            </div>
            <div class="metric-item">
              <span class="lbl">Last Booking Date</span>
              <strong class="val">{{ trip()?.startDateTime | date:'dd MMM yyyy' }}</strong>
            </div>
            <div class="metric-item">
              <span class="lbl">Total Seats</span>
              <strong class="val">{{ trip()?.totalSeats }}</strong>
            </div>
            <div class="metric-item">
              <span class="lbl">Booked</span>
              <strong class="val text-primary">{{ trip()?.bookedSeats }}</strong>
            </div>
            <div class="metric-item">
              <span class="lbl">Not Booked</span>
              <strong class="val text-success">{{ trip()?.availableSeats }}</strong>
            </div>
          </div>

          <!-- Secondary Metric Cards Row matching Figma -->
          <div class="metrics-cards-row">
            <div class="m-card">
              <span class="m-lbl">Booked Travelers</span>
              <strong class="m-val">{{ trip()?.bookedSeats }} (M 18 / W 12 / C 5)</strong>
            </div>
            <div class="m-card">
              <span class="m-lbl">Food Info</span>
              <strong class="m-val">{{ trip()?.foodInfo }}</strong>
            </div>
            <div class="m-card">
              <span class="m-lbl">Price /Adult</span>
              <strong class="m-val">₹{{ trip()?.adultPrice | number }}</strong>
            </div>
            <div class="m-card">
              <span class="m-lbl">Price /Child</span>
              <strong class="m-val">₹{{ trip()?.childPrice | number }}</strong>
            </div>
            <div class="m-card financial-card">
              <div class="fin-header">
                <span class="m-lbl">Income</span>
                <button class="eye-btn" (click)="toggleFinVisibility()">👁</button>
              </div>
              <strong class="m-val text-success">
                {{ showFinancials ? ('₹' + (trip()?.totalIncome | number)) : '******' }}
              </strong>
            </div>
            <div class="m-card financial-card">
              <div class="fin-header">
                <span class="m-lbl">Expenses</span>
              </div>
              <strong class="m-val text-warning">
                {{ showFinancials ? ('₹' + (trip()?.totalExpenses | number)) : '******' }}
              </strong>
            </div>
            <div class="m-card financial-card">
              <div class="fin-header">
                <span class="m-lbl">Profit</span>
              </div>
              <strong class="m-val text-primary">
                {{ showFinancials ? ('₹' + (trip()?.totalProfit | number)) : '*****' }}
              </strong>
            </div>
          </div>

          <!-- Functional Tab Bar -->
          <div class="tab-bar">
            <button [class.active]="activeTab === 'team'" (click)="activeTab = 'team'">
              Team Members ({{ trip()?.teamMembers?.length }})
            </button>
            <button [class.active]="activeTab === 'travellers'" (click)="activeTab = 'travellers'">
              Traveller Details ({{ trip()?.travellers?.length }})
            </button>
            <button [class.active]="activeTab === 'resources'" (click)="activeTab = 'resources'">
              Allocated Resources ({{ trip()?.resources?.length }})
            </button>
          </div>

          <!-- Tab 1: Team Members Detail Table -->
          <div class="table-section" *ngIf="activeTab === 'team'">
            <div class="table-header-flex">
              <h3 class="table-heading">Team Members Detail</h3>
              <button class="btn btn-outline-primary btn-sm" (click)="openAssignTeamModal()">
                + Assign Team Member
              </button>
            </div>

            <table class="figma-table">
              <thead>
                <tr>
                  <th class="th-check"><input type="checkbox" /></th>
                  <th>Member ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Age/Gender</th>
                  <th>License No.</th>
                  <th>Work Type</th>
                  <th>Food Info</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tm of trip()?.teamMembers">
                  <td class="td-check"><input type="checkbox" /></td>
                  <td class="td-code">{{ tm.memberCode }}</td>
                  <td class="td-name">{{ tm.name }}</td>
                  <td>{{ tm.contact }}</td>
                  <td><span class="role-pill">{{ tm.role }}</span></td>
                  <td>{{ tm.ageGender }}</td>
                  <td>{{ tm.licenseNo || '-' }}</td>
                  <td>{{ tm.workType }}</td>
                  <td>{{ tm.foodInfo }}</td>
                  <td>
                    <a [routerLink]="['/team', tm.memberId]" class="link-view">View</a>
                  </td>
                </tr>
                <tr *ngIf="!trip()?.teamMembers?.length">
                  <td colspan="10" class="empty-cell">No team members assigned to this trip yet.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tab 2: Traveller Details Table -->
          <div class="table-section" *ngIf="activeTab === 'travellers'">
            <div class="table-header-flex">
              <h3 class="table-heading">Traveller Details</h3>
              <button class="btn btn-outline-primary btn-sm" (click)="openAddTravellerModal()">
                + Add Traveller
              </button>
            </div>

            <table class="figma-table">
              <thead>
                <tr>
                  <th class="th-check"><input type="checkbox" /></th>
                  <th>Traveller Name</th>
                  <th>Age / Gender</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Pickup Location</th>
                  <th>Drop Location</th>
                  <th>Payment Status</th>
                  <th>Paid Amount</th>
                  <th>Balance</th>
                  <th>Food Info</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tr of trip()?.travellers">
                  <td class="td-check"><input type="checkbox" /></td>
                  <td class="td-name">{{ tr.travellerName }}</td>
                  <td>{{ tr.ageGender }}</td>
                  <td>{{ tr.contact }}</td>
                  <td><span class="type-pill">{{ tr.type }}</span></td>
                  <td>{{ tr.pickupLocation || '-' }}</td>
                  <td>{{ tr.dropLocation || '-' }}</td>
                  <td>
                    <span class="badge" [ngClass]="'badge-' + tr.paymentStatus.toLowerCase()">
                      {{ tr.paymentStatus }}
                    </span>
                  </td>
                  <td>₹{{ tr.paidAmount | number }}</td>
                  <td>₹{{ tr.balanceAmount | number }}</td>
                  <td>{{ tr.foodInfo }}</td>
                </tr>
                <tr *ngIf="!trip()?.travellers?.length">
                  <td colspan="11" class="empty-cell">No travellers registered yet.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tab 3: Allocated Resources Table -->
          <div class="table-section" *ngIf="activeTab === 'resources'">
            <div class="table-header-flex">
              <h3 class="table-heading">Allocated Vehicles, Hotels & Partners</h3>
              <button class="btn btn-outline-primary btn-sm" (click)="openAssignResourceModal()">
                + Allocate Resource
              </button>
            </div>

            <table class="figma-table">
              <thead>
                <tr>
                  <th>Resource Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Ownership</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let res of trip()?.resources">
                  <td class="td-code">{{ res.resourceCode }}</td>
                  <td class="td-name">{{ res.name }}</td>
                  <td>{{ res.resourceType }}</td>
                  <td>
                    <span class="badge" [ngClass]="'badge-' + res.ownership.toLowerCase()">
                      {{ res.ownership }}
                    </span>
                  </td>
                  <td>{{ res.notes || '-' }}</td>
                </tr>
                <tr *ngIf="!trip()?.resources?.length">
                  <td colspan="5" class="empty-cell">No resources allocated to this trip yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Publish Modal -->
      <div class="modal-backdrop" *ngIf="showPublishModal" (click)="showPublishModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Publish & Share Trip</h3>
            <button class="close-x" (click)="showPublishModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-info">
              Publishing generates an official, secure public landing page for travelers. Internal financials and confidential team payroll are stripped.
            </p>

            <div class="slug-box" *ngIf="trip()?.publicSlug">
              <label>Public Share URL:</label>
              <div class="copy-field">
                <input type="text" readonly [value]="getPublicUrl()" />
                <button class="btn btn-secondary btn-sm" (click)="copyPublicUrl()">Copy</button>
              </div>
            </div>

            <div class="publish-status-row">
              <span>Status:</span>
              <strong [class.text-success]="trip()?.isPublished" [class.text-warning]="!trip()?.isPublished">
                {{ trip()?.isPublished ? '● Published Online' : '○ Draft / Private' }}
              </strong>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" *ngIf="trip()?.isPublished" (click)="unpublishTrip()">Unpublish</button>
            <button class="btn btn-primary" *ngIf="!trip()?.isPublished" (click)="publishTrip()">Publish Now</button>
            <button class="btn btn-outline-primary" *ngIf="trip()?.isPublished" (click)="viewPublicPage()">Open Page →</button>
          </div>
        </div>
      </div>

      <!-- Add Traveller Modal -->
      <div class="modal-backdrop" *ngIf="showTravellerModal" (click)="showTravellerModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Traveller</h3>
            <button class="close-x" (click)="showTravellerModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label>Traveller Name <span class="req">*</span></label>
              <input type="text" [(ngModel)]="newTravellerName" placeholder="Full name" />
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Age & Gender</label>
                <input type="text" [(ngModel)]="newTravellerAgeGender" placeholder="e.g. 32 / Male" />
              </div>
              <div class="form-field">
                <label>Contact Phone</label>
                <input type="text" [(ngModel)]="newTravellerContact" placeholder="+91 9876543210" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Pickup Location</label>
                <input type="text" [(ngModel)]="newTravellerPickup" placeholder="Pickup spot" />
              </div>
              <div class="form-field">
                <label>Drop Location</label>
                <input type="text" [(ngModel)]="newTravellerDrop" placeholder="Drop spot" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Paid Amount (₹)</label>
                <input type="number" [(ngModel)]="newTravellerPaid" />
              </div>
              <div class="form-field">
                <label>Food Info</label>
                <select [(ngModel)]="newTravellerFood">
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Veg">Veg</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showTravellerModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="commitTraveller()">Save Traveller</button>
          </div>
        </div>
      </div>

      <!-- Assign Team Modal -->
      <div class="modal-backdrop" *ngIf="showTeamModal" (click)="showTeamModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Assign Team Member</h3>
            <button class="close-x" (click)="showTeamModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label>Select Team Member</label>
              <select [(ngModel)]="selectedMemberId">
                <option value="">- Select -</option>
                <option *ngFor="let m of availableMembers" [value]="m.id">
                  {{ m.fullName }} ({{ m.role }}) - {{ m.memberCode }}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label>Assigned Role on Trip</label>
              <input type="text" [(ngModel)]="assignedRole" placeholder="e.g. Primary Driver / Trip Guider" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showTeamModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="commitTeamAssignment()">Assign</button>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state">
        <p>Loading trip details...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .trip-details-page {
      padding: 24px 32px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .details-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: #181824;
      border: 1px solid #28283a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: #fff;
    }

    .back-btn:hover {
      background: #252538;
    }

    .page-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #fff;
    }

    .page-subtitle {
      font-size: 0.84rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .details-body {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 24px;
      align-items: flex-start;
    }

    /* Left Column */
    .hero-card {
      background: #14141c;
      border: 1px solid #232330;
      border-radius: var(--radius-md);
      overflow: hidden;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .hero-image-box {
      width: 100%;
      height: 190px;
      background: #1b1b26;
      border-radius: var(--radius-sm);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-image-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder-img {
      font-size: 3rem;
    }

    .code-category-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      margin-bottom: 8px;
    }

    .trip-code {
      color: var(--text-muted);
      font-weight: 600;
    }

    .trip-category {
      color: #38bdf8;
      font-weight: 600;
    }

    .trip-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.3;
      margin-bottom: 8px;
    }

    .trip-dates-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .duration-tag {
      background: #20202e;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      color: #fff;
      font-weight: 600;
    }

    .trip-desc {
      font-size: 0.82rem;
      color: #b0b0c4;
      line-height: 1.5;
    }

    .journey-progress-box {
      border-top: 1px solid #20202e;
      border-bottom: 1px solid #20202e;
      padding: 14px 0;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 6px;
    }

    .progress-track {
      height: 6px;
      background: #20202e;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      border-radius: var(--radius-full);
    }

    .timeline-title {
      font-size: 0.95rem;
      color: #fff;
      margin-bottom: 14px;
    }

    .timeline-tree {
      display: flex;
      flex-direction: column;
    }

    .timeline-node {
      display: flex;
      gap: 14px;
      position: relative;
      padding-bottom: 16px;
    }

    .node-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 14px;
    }

    .marker-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 6px var(--primary-glow);
    }

    .marker-line {
      flex: 1;
      width: 2px;
      background: #2a2a3e;
      margin-top: 4px;
    }

    .node-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .node-time {
      font-size: 0.74rem;
      color: var(--text-dim);
    }

    .node-act {
      font-size: 0.84rem;
      color: #fff;
    }

    .node-loc {
      font-size: 0.76rem;
      color: var(--text-muted);
    }

    /* Right Column */
    .right-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .summary-bar {
      background: #14141c;
      border: 1px solid #232330;
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .metric-item .lbl {
      font-size: 0.74rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .metric-item .val {
      font-size: 0.92rem;
      color: #fff;
    }

    .metrics-cards-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
    }

    .m-card {
      background: #14141c;
      border: 1px solid #232330;
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .m-lbl {
      font-size: 0.72rem;
      color: var(--text-dim);
      font-weight: 500;
    }

    .m-val {
      font-size: 0.9rem;
      color: #fff;
    }

    .financial-card .fin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .eye-btn {
      font-size: 0.8rem;
      color: var(--text-dim);
    }

    .tab-bar {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid #232330;
      padding-bottom: 2px;
    }

    .tab-bar button {
      padding: 10px 18px;
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 2px solid transparent;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    }

    .tab-bar button.active {
      color: #fff;
      border-bottom-color: var(--primary);
      background: #181824;
    }

    .table-section {
      background: #14141c;
      border: 1px solid #232330;
      border-radius: var(--radius-md);
      overflow-x: auto;
      padding: 18px;
    }

    .table-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .table-heading {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
    }

    .figma-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
      text-align: left;
    }

    .figma-table th {
      background: #171720;
      color: #8b8b9f;
      font-weight: 600;
      padding: 12px 14px;
      border-bottom: 1px solid #232330;
    }

    .figma-table td {
      padding: 13px 14px;
      border-bottom: 1px solid #1c1c28;
      color: #d8d8e6;
    }

    .role-pill, .type-pill {
      background: #1f1f2e;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.76rem;
      font-weight: 600;
      color: #38bdf8;
    }

    .link-view {
      color: #38bdf8;
      font-weight: 600;
      text-decoration: underline;
    }

    /* Modal */
    .modal-content {
      background: #181824;
      border: 1px solid #2d2d42;
      border-radius: var(--radius-md);
      width: 480px;
      padding: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .modal-header h3 {
      font-size: 1.15rem;
      color: #fff;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 20px;
    }

    .modal-info {
      font-size: 0.84rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .copy-field {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .loading-state {
      padding: 60px;
      text-align: center;
      color: var(--text-muted);
    }
  `]
})
export class TripDetailsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  trip = signal<TripDetail | null>(null);
  activeTab = 'team';
  showFinancials = false;

  // Publish Modal
  showPublishModal = false;

  // Add Traveller Modal
  showTravellerModal = false;
  newTravellerName = '';
  newTravellerAgeGender = '28 / Male';
  newTravellerContact = '';
  newTravellerPickup = '';
  newTravellerDrop = '';
  newTravellerPaid = 0;
  newTravellerFood = 'Non-Veg';

  // Assign Team Modal
  showTeamModal = false;
  availableMembers: MemberItem[] = [];
  selectedMemberId = '';
  assignedRole = 'Driver';

  // Assign Resource Modal
  showResourceModal = false;
  availableResources: ResourceItem[] = [];

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadTrip(params['id']);
      }
    });

    this.api.getMembers({}).subscribe(mems => this.availableMembers = mems);
  }

  loadTrip(id: string) {
    this.api.getTripById(id).subscribe({
      next: data => this.trip.set(data),
      error: () => this.router.navigate(['/trips'])
    });
  }

  progressPercent(): number {
    const t = this.trip();
    if (!t) return 0;
    if (t.status === 'Completed') return 100;
    if (t.status === 'Active') return 60;
    if (t.status === 'Upcoming') return 20;
    return 0;
  }

  toggleFinVisibility() {
    this.showFinancials = !this.showFinancials;
  }

  editTrip() {
    const t = this.trip();
    if (t) {
      this.router.navigate(['/trips', t.id, 'edit']);
    }
  }

  openPublishModal() {
    this.showPublishModal = true;
  }

  getPublicUrl(): string {
    const slug = this.trip()?.publicSlug;
    return slug ? `${window.location.origin}/public/trips/${slug}` : '';
  }

  copyPublicUrl() {
    const url = this.getPublicUrl();
    navigator.clipboard.writeText(url).then(() => {
      this.toast.success('Public link copied to clipboard!');
    });
  }

  viewPublicPage() {
    const slug = this.trip()?.publicSlug;
    if (slug) {
      window.open(`/public/trips/${slug}`, '_blank');
    }
  }

  publishTrip() {
    const t = this.trip();
    if (!t) return;
    this.api.publishTrip(t.id).subscribe({
      next: res => {
        this.toast.success('Trip successfully published!');
        this.loadTrip(t.id);
      }
    });
  }

  unpublishTrip() {
    const t = this.trip();
    if (!t) return;
    this.api.unpublishTrip(t.id).subscribe({
      next: () => {
        this.toast.success('Trip unpublished.');
        this.loadTrip(t.id);
      }
    });
  }

  openAddTravellerModal() {
    this.newTravellerName = '';
    this.newTravellerContact = '';
    this.newTravellerPaid = this.trip()?.adultPrice || 0;
    this.showTravellerModal = true;
  }

  commitTraveller() {
    const t = this.trip();
    if (!t || !this.newTravellerName.trim()) {
      this.toast.error('Traveller Name is required.');
      return;
    }

    const payload = {
      travellerName: this.newTravellerName,
      ageGender: this.newTravellerAgeGender,
      contact: this.newTravellerContact,
      type: 'Main',
      pickupLocation: this.newTravellerPickup,
      dropLocation: this.newTravellerDrop,
      paymentStatus: 'Paid',
      paidAmount: this.newTravellerPaid,
      balanceAmount: 0,
      foodInfo: this.newTravellerFood
    };

    this.api.addTraveller(t.id, payload).subscribe({
      next: () => {
        this.toast.success('Traveller added to trip.');
        this.showTravellerModal = false;
        this.loadTrip(t.id);
      }
    });
  }

  openAssignTeamModal() {
    this.selectedMemberId = '';
    this.showTeamModal = true;
  }

  commitTeamAssignment() {
    const t = this.trip();
    if (!t || !this.selectedMemberId) {
      this.toast.error('Please select a team member.');
      return;
    }

    const payload = {
      memberId: this.selectedMemberId,
      assignedRole: this.assignedRole
    };

    this.api.assignTeamMember(t.id, payload).subscribe({
      next: () => {
        this.toast.success('Team member assigned.');
        this.showTeamModal = false;
        this.loadTrip(t.id);
      }
    });
  }

  openAssignResourceModal() {
    this.api.getResources({ status: 'Available' }).subscribe(res => {
      this.availableResources = res.items;
      this.showResourceModal = true;
    });
  }
}

