import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { TripListItem, PagedResult } from '../../models/models';

@Component({
  selector: 'app-trips-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="trips-container">
      <!-- Main Content Area -->
      <div class="trips-main">
        <!-- Header -->
        <div class="list-header">
          <div>
            <h1 class="title">Trips List</h1>
            <p class="subtitle">{{ totalCount() }} trips are created by this year</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-export" (click)="exportTrips()">
              <span class="v-icon">V</span> Export
            </button>
            <a routerLink="/trips/create" class="btn btn-primary">+ Create Trip</a>
          </div>
        </div>

        <!-- Layout: Filter Sidebar + Table -->
        <div class="layout-body">
          <!-- Filter Sidebar -->
          <aside class="filter-panel">
            <div class="filter-header">
              <span class="filter-title">Filter</span>
              <button class="btn-reset" (click)="resetFilters()">Reset</button>
            </div>

            <!-- Trip Status Filter -->
            <div class="filter-group">
              <label>Trip status</label>
              <select [(ngModel)]="selectedStatus" (change)="applyFilters()">
                <option value="All">All</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            <!-- Trip ID Filter -->
            <div class="filter-group">
              <label>Trip ID</label>
              <input
                type="text"
                placeholder="Search by trip ID"
                [(ngModel)]="searchTripId"
                (input)="onSearchInput()"
              />
            </div>

            <!-- Trip Name Filter -->
            <div class="filter-group">
              <label>Trip Name</label>
              <input
                type="text"
                placeholder="Search by trip name"
                [(ngModel)]="searchTripName"
                (input)="onSearchInput()"
              />
            </div>

            <!-- Category Filter -->
            <div class="filter-group">
              <label>Trip Category</label>
              <select [(ngModel)]="selectedCategory" (change)="applyFilters()">
                <option value="All">All</option>
                <option value="Family Trip">Family Trip</option>
                <option value="Honeymoon">Honeymoon</option>
                <option value="Couple">Couple</option>
                <option value="Adventure">Adventure</option>
              </select>
            </div>
          </aside>

          <!-- Table Container -->
          <div class="table-wrapper">
            <!-- Bulk Action Bar -->
            <div class="bulk-bar" *ngIf="selectedTripIds.size > 0">
              <span>{{ selectedTripIds.size }} trips selected</span>
              <div class="bulk-actions">
                <button class="btn btn-secondary btn-sm" (click)="bulkUpdateStatus('Active')">Mark Active</button>
                <button class="btn btn-secondary btn-sm" (click)="bulkUpdateStatus('Completed')">Mark Completed</button>
                <button class="btn btn-danger btn-sm" (click)="bulkArchive()">Archive Selected</button>
              </div>
            </div>

            <table class="figma-table">
              <thead>
                <tr>
                  <th class="th-check">
                    <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()" />
                  </th>
                  <th>Trip ID</th>
                  <th>Trip Name</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Trip period</th>
                  <th>Days</th>
                  <th>Last booking date</th>
                  <th>Trip status</th>
                  <th colspan="3" class="th-group th-seats">
                    <div class="group-title">Seats</div>
                    <div class="sub-headers">
                      <span>Total</span>
                      <span>Available</span>
                      <span>Booked</span>
                    </div>
                  </th>
                  <th colspan="2" class="th-group th-amount">
                    <div class="group-title">Amount</div>
                    <div class="sub-headers">
                      <span>/ Adult</span>
                      <span>/ Child</span>
                    </div>
                  </th>
                  <th class="th-actions"></th>
                </tr>
              </thead>

              <tbody>
                <tr *ngFor="let trip of trips()" [class.selected]="selectedTripIds.has(trip.id)">
                  <td class="td-check">
                    <input
                      type="checkbox"
                      [checked]="selectedTripIds.has(trip.id)"
                      (change)="toggleSelectRow(trip.id)"
                    />
                  </td>
                  <td class="td-code" (click)="viewTrip(trip.id)">{{ trip.tripCode }}</td>
                  <td class="td-name" (click)="viewTrip(trip.id)" title="{{ trip.name }}">
                    <span class="name-text">{{ trip.name }}</span>
                    <span *ngIf="trip.isPublished" class="published-dot" title="Publicly Published">🌐</span>
                  </td>
                  <td class="td-location">{{ trip.location }}</td>
                  <td class="td-category">{{ trip.category }}</td>
                  <td class="td-period">{{ trip.tripPeriod }}</td>
                  <td class="td-days">{{ trip.days }}</td>
                  <td class="td-date">{{ trip.lastBookingDate }}</td>
                  <td>
                    <span class="badge" [ngClass]="'badge-' + trip.tripStatus.toLowerCase()">
                      {{ trip.tripStatus }}
                    </span>
                  </td>
                  <!-- Seats Sub-columns -->
                  <td class="td-num">{{ trip.totalSeats }}</td>
                  <td class="td-num available">{{ trip.availableSeats }}</td>
                  <td class="td-num">{{ trip.bookedSeats }}</td>
                  <!-- Amount Sub-columns -->
                  <td class="td-num">₹{{ trip.adultPrice | number }}</td>
                  <td class="td-num">{{ trip.childPrice > 0 ? ('₹' + (trip.childPrice | number)) : '-' }}</td>
                  <!-- Row Action Menu -->
                  <td class="td-actions">
                    <div class="menu-container">
                      <button class="btn-dots" (click)="toggleRowMenu(trip.id, $event)">⋮</button>
                      
                      <div class="action-dropdown" *ngIf="activeMenuId() === trip.id">
                        <button (click)="viewTrip(trip.id)">👁 View Details</button>
                        <button (click)="editTrip(trip.id)">✎ Edit Trip</button>
                        <button (click)="duplicateTrip(trip.id)">⎘ Duplicate</button>
                        <button *ngIf="!trip.isPublished" (click)="publishTrip(trip.id)">🌐 Publish / Share</button>
                        <button *ngIf="trip.isPublished" (click)="openPublicPage(trip.publicSlug)">🔗 View Public Page</button>
                        <button (click)="changeStatus(trip.id)">🔄 Change Status</button>
                        <button class="delete-btn" (click)="deleteTrip(trip.id)">🗑 Archive</button>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="trips().length === 0 && !loading()">
                  <td colspan="15" class="empty-cell">
                    <div class="empty-state">
                      <span class="empty-icon">🗺️</span>
                      <h3>No trips found</h3>
                      <p>Try resetting filters or create a new trip to get started.</p>
                      <a routerLink="/trips/create" class="btn btn-primary" style="margin-top: 14px;">+ Create Trip</a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination Bar -->
            <div class="pagination-bar" *ngIf="totalPages() > 1">
              <span class="page-info">Showing page {{ currentPage() }} of {{ totalPages() }}</span>
              <div class="pagination-buttons">
                <button
                  class="btn btn-secondary btn-sm"
                  [disabled]="currentPage() === 1"
                  (click)="changePage(currentPage() - 1)"
                >
                  Previous
                </button>
                <button
                  class="btn btn-secondary btn-sm"
                  [disabled]="currentPage() === totalPages()"
                  (click)="changePage(currentPage() + 1)"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .trips-container {
      padding: 24px 28px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #fff;
    }

    .subtitle {
      font-size: 0.84rem;
      color: var(--text-muted);
      margin-top: 3px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-export {
      border: 1px solid #ff4500;
      color: #ff4500;
      background: transparent;
      padding: 7px 16px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-export:hover {
      background: rgba(255, 69, 0, 0.1);
    }

    .v-icon {
      font-weight: 900;
      color: #ff4500;
    }

    .layout-body {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    /* Filter Sidebar matching Figma */
    .filter-panel {
      width: 240px;
      background: #14141a;
      border: 1px solid #232330;
      border-radius: var(--radius-md);
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      flex-shrink: 0;
    }

    .filter-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #232330;
      padding-bottom: 12px;
    }

    .filter-title {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
    }

    .btn-reset {
      font-size: 0.82rem;
      font-weight: 600;
      color: #3b82f6;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-group label {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .filter-group select, .filter-group input {
      background: #191924;
      border: 1px solid #262638;
      border-radius: var(--radius-sm);
      padding: 9px 12px;
      font-size: 0.84rem;
      color: #fff;
    }

    /* Table Container */
    .table-wrapper {
      flex: 1;
      background: #14141a;
      border: 1px solid #232330;
      border-radius: var(--radius-md);
      overflow-x: auto;
      display: flex;
      flex-direction: column;
    }

    .bulk-bar {
      background: #1e1e2d;
      padding: 10px 18px;
      border-bottom: 1px solid #2d2d42;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.86rem;
      font-weight: 600;
      color: #fff;
    }

    .bulk-actions {
      display: flex;
      gap: 8px;
    }

    .btn-sm {
      padding: 5px 12px;
      font-size: 0.78rem;
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
      white-space: nowrap;
    }

    .th-group {
      text-align: center;
      padding: 6px 14px !important;
      border-left: 1px solid #232330;
      border-right: 1px solid #232330;
    }

    .group-title {
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .sub-headers {
      display: flex;
      justify-content: space-around;
      gap: 16px;
      font-size: 0.76rem;
      color: #6d6d84;
    }

    .figma-table td {
      padding: 14px;
      border-bottom: 1px solid #1c1c28;
      color: #d8d8e6;
      white-space: nowrap;
    }

    .figma-table tr:hover {
      background: #1a1a24;
    }

    .figma-table tr.selected {
      background: #1e1e2c;
    }

    .td-code {
      font-weight: 600;
      color: #fff;
      cursor: pointer;
    }

    .td-code:hover {
      color: var(--primary);
    }

    .td-name {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 180px;
    }

    .name-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
      color: #fff;
    }

    .published-dot {
      font-size: 0.8rem;
    }

    .td-num {
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .td-num.available {
      color: #34d399;
      font-weight: 600;
    }

    .menu-container {
      position: relative;
    }

    .btn-dots {
      padding: 4px 8px;
      font-size: 1.1rem;
      color: #8b8b9f;
      border-radius: var(--radius-sm);
    }

    .btn-dots:hover {
      background: #252535;
      color: #fff;
    }

    .action-dropdown {
      position: absolute;
      top: 28px;
      right: 0;
      background: #191924;
      border: 1px solid #28283a;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
      width: 170px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      z-index: 50;
      animation: fadeIn 0.15s ease;
    }

    .action-dropdown button {
      text-align: left;
      padding: 8px 12px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #c4c4d6;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-dropdown button:hover {
      background: #252536;
      color: #fff;
    }

    .action-dropdown button.delete-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .empty-cell {
      padding: 60px 20px;
      text-align: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-icon {
      font-size: 2.2rem;
      margin-bottom: 6px;
    }

    .empty-state h3 {
      font-size: 1.1rem;
      color: #fff;
    }

    .empty-state p {
      color: var(--text-muted);
      font-size: 0.84rem;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-top: 1px solid #232330;
      font-size: 0.84rem;
      color: var(--text-muted);
    }

    .pagination-buttons {
      display: flex;
      gap: 8px;
    }
  `]
})
export class TripsListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  trips = signal<TripListItem[]>([]);
  totalCount = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  loading = signal(false);

  // Filters
  selectedStatus = 'All';
  searchTripId = '';
  searchTripName = '';
  selectedCategory = 'All';

  // Selection
  selectedTripIds = new Set<string>();
  activeMenuId = signal<string | null>(null);

  private searchTimeout: any;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.selectedStatus = params['status'];
      }
      this.loadTrips();
    });
  }

  loadTrips() {
    this.loading.set(true);
    this.api.getTrips({
      status: this.selectedStatus,
      tripId: this.searchTripId,
      tripName: this.searchTripName,
      category: this.selectedCategory,
      page: this.currentPage(),
      pageSize: 10
    }).subscribe({
      next: res => {
        this.trips.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadTrips();
  }

  onSearchInput() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  resetFilters() {
    this.selectedStatus = 'All';
    this.searchTripId = '';
    this.searchTripName = '';
    this.selectedCategory = 'All';
    this.applyFilters();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadTrips();
  }

  viewTrip(id: string) {
    this.router.navigate(['/trips', id]);
  }

  editTrip(id: string) {
    this.router.navigate(['/trips', id, 'edit']);
  }

  duplicateTrip(id: string) {
    this.api.duplicateTrip(id).subscribe({
      next: res => {
        this.toast.success(res.message);
        this.loadTrips();
      }
    });
  }

  publishTrip(id: string) {
    this.api.publishTrip(id).subscribe({
      next: res => {
        this.toast.success('Trip published! Public link is active.');
        this.loadTrips();
      }
    });
  }

  openPublicPage(slug?: string) {
    if (slug) {
      window.open(`/public/trips/${slug}`, '_blank');
    }
  }

  changeStatus(id: string) {
    const newStatus = prompt('Enter new status (Upcoming, Active, Completed, Draft, Canceled):', 'Active');
    if (newStatus) {
      this.api.updateTripStatus(id, newStatus).subscribe({
        next: () => {
          this.toast.success('Status updated.');
          this.loadTrips();
        }
      });
    }
  }

  deleteTrip(id: string) {
    if (confirm('Are you sure you want to archive this trip?')) {
      this.api.deleteTrip(id).subscribe({
        next: () => {
          this.toast.success('Trip archived.');
          this.loadTrips();
        }
      });
    }
  }

  exportTrips() {
    window.open(this.api.getTripsExportUrl(), '_blank');
  }

  // Row selection
  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedTripIds.clear();
    } else {
      this.trips().forEach(t => this.selectedTripIds.add(t.id));
    }
  }

  isAllSelected(): boolean {
    return this.trips().length > 0 && this.selectedTripIds.size === this.trips().length;
  }

  toggleSelectRow(id: string) {
    if (this.selectedTripIds.has(id)) {
      this.selectedTripIds.delete(id);
    } else {
      this.selectedTripIds.add(id);
    }
  }

  bulkUpdateStatus(status: string) {
    let count = 0;
    this.selectedTripIds.forEach(id => {
      this.api.updateTripStatus(id, status).subscribe({
        next: () => {
          count++;
          if (count === this.selectedTripIds.size) {
            this.toast.success(`Updated ${count} trips to ${status}.`);
            this.selectedTripIds.clear();
            this.loadTrips();
          }
        }
      });
    });
  }

  bulkArchive() {
    if (confirm(`Archive ${this.selectedTripIds.size} selected trips?`)) {
      let count = 0;
      this.selectedTripIds.forEach(id => {
        this.api.deleteTrip(id).subscribe({
          next: () => {
            count++;
            if (count === this.selectedTripIds.size) {
              this.toast.success(`Archived ${count} trips.`);
              this.selectedTripIds.clear();
              this.loadTrips();
            }
          }
        });
      });
    }
  }

  toggleRowMenu(id: string, event: Event) {
    event.stopPropagation();
    if (this.activeMenuId() === id) {
      this.activeMenuId.set(null);
    } else {
      this.activeMenuId.set(id);
    }
  }
}

