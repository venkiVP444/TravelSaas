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
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ isEditMode() ? 'Edit Trip' : 'Create Trip' }}</h1>
          <p class="page-subtitle">Configure journey details, multi-day itinerary, team & resource assignments</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="saveTrip('Draft')">Save as a draft</button>
          <button class="btn btn-primary" (click)="saveTrip('Upcoming')">
            {{ isEditMode() ? 'Save Changes' : 'Publish Trip' }}
          </button>
        </div>
      </div>

      <!-- 3-Column Layout Matching Figma -->
      <div class="trip-grid">
        <!-- Column 1: Trip Details -->
        <div class="section-card">
          <h2 class="section-title">Trip Details</h2>
          
          <div class="form-body">
            <div class="form-row">
              <div class="form-field">
                <label>Trip ID</label>
                <input type="text" [(ngModel)]="tripCode" placeholder="#0010" />
              </div>
              <div class="form-field">
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

            <div class="form-row">
              <div class="form-field">
                <label>Upload Thumbnail</label>
                <input type="file" (change)="onFileSelected($event)" accept="image/*" />
                <span class="file-hint" *ngIf="thumbnailUrl">{{ thumbnailUrl }}</span>
              </div>
              <div class="form-field">
                <label>Via Route</label>
                <input type="text" [(ngModel)]="via" placeholder="e.g. Madurai - Theni" />
              </div>
            </div>

            <!-- Origin & Destination with Suggestions -->
            <div class="form-row">
              <div class="form-field location-field">
                <label>Origin Hub <span class="req">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="origin"
                  placeholder="e.g. Tirunelveli, Kochi"
                  list="knownLocations"
                />
              </div>
              <div class="form-field location-field">
                <label>Destination Hub <span class="req">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="destination"
                  placeholder="e.g. Munnar, Bali, Ooty"
                  list="knownLocations"
                />
              </div>
              <datalist id="knownLocations">
                <option *ngFor="let loc of locationSuggestions" [value]="loc"></option>
              </datalist>
            </div>

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
                <label>Total Seats</label>
                <input type="number" [(ngModel)]="totalSeats" min="1" />
              </div>
            </div>

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
                <label>Pickup & Drop</label>
                <select [(ngModel)]="pickupDrop">
                  <option value="Available with extra charges">Available with extra charges</option>
                  <option value="Included in package">Included in package</option>
                  <option value="Direct reporting at spot">Direct reporting at spot</option>
                </select>
              </div>
            </div>

            <div class="form-field">
              <label>Trip Highlights & Description</label>
              <textarea rows="3" [(ngModel)]="description" placeholder="Write an engaging overview for travelers..."></textarea>
            </div>

            <!-- Team Assignment Selector -->
            <div class="assignment-block">
              <label class="block-label">Assign Team Members</label>
              <div class="selector-chips">
                <label
                  *ngFor="let m of availableMembers"
                  class="chip-option"
                  [class.selected]="isMemberSelected(m.id)"
                >
                  <input
                    type="checkbox"
                    [checked]="isMemberSelected(m.id)"
                    (change)="toggleMemberSelection(m.id)"
                  />
                  <span>{{ m.fullName }} ({{ m.role }})</span>
                </label>
              </div>
            </div>

            <!-- Resource Allocation Selector -->
            <div class="assignment-block" style="margin-top: 16px;">
              <label class="block-label">Allocate Resources (Own & Partners)</label>
              <div class="selector-chips">
                <label
                  *ngFor="let r of availableResources"
                  class="chip-option"
                  [class.selected]="isResourceSelected(r.id)"
                >
                  <input
                    type="checkbox"
                    [checked]="isResourceSelected(r.id)"
                    (change)="toggleResourceSelection(r.id)"
                  />
                  <span>{{ r.name }} [{{ r.ownership }}]</span>
                </label>
              </div>
            </div>

            <!-- Dynamic Custom Fields for Trips -->
            <div class="custom-fields-box" *ngIf="tripCustomFields.length > 0">
              <h3 class="custom-heading">Additional Trip Attributes</h3>
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

        <!-- Column 2: Add Itinerary (Days & Inline Schedules) -->
        <div class="section-card">
          <div class="section-header-flex">
            <div>
              <h2 class="section-title">Itinerary Schedule</h2>
              <span class="days-counter">{{ itineraryDays.length }} Day(s) planned</span>
            </div>
            <button class="btn btn-outline-primary btn-sm" (click)="addItineraryDay()">+ Add Day</button>
          </div>

          <div class="itinerary-days-list">
            <div *ngFor="let day of itineraryDays; let dIndex = index" class="day-card">
              <!-- Day Header & Controls -->
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
                    class="btn-icon"
                    title="Move Up"
                    [disabled]="dIndex === 0"
                    (click)="moveDay(dIndex, -1)"
                  >↑</button>
                  <button
                    class="btn-icon"
                    title="Move Down"
                    [disabled]="dIndex === itineraryDays.length - 1"
                    (click)="moveDay(dIndex, 1)"
                  >↓</button>
                  <button
                    class="btn btn-sm btn-primary add-sched-btn"
                    (click)="openInlineScheduleForm(dIndex)"
                  >+ Add Schedule</button>
                  <button
                    class="btn-icon text-danger"
                    title="Delete Day"
                    (click)="confirmDeleteDay(dIndex)"
                  >✕</button>
                </div>
              </div>

              <!-- Schedules for this day -->
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
                    <button class="del-sched-btn" (click)="removeScheduleItem(dIndex, sIndex)" title="Delete">✕</button>
                  </div>
                </div>

                <div *ngIf="day.items.length === 0 && activeInlineDayIndex !== dIndex" class="no-sched">
                  No schedule added yet for Day {{ day.dayNumber }}.
                </div>

                <!-- INLINE SCHEDULE CREATION FORM (NO POPUP!) -->
                <div class="inline-schedule-box" *ngIf="activeInlineDayIndex === dIndex">
                  <h4 class="inline-sched-heading">New Schedule for Day {{ day.dayNumber }}</h4>

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
                      <label>Location (Optional)</label>
                      <input type="text" [(ngModel)]="inlineLocation" placeholder="e.g. Munnar Tea Estate" />
                    </div>

                    <div class="inline-field flex-3">
                      <label>Notes / Details</label>
                      <input type="text" [(ngModel)]="inlineNotes" placeholder="Special arrangements or notes" />
                    </div>
                  </div>

                  <div class="inline-actions-row">
                    <button class="btn btn-secondary btn-sm" (click)="closeInlineScheduleForm()">Cancel</button>
                    <button class="btn btn-primary btn-sm" (click)="saveInlineSchedule(dIndex)">Save Schedule</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 3: Payment Details -->
        <div class="section-card">
          <h2 class="section-title">Payment & Margins</h2>

          <div class="payment-form">
            <!-- Price per Adult -->
            <div class="price-section">
              <h3 class="price-heading">Price per Adult</h3>
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

            <!-- Price per Child -->
            <div class="price-section" style="margin-top: 24px;">
              <h3 class="price-heading">Price per Child</h3>
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

            <!-- Commercial Yield Summary -->
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
      </div>

      <!-- Delete Day Confirmation Modal -->
      <div class="modal-backdrop" *ngIf="showDeleteDayModal" (click)="showDeleteDayModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Delete Day {{ dayToDeleteIndex !== null ? itineraryDays[dayToDeleteIndex].dayNumber : '' }}</h3>
            <button class="close-x" (click)="showDeleteDayModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p>
              Are you sure you want to delete Day {{ dayToDeleteIndex !== null ? itineraryDays[dayToDeleteIndex].dayNumber : '' }}?
            </p>
            <p class="text-warning" *ngIf="dayToDeleteIndex !== null && itineraryDays[dayToDeleteIndex].items.length > 0">
              ⚠️ This day contains <strong>{{ itineraryDays[dayToDeleteIndex].items.length }} scheduled activity(s)</strong>.
              All associated schedules will be permanently deleted and subsequent days will be renumbered.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDeleteDayModal = false">Cancel</button>
            <button class="btn btn-danger" (click)="executeDeleteDay()">Yes, Delete Day</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-trip-page {
      padding: 28px 36px;
      max-width: 1650px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #fff;
    }

    .page-subtitle {
      font-size: 0.86rem;
      color: var(--text-muted);
      margin-top: 3px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .trip-grid {
      display: grid;
      grid-template-columns: 1.25fr 1.35fr 0.9fr;
      gap: 24px;
      align-items: flex-start;
    }

    .section-card {
      background: #14141c;
      border: 1px solid #242434;
      border-radius: var(--radius-md);
      padding: 24px;
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #20202e;
    }

    .section-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #20202e;
    }

    .days-counter {
      font-size: 0.78rem;
      color: var(--primary);
      font-weight: 600;
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .block-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
      display: block;
    }

    .req {
      color: var(--primary);
    }

    input, select, textarea {
      background: #1a1a26;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      color: #fff;
      font-size: 0.88rem;
      outline: none;
      transition: border-color var(--transition-fast);
      width: 100%;
    }

    input:focus, select:focus, textarea:focus {
      border-color: var(--primary);
    }

    .file-hint {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 4px;
      word-break: break-all;
    }

    .assignment-block {
      background: #191924;
      border: 1px solid #272738;
      border-radius: var(--radius-sm);
      padding: 14px;
    }

    .selector-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip-option {
      background: #20202e;
      border: 1px solid #2d2d40;
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 0.78rem;
      color: #c4c4d6;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .chip-option.selected {
      background: rgba(255, 69, 0, 0.15);
      border-color: var(--primary);
      color: #fff;
    }

    .chip-option input[type="checkbox"] {
      display: none;
    }

    .custom-fields-box {
      margin-top: 14px;
      background: #181824;
      border: 1px solid #272738;
      border-radius: var(--radius-sm);
      padding: 16px;
    }

    .custom-heading {
      font-size: 0.92rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 12px;
    }

    /* Itinerary Days */
    .itinerary-days-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .day-card {
      background: #171722;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 16px;
    }

    .day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #222232;
    }

    .day-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .day-badge {
      background: var(--primary);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .day-title-input {
      width: auto;
      min-width: 140px;
      max-width: 200px;
      padding: 4px 8px;
      font-size: 0.84rem;
      background: #1f1f2e;
    }

    .day-date-hint {
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .day-actions {
      display: flex;
      align-items: center;
      gap: 6px;
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
      padding: 4px 10px;
      font-size: 0.76rem;
    }

    /* Schedules */
    .schedules-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .schedule-item-row {
      background: #1e1e2c;
      border: 1px solid #2a2a3e;
      border-radius: 6px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sched-main {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sched-time-pill {
      background: #272738;
      color: #38bdf8;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .sched-desc-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sched-act-title {
      font-size: 0.88rem;
      color: #fff;
    }

    .sched-meta {
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .sched-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-pill {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .status-scheduled { background: #1e293b; color: #94a3b8; }
    .status-inprogress { background: #1e3a5f; color: #38bdf8; }
    .status-completed { background: #064e3b; color: #34d399; }
    .status-delayed { background: #7c2d12; color: #fb923c; }

    .del-sched-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.88rem;
    }

    .del-sched-btn:hover {
      color: #ef4444;
    }

    .no-sched {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-align: center;
      padding: 12px;
    }

    /* INLINE SCHEDULE FORM */
    .inline-schedule-box {
      margin-top: 10px;
      background: #1c1c2a;
      border: 1px solid var(--primary);
      border-radius: var(--radius-sm);
      padding: 16px;
    }

    .inline-sched-heading {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .inline-form-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .inline-field {
      flex: 1;
      min-width: 110px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .inline-field.flex-2 { flex: 2; min-width: 180px; }
    .inline-field.flex-3 { flex: 3; min-width: 220px; }

    .inline-actions-row {
      margin-top: 14px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* Payment & Margins */
    .price-section {
      background: #181824;
      border: 1px solid #272738;
      border-radius: var(--radius-sm);
      padding: 16px;
    }

    .price-heading {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 12px;
    }

    .price-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .computed-price {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #242436;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.84rem;
      color: var(--text-muted);
    }

    .price-tag {
      font-size: 1.15rem;
      color: var(--primary);
    }

    .commercial-summary-box {
      margin-top: 24px;
      background: #191926;
      border: 1px solid #2a2a3e;
      border-radius: var(--radius-sm);
      padding: 16px;
    }

    .summary-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 10px;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      color: #c4c4d6;
      margin-bottom: 6px;
    }

    .highlight-margin {
      border-top: 1px solid #29293c;
      padding-top: 8px;
      font-size: 0.88rem;
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #181824;
      border: 1px solid #2c2c3e;
      border-radius: var(--radius-md);
      width: 100%;
      max-width: 480px;
      padding: 24px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .modal-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
    }

    .close-x {
      background: none;
      border: none;
      color: #fff;
      font-size: 1.1rem;
      cursor: pointer;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .text-danger { color: #ef4444; }
    .text-warning { color: #f59e0b; }
    .text-success { color: #10b981; }
  `]
})
export class CreateTripComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal<boolean>(false);
  editTripId: string | null = null;

  // Form Fields
  tripCode = '';
  tripName = '';
  thumbnailUrl = '';
  status = 'Draft';
  category = 'Family Trip';
  origin = '';
  destination = '';
  via = '';
  startDateTime = '2026-12-21T10:00';
  endDateTime = '2026-12-23T22:00';
  duration = '3D 2N';
  totalSeats = 40;
  foodInfo = 'With Food and Snacks';
  pickupDrop = 'Available with extra charges';
  description = '';

  // Pricing
  adultSpends = 4200;
  adultMargin = 2300;
  adultPrice = 6500;
  childSpends = 3900;
  childMargin = 2099;
  childPrice = 5999;

  // Assignments
  availableMembers: MemberItem[] = [];
  selectedMemberIds: string[] = [];

  availableResources: ResourceItem[] = [];
  selectedResourceIds: string[] = [];

  // Dynamic Custom Fields for Trips
  tripCustomFields: CustomField[] = [];
  customFieldValues: Record<string, any> = {};

  // Autocomplete Suggestions
  locationSuggestions: string[] = [
    'Tirunelveli', 'Kochi', 'Munnar', 'Madurai', 'Theni',
    'Bangalore', 'Chennai', 'Ooty', 'Kodaikanal', 'Goa',
    'Alappuzha', 'Wayanad', 'Coorg', 'Bali', 'Singapore'
  ];

  // Itinerary Days
  itineraryDays: EditableDay[] = [
    {
      dayNumber: 1,
      title: 'Day 1: Departure & Journey',
      dayDate: '2026-12-21T10:00:00Z',
      items: [
        { timeString: '10:00', activity: 'Departure from Origin Bus Stand', activityType: 'Transit', status: 'Scheduled', location: 'Tnvl Bus Stand' }
      ]
    },
    {
      dayNumber: 2,
      title: 'Day 2: Sightseeing Tour',
      dayDate: '2026-12-22T09:00:00Z',
      items: []
    },
    {
      dayNumber: 3,
      title: 'Day 3: Return & Drop',
      dayDate: '2026-12-23T18:00:00Z',
      items: [
        { timeString: '21:30', activity: 'Return to Destination Drop Point', activityType: 'Transit', status: 'Scheduled', location: 'Drop point' }
      ]
    }
  ];

  // INLINE Schedule Form State (NO MODAL/POPUP!)
  activeInlineDayIndex: number | null = null;
  inlineTime = '10:00';
  inlineActivity = '';
  inlineType = 'Sightseeing';
  inlineStatus = 'Scheduled';
  inlineLocation = '';
  inlineNotes = '';

  // Delete Day Confirmation State
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
    this.api.getMembers().subscribe({
      next: res => this.availableMembers = res
    });

    this.api.getResources({ pageSize: 50 }).subscribe({
      next: res => this.availableResources = res.items
    });
  }

  loadCustomFields() {
    this.api.getCustomFields('Trip').subscribe({
      next: fields => this.tripCustomFields = fields
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

  isMemberSelected(id: string): boolean {
    return this.selectedMemberIds.includes(id);
  }

  toggleMemberSelection(id: string) {
    if (this.selectedMemberIds.includes(id)) {
      this.selectedMemberIds = this.selectedMemberIds.filter(x => x !== id);
    } else {
      this.selectedMemberIds.push(id);
    }
  }

  isResourceSelected(id: string): boolean {
    return this.selectedResourceIds.includes(id);
  }

  toggleResourceSelection(id: string) {
    if (this.selectedResourceIds.includes(id)) {
      this.selectedResourceIds = this.selectedResourceIds.filter(x => x !== id);
    } else {
      this.selectedResourceIds.push(id);
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
        if (trip.assignedTeamMemberIds) {
          this.selectedMemberIds = [...trip.assignedTeamMemberIds];
        } else if (trip.teamMembers) {
          this.selectedMemberIds = trip.teamMembers.map(m => m.memberId);
        }

        if (trip.assignedResourceIds) {
          this.selectedResourceIds = [...trip.assignedResourceIds];
        } else if (trip.resources) {
          this.selectedResourceIds = trip.resources.map(r => r.resourceId);
        }

        // Populate Custom Field Values
        if (trip.customFieldsJson) {
          try {
            this.customFieldValues = JSON.parse(trip.customFieldsJson);
          } catch {
            this.customFieldValues = {};
          }
        }

        // Populate Days & Schedules
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
        } else if (trip.schedules && trip.schedules.length > 0) {
          // Backward-compatible grouping
          const grouped = new Map<number, any[]>();
          trip.schedules.forEach(s => {
            if (!grouped.has(s.dayNumber)) grouped.set(s.dayNumber, []);
            grouped.get(s.dayNumber)!.push({
              id: s.id,
              timeString: s.timeString,
              activity: s.activity,
              description: s.description,
              activityType: s.activityType || 'Sightseeing',
              status: s.status || 'Scheduled',
              location: s.location
            });
          });

          this.itineraryDays = Array.from(grouped.entries()).map(([dayNumber, items]) => ({
            dayNumber,
            title: `Day ${dayNumber}`,
            dayDate: trip.startDateTime,
            items
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
          this.toast.success('Thumbnail uploaded successfully.');
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
    this.toast.success(`Day ${nextDay} added.`);
  }

  confirmDeleteDay(index: number) {
    this.dayToDeleteIndex = index;
    this.showDeleteDayModal = true;
  }

  executeDeleteDay() {
    if (this.dayToDeleteIndex === null) return;
    this.itineraryDays.splice(this.dayToDeleteIndex, 1);
    
    // Sequential renumbering
    this.itineraryDays.forEach((d, i) => {
      d.dayNumber = i + 1;
      if (!d.title || d.title.startsWith('Day ')) {
        d.title = `Day ${i + 1}`;
      }
    });

    this.showDeleteDayModal = false;
    this.dayToDeleteIndex = null;
    this.toast.success('Itinerary day removed.');
  }

  moveDay(index: number, delta: number) {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= this.itineraryDays.length) return;

    const temp = this.itineraryDays[index];
    this.itineraryDays[index] = this.itineraryDays[targetIndex];
    this.itineraryDays[targetIndex] = temp;

    // Renumber after swap
    this.itineraryDays.forEach((d, i) => {
      d.dayNumber = i + 1;
    });
  }

  // INLINE SCHEDULE FORM OPERATIONS
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

  saveInlineSchedule(dayIndex: number) {
    if (!this.inlineActivity.trim()) {
      this.toast.error('Activity Title is required.');
      return;
    }

    const day = this.itineraryDays[dayIndex];
    day.items.push({
      timeString: this.inlineTime,
      activity: this.inlineActivity.trim(),
      activityType: this.inlineType,
      status: this.inlineStatus,
      location: this.inlineLocation.trim(),
      notes: this.inlineNotes.trim()
    });

    this.closeInlineScheduleForm();
    this.toast.success('Schedule item added inline.');
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

    // Prepare days and flattened schedules
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

    // In Edit mode, preserve existing status unless user selected another
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
        }
      });
    }
  }
}
