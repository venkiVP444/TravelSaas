import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { TripSchedule } from '../../models/models';

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
          <p class="page-subtitle">You can create the detailed trip here</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="saveTrip(false)">Save as a draft</button>
          <button class="btn btn-primary" (click)="saveTrip(true)">Publish</button>
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
                <label>Upload Thumbnail</label>
                <input type="file" (change)="onFileSelected($event)" accept="image/*" />
                <span class="file-hint" *ngIf="thumbnailUrl">{{ thumbnailUrl }}</span>
              </div>
              <div class="form-field">
                <label>Trip Type / Category</label>
                <select [(ngModel)]="category">
                  <option value="Family Trip">Family Trip</option>
                  <option value="Honeymoon">Honeymoon</option>
                  <option value="Couple">Couple</option>
                  <option value="Adventure">Adventure</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Origin <span class="req">*</span></label>
                <input type="text" [(ngModel)]="origin" placeholder="e.g. Tirunelveli" />
              </div>
              <div class="form-field">
                <label>Destination <span class="req">*</span></label>
                <input type="text" [(ngModel)]="destination" placeholder="e.g. Munnar" />
              </div>
            </div>

            <div class="form-field">
              <label>Via Route</label>
              <input type="text" [(ngModel)]="via" placeholder="e.g. Madurai - Theni" />
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
                <label>Food Info</label>
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
          </div>
        </div>

        <!-- Column 2: Add Itinerary -->
        <div class="section-card">
          <div class="section-header-flex">
            <h2 class="section-title">Add Itinerary</h2>
            <button class="btn btn-outline-primary btn-sm" (click)="addItineraryDay()">+ Add Day</button>
          </div>

          <div class="itinerary-days-list">
            <div *ngFor="let day of itineraryDays; let dIndex = index" class="day-card">
              <div class="day-header">
                <span class="day-title">Day {{ day.dayNumber }}</span>
                <button class="add-schedule-btn" (click)="openAddScheduleModal(day.dayNumber)">
                  + Add Schedule
                </button>
              </div>

              <!-- Schedules for this day -->
              <div class="schedules-list">
                <div *ngFor="let item of day.items; let sIndex = index" class="schedule-row">
                  <span class="sched-time">{{ item.timeString }}</span>
                  <span class="sched-act">{{ item.activity }}</span>
                  <button class="del-sched-btn" (click)="removeScheduleItem(dIndex, sIndex)">✕</button>
                </div>
                <div *ngIf="day.items.length === 0" class="no-sched">
                  No schedule added yet for this day.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 3: Payment Details -->
        <div class="section-card">
          <h2 class="section-title">Payment Details</h2>

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

            <!-- Price per Children -->
            <div class="price-section" style="margin-top: 24px;">
              <h3 class="price-heading">Price per Children</h3>
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
          </div>
        </div>
      </div>

      <!-- Add Schedule Modal -->
      <div class="modal-backdrop" *ngIf="showScheduleModal" (click)="closeScheduleModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Schedule for Day {{ currentScheduleDay }}</h3>
            <button class="close-x" (click)="closeScheduleModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label>Time</label>
              <input type="text" [(ngModel)]="newSchedTime" placeholder="e.g. 10:00 AM" />
            </div>
            <div class="form-field">
              <label>Activity / Stop</label>
              <input type="text" [(ngModel)]="newSchedActivity" placeholder="e.g. Visit Mattupetty Dam" />
            </div>
            <div class="form-field">
              <label>Location (Optional)</label>
              <input type="text" [(ngModel)]="newSchedLocation" placeholder="e.g. Munnar, Kerala" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeScheduleModal()">Cancel</button>
            <button class="btn btn-primary" (click)="commitScheduleItem()">Add Schedule</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-trip-page {
      padding: 28px 36px;
      max-width: 1600px;
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
      grid-template-columns: 1.3fr 1.3fr 0.9fr;
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

    .section-header-flex .section-title {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
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

    .form-field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .req {
      color: var(--primary);
    }

    .file-hint {
      font-size: 0.74rem;
      color: #38bdf8;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Itinerary Column */
    .itinerary-days-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .day-card {
      background: #181824;
      border: 1px solid #262638;
      border-radius: var(--radius-sm);
      padding: 16px;
    }

    .day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .day-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #fff;
    }

    .add-schedule-btn {
      color: #38bdf8;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .schedules-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .schedule-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1f1f2e;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.84rem;
    }

    .sched-time {
      color: #94a3b8;
      font-weight: 600;
      min-width: 80px;
    }

    .sched-act {
      color: #fff;
      flex: 1;
      margin: 0 12px;
    }

    .del-sched-btn {
      color: #ef4444;
      font-size: 0.8rem;
    }

    .no-sched {
      color: var(--text-dim);
      font-size: 0.8rem;
      font-style: italic;
    }

    /* Payments Column */
    .price-section {
      background: #181824;
      border: 1px solid #262638;
      border-radius: var(--radius-sm);
      padding: 18px;
    }

    .price-heading {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 14px;
    }

    .price-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .computed-price {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #28283a;
      padding-top: 12px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .price-tag {
      font-size: 1.25rem;
      color: var(--primary);
    }

    /* Modal */
    .modal-content {
      background: #181824;
      border: 1px solid #2d2d42;
      border-radius: var(--radius-md);
      width: 440px;
      padding: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }

    .modal-header h3 {
      font-size: 1.1rem;
      color: #fff;
    }

    .close-x {
      font-size: 1.1rem;
      color: #8b8b9f;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class CreateTripComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal(false);
  editTripId: string | null = null;

  // Form Fields
  tripCode = '';
  tripName = '';
  thumbnailUrl = '';
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

  // Itinerary
  itineraryDays: { dayNumber: number; items: { timeString: string; activity: string; location?: string }[] }[] = [
    {
      dayNumber: 1,
      items: [{ timeString: '10:00 AM', activity: 'Started (Tnvl New bus stand)' }]
    },
    {
      dayNumber: 2,
      items: []
    },
    {
      dayNumber: 3,
      items: [{ timeString: '09:30 PM', activity: 'Return to Tnvl' }]
    }
  ];

  // Schedule Modal
  showScheduleModal = false;
  currentScheduleDay = 1;
  newSchedTime = '10:00 AM';
  newSchedActivity = '';
  newSchedLocation = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.editTripId = params['id'];
        this.loadTripForEdit(params['id']);
      }
    });
  }

  loadTripForEdit(id: string) {
    this.api.getTripById(id).subscribe({
      next: trip => {
        this.tripCode = trip.tripCode;
        this.tripName = trip.name;
        this.thumbnailUrl = trip.thumbnailUrl || '';
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

        // Group schedules by day
        if (trip.schedules && trip.schedules.length > 0) {
          const grouped = new Map<number, any[]>();
          trip.schedules.forEach(s => {
            if (!grouped.has(s.dayNumber)) {
              grouped.set(s.dayNumber, []);
            }
            grouped.get(s.dayNumber)!.push({
              timeString: s.timeString,
              activity: s.activity,
              location: s.location
            });
          });

          this.itineraryDays = Array.from(grouped.entries()).map(([dayNumber, items]) => ({
            dayNumber,
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

  addItineraryDay() {
    const nextDay = this.itineraryDays.length + 1;
    this.itineraryDays.push({
      dayNumber: nextDay,
      items: []
    });
  }

  openAddScheduleModal(dayNumber: number) {
    this.currentScheduleDay = dayNumber;
    this.newSchedTime = '10:00 AM';
    this.newSchedActivity = '';
    this.newSchedLocation = '';
    this.showScheduleModal = true;
  }

  closeScheduleModal() {
    this.showScheduleModal = false;
  }

  commitScheduleItem() {
    if (!this.newSchedActivity.trim()) {
      this.toast.error('Please enter an activity description.');
      return;
    }

    const dayObj = this.itineraryDays.find(d => d.dayNumber === this.currentScheduleDay);
    if (dayObj) {
      dayObj.items.push({
        timeString: this.newSchedTime,
        activity: this.newSchedActivity,
        location: this.newSchedLocation
      });
    }

    this.closeScheduleModal();
    this.toast.success('Schedule item added.');
  }

  removeScheduleItem(dayIndex: number, itemIndex: number) {
    this.itineraryDays[dayIndex].items.splice(itemIndex, 1);
  }

  saveTrip(publishImmediately: boolean) {
    if (!this.tripName.trim()) {
      this.toast.error('Trip Name is required.');
      return;
    }
    if (!this.origin.trim() || !this.destination.trim()) {
      this.toast.error('Origin and Destination are required.');
      return;
    }

    // Flatten schedules
    const schedules: any[] = [];
    const baseDate = new Date(this.startDateTime || Date.now());

    this.itineraryDays.forEach(day => {
      const dayDate = new Date(baseDate);
      dayDate.setDate(dayDate.getDate() + (day.dayNumber - 1));

      day.items.forEach(item => {
        schedules.push({
          dayNumber: day.dayNumber,
          dayDate: dayDate.toISOString(),
          timeString: item.timeString,
          activity: item.activity,
          location: item.location
        });
      });
    });

    const payload = {
      tripCode: this.tripCode,
      name: this.tripName,
      description: this.description,
      thumbnailUrl: this.thumbnailUrl,
      category: this.category,
      origin: this.origin,
      destination: this.destination,
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
      schedules
    };

    if (this.isEditMode() && this.editTripId) {
      this.api.updateTrip(this.editTripId, payload).subscribe({
        next: () => {
          this.toast.success('Trip updated successfully.');
          if (publishImmediately) {
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
          this.toast.success('Trip created successfully.');
          if (publishImmediately) {
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
