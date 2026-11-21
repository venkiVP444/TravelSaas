import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { CustomField, MemberItem, ResourceItem } from '../../models/models';

interface EditableDay {
  id?: string;
  dayNumber: number;
  title: string;
  dayDate: string;
  items: EditableScheduleItem[];
}

interface EditableScheduleItem {
  id?: string;
  timeString: string;
  activity: string;
  description?: string;
  origin?: string;
  destination?: string;
  activityType: string;
  status: string;
  location?: string;
  notes?: string;
  assignedPersonResource?: string;
}

@Component({
  selector: 'app-create-trip',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="create-trip-page">
      <!-- Breadcrumb & Top Header -->
      <div class="page-header">
        <div class="header-left">
          <nav class="breadcrumb-nav">
            <a routerLink="/trips" class="crumb-link">Trips</a>
            <span class="crumb-sep">/</span>
            <span class="crumb-active">{{ isEditMode() ? 'Edit Trip' : 'Create Trip' }}</span>
          </nav>
          <div class="title-status-row">
            <h1 class="page-title">{{ isEditMode() ? 'Edit Trip' : 'Create Trip' }}</h1>
            <span class="status-badge" [ngClass]="'status-' + status.toLowerCase()">
              {{ status }}
            </span>
          </div>
          <p class="page-subtitle">Configure journey details, operational team & resource allocations, itinerary days, and pricing</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary" routerLink="/trips">Cancel</button>
          <button class="btn btn-secondary" (click)="saveTrip('Draft')">Save as Draft</button>
          <button class="btn btn-primary" (click)="saveTrip('Upcoming')">
            {{ isEditMode() ? 'Save Changes' : 'Publish Trip' }}
          </button>
        </div>
      </div>

      <!-- 3-Column Responsive SaaS Grid -->
      <div class="trip-grid">
        <!-- COLUMN 1: Core Journey Details -->
        <div class="grid-col">
          <div class="section-card">
            <div class="section-card-header">
              <span class="section-icon">📋</span>
              <h2 class="section-title">Trip Overview & Route</h2>
            </div>

            <div class="form-body">
              <div class="form-row">
                <div class="form-field flex-1">
                  <label>Trip ID / Code</label>
                  <input type="text" [(ngModel)]="tripCode" placeholder="#0010" />
                </div>
                <div class="form-field flex-2">
                  <label>Trip Name <span class="req">*</span></label>
                  <input type="text" [(ngModel)]="tripName" placeholder="e.g. Munnar Hill Station Tour" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Trip Status</label>
                  <select [(ngModel)]="status">
                    <option value="Draft">Draft</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Trip Category</label>
                  <select [(ngModel)]="category">
                    <option value="Family Trip">Family Trip</option>
                    <option value="Honeymoon">Honeymoon</option>
                    <option value="Couple">Couple</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
              </div>

              <!-- Route Planning -->
              <div class="form-row">
                <div class="form-field location-field">
                  <label>Origin Hub <span class="req">*</span></label>
                  <div class="input-icon-wrap">
                    <span class="input-icon">📍</span>
                    <input
                      type="text"
                      [(ngModel)]="origin"
                      placeholder="e.g. Tirunelveli, Kochi"
                      list="knownLocations"
                    />
                  </div>
                </div>
                <div class="form-field location-field">
                  <label>Destination Hub <span class="req">*</span></label>
                  <div class="input-icon-wrap">
                    <span class="input-icon">🏁</span>
                    <input
                      type="text"
                      [(ngModel)]="destination"
                      placeholder="e.g. Munnar, Ooty, Kodaikanal"
                      list="knownLocations"
                    />
                  </div>
                </div>
                <datalist id="knownLocations">
                  <option *ngFor="let loc of locationSuggestions" [value]="loc"></option>
                </datalist>
              </div>

              <div class="form-field">
                <label>Via Transit Route</label>
                <input type="text" [(ngModel)]="via" placeholder="e.g. Madurai - Theni Highway" />
              </div>

              <!-- Dates & Duration -->
              <div class="form-row">
                <div class="form-field">
                  <label>Start Date & Time <span class="req">*</span></label>
                  <input type="datetime-local" [(ngModel)]="startDateTime" (change)="onDatesChanged()" />
                </div>
                <div class="form-field">
                  <label>End Date & Time <span class="req">*</span></label>
                  <input type="datetime-local" [(ngModel)]="endDateTime" (change)="onDatesChanged()" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Duration</label>
                  <input type="text" [(ngModel)]="duration" placeholder="3D 2N" />
                </div>
                <div class="form-field">
                  <label>Total Passenger Seats</label>
                  <input type="number" [(ngModel)]="totalSeats" min="1" />
                </div>
              </div>

              <!-- Package Inclusions -->
              <div class="form-row">
                <div class="form-field">
                  <label>Food Package</label>
                  <select [(ngModel)]="foodInfo">
                    <option value="With Food and Snacks">With Food and Snacks</option>
                    <option value="Breakfast Included">Breakfast Included</option>
                    <option value="Without Food">Without Food</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Pickup & Drop Service</label>
                  <select [(ngModel)]="pickupDrop">
                    <option value="Available with extra charges">Available with extra charges</option>
                    <option value="Included in package">Included in package</option>
                    <option value="Direct reporting at spot">Direct reporting at spot</option>
                  </select>
                </div>
              </div>

              <!-- Thumbnail Upload -->
              <div class="form-field">
                <label>Trip Cover Image</label>
                <div class="upload-zone">
                  <input type="file" (change)="onFileSelected($event)" accept="image/*" />
                  <div class="thumb-preview" *ngIf="thumbnailUrl">
                    <img [src]="thumbnailUrl" alt="Thumbnail Preview" />
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div class="form-field">
                <label>Trip Highlights & Description</label>
                <textarea rows="3" [(ngModel)]="description" placeholder="Write an engaging overview for travelers..."></textarea>
              </div>

              <!-- Dynamic Custom Fields for Trip -->
              <div class="custom-fields-box" *ngIf="tripCustomFields.length > 0">
                <h3 class="custom-heading">Dynamic Trip Specifications</h3>
                <div class="form-row" *ngFor="let cf of tripCustomFields">
                  <div class="form-field full-width">
                    <label>{{ cf.fieldLabel }} <span class="req" *ngIf="cf.isRequired">*</span></label>
                    <input
                      *ngIf="cf.fieldType === 'text' || cf.fieldType === 'email' || cf.fieldType === 'url' || cf.fieldType === 'phone'"
                      type="text"
                      [(ngModel)]="customFieldValues[cf.fieldKey]"
                      [placeholder]="cf.defaultValue || ''"
                    />
                    <input
                      *ngIf="cf.fieldType === 'number' || cf.fieldType === 'currency'"
                      type="number"
                      [(ngModel)]="customFieldValues[cf.fieldKey]"
                      [placeholder]="cf.defaultValue || '0'"
                    />
                    <input
                      *ngIf="cf.fieldType === 'date'"
                      type="date"
                      [(ngModel)]="customFieldValues[cf.fieldKey]"
                    />
                    <select
                      *ngIf="cf.fieldType === 'select'"
                      [(ngModel)]="customFieldValues[cf.fieldKey]"
                    >
                      <option value="">-- Select option --</option>
                      <option *ngFor="let opt of parseOptions(cf.optionsJson)" [value]="opt">
                        {{ opt }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 2: Operations Allocation Center (Team & Resources) -->
        <div class="grid-col">
          <!-- Team Assignment Panel -->
          <div class="section-card">
            <div class="section-card-header">
              <div class="header-title-wrap">
                <span class="section-icon">👥</span>
                <h2 class="section-title">Assign Team Members</h2>
              </div>
              <span class="count-pill">{{ selectedMemberIds.length }} assigned</span>
            </div>

            <!-- Assigned Members Tray -->
            <div class="assigned-tray" *ngIf="selectedMemberIds.length > 0">
              <span class="tray-label">Assigned:</span>
              <div class="assigned-chips-wrap">
                <span *ngFor="let id of selectedMemberIds" class="assigned-chip">
                  <span class="chip-avatar">{{ getRoleIcon(getMemberRole(id)) }}</span>
                  <span class="chip-text">{{ getMemberName(id) }}</span>
                  <button type="button" class="chip-remove-btn" (click)="$event.stopPropagation(); toggleMemberSelection(id)">✕</button>
                </span>
              </div>
            </div>

            <!-- Team Search & Filter Controls -->
            <div class="allocation-filter-bar">
              <div class="filter-search-box">
                <span class="search-lens">🔍</span>
                <input
                  type="text"
                  placeholder="Filter members by name, code, contact..."
                  [(ngModel)]="memberSearchQuery"
                />
              </div>
              <div class="filter-pills-row">
                <button
                  type="button"
                  *ngFor="let r of ['All', 'Driver', 'Guider', 'Staff', 'Helper']"
                  class="filter-pill"
                  [class.active]="memberRoleFilter === r"
                  (click)="memberRoleFilter = r"
                >
                  {{ r }}
                </button>
              </div>
            </div>

            <!-- Interactive Team Members Cards List -->
            <div class="cards-scroll-box">
              <div
                *ngFor="let m of filteredMembers()"
                class="alloc-item-card"
                [class.selected]="isMemberSelected(m.id)"
                (click)="toggleMemberSelection(m.id)"
              >
                <div class="chk-wrap">
                  <span class="alloc-chk" [class.checked]="isMemberSelected(m.id)">
                    {{ isMemberSelected(m.id) ? '✓' : '' }}
                  </span>
                </div>
                <div class="alloc-avatar role-{{ m.role.toLowerCase() }}">
                  {{ getRoleIcon(m.role) }}
                </div>
                <div class="alloc-content">
                  <div class="alloc-header-line">
                    <span class="alloc-code">{{ m.memberCode }}</span>
                    <strong class="alloc-name">{{ m.fullName }}</strong>
                    <span class="role-badge" [ngClass]="'role-' + m.role.toLowerCase()">{{ m.role }}</span>
                  </div>
                  <div class="alloc-meta-line">
                    <span>📞 {{ m.mobileNo }}</span>
                    <span>• {{ m.gender || 'Staff' }}</span>
                    <span *ngIf="m.workType">• {{ m.workType }}</span>
                  </div>
                </div>
              </div>

              <div *ngIf="filteredMembers().length === 0" class="empty-alloc-msg">
                <span>👤</span>
                <p>No team members matching filter criteria</p>
              </div>
            </div>
          </div>

          <!-- Resource Allocation Panel -->
          <div class="section-card" style="margin-top: 20px;">
            <div class="section-card-header">
              <div class="header-title-wrap">
                <span class="section-icon">🚗</span>
                <h2 class="section-title">Allocate Resources</h2>
              </div>
              <span class="count-pill">{{ selectedResourceIds.length }} allocated</span>
            </div>

            <!-- Allocated Resources Tray -->
            <div class="assigned-tray" *ngIf="selectedResourceIds.length > 0">
              <span class="tray-label">Allocated:</span>
              <div class="assigned-chips-wrap">
                <span *ngFor="let id of selectedResourceIds" class="assigned-chip">
                  <span class="chip-avatar">{{ getResourceIcon(getResourceType(id)) }}</span>
                  <span class="chip-text">{{ getResourceName(id) }}</span>
                  <button type="button" class="chip-remove-btn" (click)="$event.stopPropagation(); toggleResourceSelection(id)">✕</button>
                </span>
              </div>
            </div>

            <!-- Resource Search & Filters -->
            <div class="allocation-filter-bar">
              <div class="filter-search-box">
                <span class="search-lens">🔍</span>
                <input
                  type="text"
                  placeholder="Filter resources by name, reg no, partner..."
                  [(ngModel)]="resourceSearchQuery"
                />
              </div>
              <div class="filter-pills-row">
                <button
                  type="button"
                  *ngFor="let t of ['All', 'Vehicles', 'Hotels', 'Restaurants', 'Lodges']"
                  class="filter-pill"
                  [class.active]="resourceTypeFilter === t"
                  (click)="resourceTypeFilter = t"
                >
                  {{ t }}
                </button>
                <select [(ngModel)]="resourceOwnershipFilter" class="ownership-select">
                  <option value="All">All Ownership</option>
                  <option value="Own">Own Fleet</option>
                  <option value="Partner">Partner Vendor</option>
                </select>
              </div>
            </div>

            <!-- Interactive Resource Cards List -->
            <div class="cards-scroll-box">
              <div
                *ngFor="let r of filteredResources()"
                class="alloc-item-card"
                [class.selected]="isResourceSelected(r.id)"
                (click)="toggleResourceSelection(r.id)"
              >
                <div class="chk-wrap">
                  <span class="alloc-chk" [class.checked]="isResourceSelected(r.id)">
                    {{ isResourceSelected(r.id) ? '✓' : '' }}
                  </span>
                </div>
                <div class="alloc-avatar res-type-icon">
                  {{ getResourceIcon(r.resourceTypeKey || r.resourceTypeName) }}
                </div>
                <div class="alloc-content">
                  <div class="alloc-header-line">
                    <span class="alloc-code">{{ r.code }}</span>
                    <strong class="alloc-name">{{ r.name }}</strong>
                    <span class="badge" [ngClass]="r.ownership === 'Own' ? 'badge-own' : 'badge-partner'">
                      {{ r.ownership }}
                    </span>
                  </div>
                  <div class="alloc-meta-line">
                    <span *ngIf="r.identificationNo">Reg: {{ r.identificationNo }}</span>
                    <span *ngIf="r.partnerName">• Vendor: {{ r.partnerName }}</span>
                    <span *ngIf="r.contactNo">📞 {{ r.contactNo }}</span>
                    <span class="badge" [ngClass]="'badge-' + r.status.toLowerCase()">{{ r.status }}</span>
                  </div>
                </div>
              </div>

              <div *ngIf="filteredResources().length === 0" class="empty-alloc-msg">
                <span>🚗</span>
                <p>No resources matching filter criteria</p>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 3: Itinerary Schedule & Commercial Pricing Engine -->
        <div class="grid-col">
          <!-- Itinerary Days Planner -->
          <div class="section-card">
            <div class="section-card-header">
              <div class="header-title-wrap">
                <span class="section-icon">🗓️</span>
                <h2 class="section-title">Itinerary Schedule</h2>
              </div>
              <button type="button" class="btn btn-outline-primary btn-sm" (click)="addItineraryDay()">+ Add Day</button>
            </div>

            <div class="itinerary-days-list">
              <div *ngFor="let day of itineraryDays; let dIndex = index" class="day-card">
                <!-- Day Header -->
                <div class="day-header">
                  <div class="day-info">
                    <span class="day-badge">Day {{ day.dayNumber }}</span>
                    <input
                      type="text"
                      class="day-title-input"
                      [(ngModel)]="day.title"
                      placeholder="Day Title"
                    />
                    <span class="day-date-hint">{{ formatDayDate(day.dayDate) }}</span>
                  </div>

                  <div class="day-actions">
                    <button
                      type="button"
                      class="btn-icon"
                      title="Move Up"
                      [disabled]="dIndex === 0"
                      (click)="moveDay(dIndex, -1)"
                    >↑</button>
                    <button
                      type="button"
                      class="btn-icon"
                      title="Move Down"
                      [disabled]="dIndex === itineraryDays.length - 1"
                      (click)="moveDay(dIndex, 1)"
                    >↓</button>
                    <button
                      type="button"
                      class="btn btn-sm btn-primary add-sched-btn"
                      (click)="openInlineScheduleForm(dIndex)"
                    >+ Schedule</button>
                    <button
                      type="button"
                      class="btn-icon text-danger"
                      title="Delete Day"
                      (click)="confirmDeleteDay(dIndex)"
                    >✕</button>
                  </div>
                </div>

                <!-- Schedules List -->
                <div class="schedules-list">
                  <div *ngFor="let item of day.items; let sIndex = index" class="schedule-item-row">
                    <div class="sched-main">
                      <span class="sched-time-pill">{{ item.timeString }}</span>
                      <div class="sched-desc-block">
                        <strong class="sched-act-title">{{ item.activity }}</strong>
                        <span class="sched-meta" *ngIf="item.location">📍 {{ item.location }}</span>
                        <span class="sched-meta" *ngIf="item.description">ℹ️ {{ item.description }}</span>
                      </div>
                    </div>

                    <div class="sched-actions">
                      <span class="status-pill status-{{ item.status.toLowerCase() }}">{{ item.status }}</span>
                      <button type="button" class="del-sched-btn" (click)="removeScheduleItem(dIndex, sIndex)" title="Delete">✕</button>
                    </div>
                  </div>

                  <div *ngIf="day.items.length === 0 && activeInlineDayIndex !== dIndex" class="no-sched">
                    No schedule added yet for Day {{ day.dayNumber }}.
                  </div>

                  <!-- INLINE SCHEDULE CREATION (NO MODAL POPUP!) -->
                  <div class="inline-schedule-box" *ngIf="activeInlineDayIndex === dIndex">
                    <h4 class="inline-sched-heading">Add Schedule to Day {{ day.dayNumber }}</h4>

                    <div class="inline-form-grid">
                      <div class="inline-field">
                        <label>Time</label>
                        <input type="time" [(ngModel)]="inlineTime" />
                      </div>

                      <div class="inline-field flex-2">
                        <label>Activity Title *</label>
                        <input type="text" [(ngModel)]="inlineActivity" placeholder="e.g. Visit Mattupetty Dam" />
                      </div>

                      <div class="inline-field">
                        <label>Activity Type</label>
                        <select [(ngModel)]="inlineType">
                          <option value="Sightseeing">Sightseeing</option>
                          <option value="Transit">Transit</option>
                          <option value="Meal">Meal</option>
                          <option value="Accommodation">Accommodation</option>
                          <option value="Leisure">Leisure</option>
                        </select>
                      </div>

                      <div class="inline-field">
                        <label>Status</label>
                        <select [(ngModel)]="inlineStatus">
                          <option value="Scheduled">Scheduled</option>
                          <option value="InProgress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Delayed">Delayed</option>
                        </select>
                      </div>

                      <div class="inline-field flex-2">
                        <label>Location</label>
                        <input type="text" [(ngModel)]="inlineLocation" placeholder="e.g. Mattupetty Dam Reservoir" />
                      </div>

                      <div class="inline-field full-width">
                        <label>Special Instructions / Notes</label>
                        <input type="text" [(ngModel)]="inlineNotes" placeholder="e.g. Boating tickets included" />
                      </div>
                    </div>

                    <div class="inline-sched-actions">
                      <button type="button" class="btn btn-secondary btn-sm" (click)="closeInlineScheduleForm()">Cancel</button>
                      <button type="button" class="btn btn-primary btn-sm" (click)="commitInlineSchedule(dIndex)">+ Add Schedule</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Commercial Pricing & Margins Engine -->
          <div class="section-card" style="margin-top: 20px;">
            <div class="section-card-header">
              <span class="section-icon">💰</span>
              <h2 class="section-title">Commercial Pricing & Margins</h2>
            </div>

            <div class="payment-form">
              <!-- Adult Pricing -->
              <div class="price-section">
                <h3 class="price-heading">Price per Adult (₹)</h3>
                <div class="price-inputs">
                  <div class="form-field">
                    <label>Spends (Cost)</label>
                    <input type="number" [(ngModel)]="adultSpends" (input)="calcAdultTotal()" placeholder="0" />
                  </div>
                  <div class="form-field">
                    <label>Margin (Profit)</label>
                    <input type="number" [(ngModel)]="adultMargin" (input)="calcAdultTotal()" placeholder="0" />
                  </div>
                </div>
                <div class="computed-price">
                  <span>Calculated Selling Price:</span>
                  <strong class="price-tag">₹{{ adultPrice | number }}</strong>
                </div>
              </div>

              <!-- Child Pricing -->
              <div class="price-section" style="margin-top: 16px;">
                <h3 class="price-heading">Price per Child (₹)</h3>
                <div class="price-inputs">
                  <div class="form-field">
                    <label>Spends (Cost)</label>
                    <input type="number" [(ngModel)]="childSpends" (input)="calcChildTotal()" placeholder="0" />
                  </div>
                  <div class="form-field">
                    <label>Margin (Profit)</label>
                    <input type="number" [(ngModel)]="childMargin" (input)="calcChildTotal()" placeholder="0" />
                  </div>
                </div>
                <div class="computed-price">
                  <span>Calculated Selling Price:</span>
                  <strong class="price-tag">₹{{ childPrice | number }}</strong>
                </div>
              </div>

              <!-- Commercial Yield Projection -->
              <div class="commercial-summary-box">
                <h4 class="summary-title">Trip Revenue Projection</h4>
                <div class="summary-line">
                  <span>Estimated Revenue:</span>
                  <strong>₹{{ (adultPrice * totalSeats) | number }}</strong>
                </div>
                <div class="summary-line">
                  <span>Estimated Spends:</span>
                  <span class="text-muted">₹{{ (adultSpends * totalSeats) | number }}</span>
                </div>
                <div class="summary-line highlight-margin">
                  <span>Projected Gross Margin:</span>
                  <strong class="text-success">₹{{ (adultMargin * totalSeats) | number }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="bottom-action-bar">
            <button class="btn btn-secondary" routerLink="/trips">Cancel</button>
            <button class="btn btn-secondary" (click)="saveTrip('Draft')">Save as Draft</button>
            <button class="btn btn-primary" (click)="saveTrip('Upcoming')">
              {{ isEditMode() ? 'Save Changes' : 'Publish Trip' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Day Confirmation Modal -->
      <div class="modal-backdrop" *ngIf="showDeleteDayModal" (click)="showDeleteDayModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Delete Day {{ dayToDeleteIndex !== null ? itineraryDays[dayToDeleteIndex].dayNumber : '' }}</h3>
            <button type="button" class="close-x" (click)="showDeleteDayModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this itinerary day?</p>
            <p class="warning-text" *ngIf="dayToDeleteIndex !== null && itineraryDays[dayToDeleteIndex].items.length > 0">
              ⚠️ Warning: This day has {{ itineraryDays[dayToDeleteIndex].items.length }} scheduled activity item(s) that will be permanently removed.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showDeleteDayModal = false">Cancel</button>
            <button type="button" class="btn btn-danger" (click)="executeDeleteDay()">Confirm Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-trip-page {
      padding: 24px;
      max-width: 1720px;
      margin: 0 auto;
      color: var(--text-main, #fff);
    }

    /* Breadcrumbs & Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      gap: 20px;
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      margin-bottom: 6px;
    }

    .crumb-link {
      color: var(--text-muted, #8e8ea0);
      text-decoration: none;
      transition: color 0.2s;
    }

    .crumb-link:hover {
      color: var(--primary, #ff5722);
    }

    .crumb-sep {
      color: #4a4a60;
    }

    .crumb-active {
      color: #d1d1e0;
      font-weight: 500;
    }

    .title-status-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-title {
      font-size: 1.65rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0;
      color: #fff;
    }

    .page-subtitle {
      font-size: 0.84rem;
      color: var(--text-muted, #8e8ea0);
      margin: 4px 0 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    /* 3-Column Responsive SaaS Grid */
    .trip-grid {
      display: grid;
      grid-template-columns: 1.05fr 1.15fr 1.1fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1300px) {
      .trip-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 900px) {
      .trip-grid {
        grid-template-columns: 1fr;
      }
    }

    .grid-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Section Cards */
    .section-card {
      background: #14141e;
      border: 1px solid #232332;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }

    .section-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid #1f1f2e;
    }

    .header-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-icon {
      font-size: 1.2rem;
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }

    .count-pill {
      background: #1e1e2d;
      border: 1px solid #2c2c40;
      color: var(--primary, #ff5722);
      font-size: 0.74rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
    }

    /* Form Body & Controls */
    .form-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .form-field.flex-1 { flex: 1; }
    .form-field.flex-2 { flex: 2; }
    .form-field.full-width { grid-column: 1 / -1; width: 100%; }

    label {
      font-size: 0.76rem;
      font-weight: 600;
      color: #9a9ab0;
    }

    .req {
      color: #ff5722;
    }

    input, select, textarea {
      background: #191924;
      border: 1px solid #28283a;
      border-radius: 8px;
      padding: 9px 12px;
      color: #fff;
      font-size: 0.86rem;
      outline: none;
      transition: all 0.2s ease;
      width: 100%;
      box-sizing: border-box;
    }

    input:focus, select:focus, textarea:focus {
      border-color: var(--primary, #ff5722);
      box-shadow: 0 0 0 2px rgba(255, 87, 34, 0.15);
    }

    .input-icon-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 10px;
      font-size: 0.82rem;
      pointer-events: none;
    }

    .input-icon-wrap input {
      padding-left: 32px;
    }

    .upload-zone {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .thumb-preview img {
      max-width: 100%;
      max-height: 120px;
      border-radius: 8px;
      border: 1px solid #28283a;
      object-fit: cover;
    }

    /* Dynamic Custom Fields Box */
    .custom-fields-box {
      margin-top: 10px;
      background: #171722;
      border: 1px dashed #2a2a3e;
      border-radius: 8px;
      padding: 14px;
    }

    .custom-heading {
      font-size: 0.84rem;
      font-weight: 700;
      color: #c4c4d6;
      margin: 0 0 10px;
    }

    /* ALLOCATION CENTER (Column 2) */
    .assigned-tray {
      background: #191925;
      border: 1px solid #252538;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tray-label {
      font-size: 0.74rem;
      font-weight: 700;
      color: #9494a8;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .assigned-chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .assigned-chip {
      background: rgba(255, 87, 34, 0.15);
      border: 1px solid rgba(255, 87, 34, 0.4);
      color: #fff;
      font-size: 0.76rem;
      padding: 3px 8px;
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .chip-avatar {
      font-size: 0.75rem;
    }

    .chip-text {
      max-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chip-remove-btn {
      background: transparent;
      border: none;
      color: #ff7961;
      font-size: 0.74rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      display: flex;
      align-items: center;
    }

    .chip-remove-btn:hover {
      color: #fff;
    }

    .allocation-filter-bar {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }

    .filter-search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-lens {
      position: absolute;
      left: 10px;
      font-size: 0.8rem;
      color: #717188;
      pointer-events: none;
    }

    .filter-search-box input {
      padding-left: 30px;
      font-size: 0.8rem;
      padding-top: 6px;
      padding-bottom: 6px;
      background: #171723;
    }

    .filter-pills-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-pill {
      background: #181826;
      border: 1px solid #28283a;
      color: #9e9eb4;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-pill:hover {
      border-color: #3f3f58;
      color: #fff;
    }

    .filter-pill.active {
      background: var(--primary, #ff5722);
      border-color: var(--primary, #ff5722);
      color: #fff;
    }

    .ownership-select {
      width: auto;
      padding: 4px 10px;
      font-size: 0.72rem;
      background: #181826;
      border: 1px solid #28283a;
      border-radius: 14px;
      margin-left: auto;
    }

    /* Scrollable Interactive Selection Cards */
    .cards-scroll-box {
      max-height: 380px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 4px;
    }

    .cards-scroll-box::-webkit-scrollbar {
      width: 5px;
    }

    .cards-scroll-box::-webkit-scrollbar-thumb {
      background: #2a2a3e;
      border-radius: 4px;
    }

    .alloc-item-card {
      background: #181824;
      border: 1px solid #252538;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.18s ease;
      user-select: none;
    }

    .alloc-item-card:hover {
      background: #1d1d2c;
      border-color: #3b3b52;
      transform: translateY(-1px);
    }

    .alloc-item-card.selected {
      background: rgba(255, 87, 34, 0.08);
      border-color: var(--primary, #ff5722);
      box-shadow: inset 0 0 0 1px rgba(255, 87, 34, 0.5);
    }

    .chk-wrap {
      flex-shrink: 0;
    }

    .alloc-chk {
      width: 18px;
      height: 18px;
      border: 2px solid #3d3d54;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 900;
      color: #fff;
      background: #1a1a27;
      transition: all 0.2s;
    }

    .alloc-chk.checked {
      background: var(--primary, #ff5722);
      border-color: var(--primary, #ff5722);
      box-shadow: 0 0 6px rgba(255, 87, 34, 0.5);
    }

    .alloc-avatar {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      background: #202030;
      flex-shrink: 0;
    }

    .alloc-avatar.role-driver { background: rgba(59, 130, 246, 0.15); }
    .alloc-avatar.role-guider { background: rgba(245, 158, 11, 0.15); }
    .alloc-avatar.role-staff { background: rgba(168, 85, 247, 0.15); }
    .alloc-avatar.role-helper { background: rgba(16, 185, 129, 0.15); }
    .alloc-avatar.res-type-icon { background: rgba(255, 87, 34, 0.12); }

    .alloc-content {
      flex: 1;
      min-width: 0;
    }

    .alloc-header-line {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }

    .alloc-code {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--primary, #ff5722);
    }

    .alloc-name {
      font-size: 0.84rem;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .role-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .role-driver { background: #1e3a8a; color: #93c5fd; }
    .role-guider { background: #78350f; color: #fde68a; }
    .role-staff { background: #581c87; color: #e9d5ff; }
    .role-helper { background: #064e3b; color: #a7f3d0; }

    .alloc-meta-line {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.72rem;
      color: #8c8ca4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-alloc-msg {
      text-align: center;
      padding: 30px 10px;
      color: #717188;
      font-size: 0.82rem;
    }

    .empty-alloc-msg span {
      font-size: 1.8rem;
      display: block;
      margin-bottom: 6px;
    }

    /* Badges */
    .badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
    }

    .badge-own { background: #064e3b; color: #34d399; }
    .badge-partner { background: #7c2d12; color: #fb923c; }
    .badge-available { background: #064e3b; color: #34d399; }
    .badge-intrip { background: #1e3a8a; color: #60a5fa; }
    .badge-none { background: #374151; color: #9ca3af; }

    /* Itinerary Days (Column 3) */
    .itinerary-days-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .day-card {
      background: #171723;
      border: 1px solid #28283a;
      border-radius: 10px;
      padding: 14px;
    }

    .day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #202030;
      gap: 8px;
    }

    .day-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .day-badge {
      background: var(--primary, #ff5722);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 7px;
      border-radius: 4px;
    }

    .day-title-input {
      width: auto;
      min-width: 120px;
      max-width: 180px;
      padding: 4px 8px;
      font-size: 0.82rem;
      background: #1e1e2d;
    }

    .day-date-hint {
      font-size: 0.72rem;
      color: #8c8ca4;
    }

    .day-actions {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .btn-icon {
      background: #20202e;
      border: 1px solid #2c2c3e;
      color: #fff;
      width: 26px;
      height: 26px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.76rem;
    }

    .btn-icon:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .add-sched-btn {
      padding: 3px 8px;
      font-size: 0.74rem;
    }

    /* Schedules */
    .schedules-list {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .schedule-item-row {
      background: #1d1d2b;
      border: 1px solid #27273a;
      border-radius: 6px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .sched-main {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .sched-time-pill {
      background: #272738;
      color: #ff9e80;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .sched-desc-block {
      display: flex;
      flex-direction: column;
    }

    .sched-act-title {
      font-size: 0.82rem;
      color: #fff;
    }

    .sched-meta {
      font-size: 0.7rem;
      color: #88889c;
    }

    .sched-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .status-scheduled { background: #1e3a8a; color: #93c5fd; }
    .status-inprogress { background: #78350f; color: #fde68a; }
    .status-completed { background: #064e3b; color: #6ee7b7; }
    .status-delayed { background: #7f1d1d; color: #fca5a5; }

    .del-sched-btn {
      background: transparent;
      border: none;
      color: #77778c;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .del-sched-btn:hover {
      color: #ef4444;
    }

    .no-sched {
      font-size: 0.74rem;
      color: #68687a;
      font-style: italic;
      padding: 4px 0;
    }

    /* Inline Schedule Form */
    .inline-schedule-box {
      margin-top: 8px;
      background: #1a1a28;
      border: 1px solid var(--primary, #ff5722);
      border-radius: 8px;
      padding: 14px;
    }

    .inline-sched-heading {
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--primary, #ff5722);
      margin: 0 0 10px;
    }

    .inline-form-grid {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      gap: 10px;
    }

    .inline-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .inline-field.flex-2 { grid-column: span 2; }
    .inline-field.full-width { grid-column: 1 / -1; }

    .inline-sched-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }

    /* Pricing Engine (Column 3) */
    .price-section {
      background: #181824;
      border: 1px solid #262638;
      border-radius: 8px;
      padding: 12px;
    }

    .price-heading {
      font-size: 0.82rem;
      font-weight: 700;
      color: #c4c4d8;
      margin: 0 0 8px;
    }

    .price-inputs {
      display: flex;
      gap: 10px;
    }

    .computed-price {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
      color: #9292a8;
      border-top: 1px dashed #28283a;
      padding-top: 8px;
    }

    .price-tag {
      font-size: 1.05rem;
      color: var(--primary, #ff5722);
    }

    .commercial-summary-box {
      margin-top: 16px;
      background: #181825;
      border: 1px solid #28283c;
      border-radius: 8px;
      padding: 14px;
    }

    .summary-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 10px;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      margin-bottom: 6px;
      color: #a3a3b8;
    }

    .summary-line.highlight-margin {
      border-top: 1px solid #28283a;
      padding-top: 8px;
      margin-top: 8px;
      font-weight: 700;
      font-size: 0.88rem;
    }

    .text-success { color: #10b981; }

    .bottom-action-bar {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #222232;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: #161622;
      border: 1px solid #2e2e42;
      border-radius: 12px;
      width: 90%;
      max-width: 480px;
      padding: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .modal-header h3 {
      font-size: 1.1rem;
      color: #fff;
      margin: 0;
    }

    .close-x {
      background: transparent;
      border: none;
      color: #88889a;
      font-size: 1.2rem;
      cursor: pointer;
    }

    .warning-text {
      color: #f59e0b;
      font-size: 0.82rem;
      background: rgba(245, 158, 11, 0.1);
      padding: 8px 12px;
      border-radius: 6px;
      border-left: 3px solid #f59e0b;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    /* Buttons */
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.84rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--primary, #ff5722);
      color: #fff;
    }

    .btn-primary:hover {
      background: #f4511e;
      box-shadow: 0 0 12px rgba(255, 87, 34, 0.4);
    }

    .btn-secondary {
      background: #242436;
      color: #e2e2ee;
      border: 1px solid #333348;
    }

    .btn-secondary:hover {
      background: #2c2c40;
      color: #fff;
    }

    .btn-outline-primary {
      background: transparent;
      border: 1px solid var(--primary, #ff5722);
      color: var(--primary, #ff5722);
    }

    .btn-outline-primary:hover {
      background: rgba(255, 87, 34, 0.1);
    }

    .btn-danger {
      background: #dc2626;
      color: #fff;
    }

    .btn-sm {
      padding: 5px 10px;
      font-size: 0.74rem;
    }

    .status-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .status-draft { background: rgba(156, 163, 175, 0.2); color: #d1d5db; border: 1px solid #4b5563; }
    .status-upcoming { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid #1e40af; }
    .status-active { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid #065f46; }
    .status-completed { background: rgba(107, 114, 128, 0.2); color: #9ca3af; border: 1px solid #374151; }
    .status-canceled { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid #991b1b; }
  `]
})
export class CreateTripComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  isEditMode = signal<boolean>(false);
  editTripId: string | null = null;

  // Basic Details
  tripCode = '#0010';
  tripName = '';
  category = 'Family Trip';
  status = 'Draft';
  thumbnailUrl = '';
  origin = '';
  destination = '';
  via = '';
  startDateTime = '2026-12-20T08:00';
  endDateTime = '2026-12-23T18:00';
  duration = '3D 2N';
  totalSeats = 40;
  foodInfo = 'With Food and Snacks';
  pickupDrop = 'Available with extra charges';
  description = '';

  // Autocomplete Suggestions
  locationSuggestions: string[] = [
    'Tirunelveli', 'Kochi', 'Munnar', 'Ooty', 'Kodaikanal',
    'Coimbatore', 'Madurai', 'Theni', 'Wayanad', 'Alleppey',
    'Bangalore', 'Chennai', 'Goa', 'Bali'
  ];

  // Pricing
  adultSpends = 5000;
  adultMargin = 1500;
  adultPrice = 6500;
  childSpends = 3000;
  childMargin = 1000;
  childPrice = 4000;

  // Selectors State
  availableMembers: MemberItem[] = [];
  availableResources: ResourceItem[] = [];
  selectedMemberIds: string[] = [];
  selectedResourceIds: string[] = [];

  // Filter & Search Controls
  memberSearchQuery = '';
  memberRoleFilter = 'All';
  resourceSearchQuery = '';
  resourceTypeFilter = 'All';
  resourceOwnershipFilter = 'All';

  // Dynamic Custom Fields
  tripCustomFields: CustomField[] = [];
  customFieldValues: Record<string, any> = {};

  // Itinerary Days & Inline Schedules
  itineraryDays: EditableDay[] = [
    {
      dayNumber: 1,
      title: 'Day 1: Departure & Journey',
      dayDate: '2026-12-20T08:00:00Z',
      items: [
        { timeString: '08:00', activity: 'Departure from Origin Hub', activityType: 'Transit', status: 'Scheduled', location: 'Main Hub' },
        { timeString: '13:00', activity: 'Buffet Lunch & Rest Stop', activityType: 'Meal', status: 'Scheduled', location: 'Highway Resort' }
      ]
    },
    {
      dayNumber: 2,
      title: 'Day 2: Exploration & Sightseeing',
      dayDate: '2026-12-21T09:00:00Z',
      items: [
        { timeString: '09:00', activity: 'Morning Viewpoint & Tea Museum', activityType: 'Sightseeing', status: 'Scheduled', location: 'Tea Estate' },
        { timeString: '15:30', activity: 'Lake Boating & Adventure Activities', activityType: 'Leisure', status: 'Scheduled', location: 'Boating Lake' }
      ]
    },
    {
      dayNumber: 3,
      title: 'Day 3: Return & Drop',
      dayDate: '2026-12-22T10:00:00Z',
      items: [
        { timeString: '18:00', activity: 'Return to Destination Drop Point', activityType: 'Transit', status: 'Scheduled', location: 'Drop point' }
      ]
    }
  ];

  // Inline Schedule Creation Form
  activeInlineDayIndex: number | null = null;
  inlineTime = '10:00';
  inlineActivity = '';
  inlineType = 'Sightseeing';
  inlineStatus = 'Scheduled';
  inlineLocation = '';
  inlineNotes = '';

  // Delete Day Confirmation
  showDeleteDayModal = false;
  dayToDeleteIndex: number | null = null;

  ngOnInit() {
    this.loadSelectors();
    this.loadCustomFields();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.editTripId = params['id'];
        this.loadTripForEdit(params['id']);
      }
    });
  }

  loadSelectors() {
    this.api.getMembers({}).subscribe({
      next: res => {
        this.availableMembers = Array.isArray(res) ? res : ((res as any)?.items || []);
      },
      error: err => console.error('Failed to load team members:', err)
    });

    this.api.getResources({ pageSize: 100 }).subscribe({
      next: res => {
        this.availableResources = res?.items || (Array.isArray(res) ? res : []);
      },
      error: err => console.error('Failed to load resources:', err)
    });
  }

  loadCustomFields() {
    this.api.getCustomFields('Trip').subscribe({
      next: fields => this.tripCustomFields = fields || [],
      error: err => console.error('Failed to load custom fields:', err)
    });
  }

  parseOptions(json?: string): string[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Team Selection & Filter Logic
  getRoleIcon(role?: string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('driver')) return '🚗';
    if (r.includes('guider') || r.includes('guide')) return '🧭';
    if (r.includes('staff')) return '💼';
    if (r.includes('helper')) return '🛠️';
    return '👤';
  }

  getMemberName(id: string): string {
    const m = this.availableMembers.find(x => x.id === id);
    return m ? `${m.fullName}` : id;
  }

  getMemberRole(id: string): string {
    const m = this.availableMembers.find(x => x.id === id);
    return m ? m.role : '';
  }

  filteredMembers(): MemberItem[] {
    return this.availableMembers.filter(m => {
      const matchesRole = this.memberRoleFilter === 'All' || m.role?.toLowerCase() === this.memberRoleFilter.toLowerCase();
      const q = this.memberSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        m.fullName?.toLowerCase().includes(q) ||
        m.memberCode?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q) ||
        m.mobileNo?.includes(q);
      return matchesRole && matchesSearch;
    });
  }

  isMemberSelected(id: string): boolean {
    return this.selectedMemberIds.includes(id);
  }

  toggleMemberSelection(id: string) {
    if (this.selectedMemberIds.includes(id)) {
      this.selectedMemberIds = this.selectedMemberIds.filter(x => x !== id);
    } else {
      this.selectedMemberIds = [...this.selectedMemberIds, id];
    }
  }

  // Resource Selection & Filter Logic
  getResourceIcon(type?: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('vehicle')) return '🚗';
    if (t.includes('hotel') || t.includes('resort')) return '🏨';
    if (t.includes('restaurant') || t.includes('food')) return '🍽️';
    if (t.includes('lodge') || t.includes('cottage')) return '🏡';
    return '📦';
  }

  getResourceName(id: string): string {
    const r = this.availableResources.find(x => x.id === id);
    return r ? `${r.name}` : id;
  }

  getResourceType(id: string): string {
    const r = this.availableResources.find(x => x.id === id);
    return r ? (r.resourceTypeKey || r.resourceTypeName || '') : '';
  }

  filteredResources(): ResourceItem[] {
    return this.availableResources.filter(r => {
      const typeStr = r.resourceTypeKey || r.resourceTypeName || '';
      const matchesType = this.resourceTypeFilter === 'All' ||
        (typeStr && typeStr.toLowerCase().includes(this.resourceTypeFilter.toLowerCase().replace(/s$/, '')));
      const matchesOwnership = this.resourceOwnershipFilter === 'All' ||
        r.ownership?.toLowerCase() === this.resourceOwnershipFilter.toLowerCase();
      const q = this.resourceSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        r.name?.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q) ||
        (r.identificationNo && r.identificationNo.toLowerCase().includes(q)) ||
        (r.partnerName && r.partnerName.toLowerCase().includes(q));
      return matchesType && matchesOwnership && matchesSearch;
    });
  }

  isResourceSelected(id: string): boolean {
    return this.selectedResourceIds.includes(id);
  }

  toggleResourceSelection(id: string) {
    if (this.selectedResourceIds.includes(id)) {
      this.selectedResourceIds = this.selectedResourceIds.filter(x => x !== id);
    } else {
      this.selectedResourceIds = [...this.selectedResourceIds, id];
    }
  }

  loadTripForEdit(id: string) {
    this.api.getTripById(id).subscribe({
      next: trip => {
        this.tripCode = trip.tripCode;
        this.tripName = trip.name;
        this.thumbnailUrl = trip.thumbnailUrl || '';
        this.status = trip.status || 'Draft';
        this.category = trip.category;
        this.origin = trip.origin;
        this.destination = trip.destination;
        this.via = trip.via || '';
        this.startDateTime = trip.startDateTime.substring(0, 16);
        this.endDateTime = trip.endDateTime.substring(0, 16);
        this.duration = trip.duration;
        this.totalSeats = trip.totalSeats;
        this.foodInfo = trip.foodInfo;
        this.pickupDrop = trip.pickupDrop;
        this.description = trip.description || '';
        this.adultSpends = trip.adultSpends;
        this.adultMargin = trip.adultMargin;
        this.adultPrice = trip.adultPrice;
        this.childSpends = trip.childSpends;
        this.childMargin = trip.childMargin;
        this.childPrice = trip.childPrice;

        // Populate Assigned Team & Resources
        if (trip.assignedTeamMemberIds && trip.assignedTeamMemberIds.length > 0) {
          this.selectedMemberIds = [...trip.assignedTeamMemberIds];
        } else if (trip.teamMembers && trip.teamMembers.length > 0) {
          this.selectedMemberIds = trip.teamMembers.map(m => m.memberId);
        }

        if (trip.assignedResourceIds && trip.assignedResourceIds.length > 0) {
          this.selectedResourceIds = [...trip.assignedResourceIds];
        } else if (trip.resources && trip.resources.length > 0) {
          this.selectedResourceIds = trip.resources.map(r => r.resourceId);
        }

        // Custom Fields
        if (trip.customFieldsJson) {
          try {
            this.customFieldValues = JSON.parse(trip.customFieldsJson);
          } catch {
            this.customFieldValues = {};
          }
        }

        // Days & Schedules
        if (trip.days && trip.days.length > 0) {
          this.itineraryDays = trip.days.map(d => ({
            id: d.id,
            dayNumber: d.dayNumber,
            title: d.title || `Day ${d.dayNumber}`,
            dayDate: d.dayDate,
            items: (d.schedules || []).map(s => ({
              id: s.id,
              timeString: s.timeString,
              activity: s.activity,
              description: s.description,
              origin: s.origin,
              destination: s.destination,
              activityType: s.activityType || 'Sightseeing',
              status: s.status || 'Scheduled',
              location: s.location,
              notes: s.notes
            }))
          }));
        }
      }
    });
  }

  calcAdultTotal() {
    this.adultPrice = (Number(this.adultSpends) || 0) + (Number(this.adultMargin) || 0);
  }

  calcChildTotal() {
    this.childPrice = (Number(this.childSpends) || 0) + (Number(this.childMargin) || 0);
  }

  onDatesChanged() {
    if (this.startDateTime && this.endDateTime) {
      const start = new Date(this.startDateTime);
      const end = new Date(this.endDateTime);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        this.duration = `${diffDays}D ${Math.max(1, diffDays - 1)}N`;
      }
    }
  }

  formatDayDate(dayDateStr?: string): string {
    if (!dayDateStr) return '';
    try {
      const d = new Date(dayDateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.api.uploadFile(file, 'thumbnails').subscribe({
        next: res => {
          this.thumbnailUrl = res.fileUrl;
          this.toast.success('Cover image uploaded successfully.');
        }
      });
    }
  }

  // Itinerary Day Operations
  addItineraryDay() {
    const nextDay = this.itineraryDays.length + 1;
    const baseDate = new Date(this.startDateTime || Date.now());
    baseDate.setDate(baseDate.getDate() + (nextDay - 1));

    this.itineraryDays.push({
      dayNumber: nextDay,
      title: `Day ${nextDay}`,
      dayDate: baseDate.toISOString(),
      items: []
    });

    this.toast.success(`Day ${nextDay} added to itinerary.`);
  }

  confirmDeleteDay(index: number) {
    this.dayToDeleteIndex = index;
    this.showDeleteDayModal = true;
  }

  executeDeleteDay() {
    if (this.dayToDeleteIndex === null) return;
    this.itineraryDays.splice(this.dayToDeleteIndex, 1);

    // Renumber days sequentially
    this.itineraryDays.forEach((day, idx) => {
      day.dayNumber = idx + 1;
      if (day.title.startsWith('Day ')) {
        day.title = `Day ${idx + 1}`;
      }
    });

    this.showDeleteDayModal = false;
    this.dayToDeleteIndex = null;
    this.toast.success('Day removed from itinerary.');
  }

  moveDay(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= this.itineraryDays.length) return;

    const temp = this.itineraryDays[index];
    this.itineraryDays[index] = this.itineraryDays[target];
    this.itineraryDays[target] = temp;

    this.itineraryDays.forEach((day, idx) => {
      day.dayNumber = idx + 1;
    });
  }

  // Inline Schedule Form
  openInlineScheduleForm(dayIndex: number) {
    this.activeInlineDayIndex = dayIndex;
    this.inlineTime = '10:00';
    this.inlineActivity = '';
    this.inlineType = 'Sightseeing';
    this.inlineStatus = 'Scheduled';
    this.inlineLocation = '';
    this.inlineNotes = '';
  }

  closeInlineScheduleForm() {
    this.activeInlineDayIndex = null;
  }

  commitInlineSchedule(dayIndex: number) {
    if (!this.inlineActivity.trim()) {
      this.toast.error('Activity Title is required.');
      return;
    }

    this.itineraryDays[dayIndex].items.push({
      timeString: this.inlineTime,
      activity: this.inlineActivity.trim(),
      activityType: this.inlineType,
      status: this.inlineStatus,
      location: this.inlineLocation.trim(),
      notes: this.inlineNotes.trim()
    });

    this.closeInlineScheduleForm();
    this.toast.success('Schedule item added.');
  }

  removeScheduleItem(dayIndex: number, itemIndex: number) {
    this.itineraryDays[dayIndex].items.splice(itemIndex, 1);
  }

  saveTrip(targetStatus: string) {
    if (!this.tripName.trim()) {
      this.toast.error('Trip Name is required.');
      return;
    }
    if (!this.origin.trim() || !this.destination.trim()) {
      this.toast.error('Origin and Destination are required.');
      return;
    }

    const baseDate = new Date(this.startDateTime || Date.now());
    const daysPayload: any[] = [];
    const schedulesPayload: any[] = [];

    this.itineraryDays.forEach((day, dIdx) => {
      const dayDate = new Date(baseDate);
      dayDate.setDate(dayDate.getDate() + dIdx);

      daysPayload.push({
        id: day.id,
        dayNumber: dIdx + 1,
        title: day.title,
        dayDate: dayDate.toISOString()
      });

      day.items.forEach(item => {
        schedulesPayload.push({
          id: item.id,
          dayNumber: dIdx + 1,
          dayDate: dayDate.toISOString(),
          timeString: item.timeString,
          activity: item.activity,
          description: item.description,
          activityType: item.activityType,
          status: item.status,
          location: item.location,
          notes: item.notes
        });
      });
    });

    const finalStatus = this.isEditMode() ? (this.status || targetStatus) : targetStatus;

    const payload = {
      tripCode: this.tripCode,
      name: this.tripName.trim(),
      description: this.description,
      thumbnailUrl: this.thumbnailUrl,
      category: this.category,
      origin: this.origin.trim(),
      destination: this.destination.trim(),
      via: this.via,
      startDateTime: new Date(this.startDateTime).toISOString(),
      endDateTime: new Date(this.endDateTime).toISOString(),
      duration: this.duration,
      totalSeats: this.totalSeats,
      foodInfo: this.foodInfo,
      pickupDrop: this.pickupDrop,
      adultPrice: this.adultPrice,
      adultSpends: this.adultSpends,
      adultMargin: this.adultMargin,
      childPrice: this.childPrice,
      childSpends: this.childSpends,
      childMargin: this.childMargin,
      status: finalStatus,
      customFieldsJson: JSON.stringify(this.customFieldValues),
      assignedMemberIds: this.selectedMemberIds,
      assignedResourceIds: this.selectedResourceIds,
      days: daysPayload,
      schedules: schedulesPayload
    };

    if (this.isEditMode() && this.editTripId) {
      this.api.updateTrip(this.editTripId, payload).subscribe({
        next: () => {
          this.toast.success('Trip updated successfully.');
          if (targetStatus === 'Upcoming' && this.status !== 'Upcoming') {
            this.api.publishTrip(this.editTripId!).subscribe({
              next: () => {
                this.toast.success('Trip published successfully!');
                this.router.navigate(['/trips', this.editTripId]);
              }
            });
          } else {
            this.router.navigate(['/trips', this.editTripId]);
          }
        },
        error: err => {
          this.toast.error(err.error?.message || 'Failed to update trip.');
        }
      });
    } else {
      this.api.createTrip(payload).subscribe({
        next: createdTrip => {
          this.toast.success(finalStatus === 'Draft' ? 'Trip saved as Draft.' : 'Trip created successfully.');
          if (targetStatus === 'Upcoming') {
            this.api.publishTrip(createdTrip.id).subscribe({
              next: () => {
                this.toast.success('Trip published! Public link is active.');
                this.router.navigate(['/trips', createdTrip.id]);
              }
            });
          } else {
            this.router.navigate(['/trips', createdTrip.id]);
          }
        },
        error: err => {
          this.toast.error(err.error?.message || 'Failed to create trip.');
        }
      });
    }
  }
}
