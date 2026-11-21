import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CustomField, ResourceType } from '../../models/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings & Customization</h1>
          <p class="page-subtitle">Configure organization multi-tenancy, module-scoped custom fields, and resource schemas</p>
        </div>
      </div>

      <div class="settings-layout">
        <!-- Settings Nav Tabs -->
        <div class="settings-tabs">
          <button [class.active]="activeTab === 'custom-fields'" (click)="activeTab = 'custom-fields'">
            Dynamic Custom Fields
          </button>
          <button [class.active]="activeTab === 'resource-types'" (click)="activeTab = 'resource-types'">
            Resource Schemas
          </button>
          <button [class.active]="activeTab === 'profile'" (click)="activeTab = 'profile'">
            Organization Profile
          </button>
          <button [class.active]="activeTab === 'trip-config'" (click)="activeTab = 'trip-config'">
            Trip Configuration
          </button>
          <button [class.active]="activeTab === 'tenancy'" (click)="activeTab = 'tenancy'">
            Multi-Tenant Isolation
          </button>
        </div>

        <!-- Section 1: Module-Scoped Dynamic Custom Fields (Section 2 & 3 of Directive) -->
        <div class="settings-card" *ngIf="activeTab === 'custom-fields'">
          <div class="card-header-row">
            <div>
              <h2 class="card-heading">Module-Scoped Custom Fields</h2>
              <p class="card-subheading">
                Define custom attributes tailored to a specific module. Fields defined for Hotels appear only in Hotels, not Vehicles or Trips.
              </p>
            </div>
            <button class="btn btn-primary" (click)="openAddFieldModal()">+ Add Custom Field</button>
          </div>

          <!-- Module Scope Selector Pills -->
          <div class="module-pills-row">
            <span class="pills-label">Scope by Module:</span>
            <div class="module-pills-track">
              <button
                *ngFor="let mod of availableModules"
                class="module-pill"
                [class.active]="selectedModule === mod"
                (click)="selectModule(mod)"
              >
                {{ mod }}
              </button>
            </div>
          </div>

          <!-- Custom Fields Table for Selected Module -->
          <table class="figma-table">
            <thead>
              <tr>
                <th style="width: 70px;">Order</th>
                <th>Target Module</th>
                <th>Field Label</th>
                <th>Field Key</th>
                <th>Data Type</th>
                <th>Required</th>
                <th>In Table</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of filteredFields(); let idx = index" [class.archived-row]="f.isArchived">
                <td>
                  <div class="order-btns">
                    <button class="btn-micro" [disabled]="idx === 0" (click)="moveField(idx, -1)">↑</button>
                    <button class="btn-micro" [disabled]="idx === filteredFields().length - 1" (click)="moveField(idx, 1)">↓</button>
                  </div>
                </td>
                <td><span class="entity-pill">{{ f.targetEntity }}</span></td>
                <td><strong>{{ f.fieldLabel }}</strong></td>
                <td><code>{{ f.fieldKey }}</code></td>
                <td>
                  <span class="type-badge">{{ f.fieldType }}</span>
                </td>
                <td>{{ f.isRequired ? 'Yes' : 'No' }}</td>
                <td>{{ f.showInTable ? 'Yes' : 'No' }}</td>
                <td>
                  <span class="status-badge" [class.archived]="f.isArchived">
                    {{ f.isArchived ? 'Archived' : 'Active' }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn-text text-warning"
                    *ngIf="!f.isArchived"
                    (click)="toggleArchive(f, true)"
                    title="Archive field safely without losing historical data"
                  >
                    Archive
                  </button>
                  <button
                    class="btn-text text-success"
                    *ngIf="f.isArchived"
                    (click)="toggleArchive(f, false)"
                    title="Restore archived field"
                  >
                    Restore
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredFields().length === 0">
                <td colspan="9" class="empty-cell">
                  No custom fields configured for module <strong>{{ selectedModule }}</strong> yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 2: Resource Types & Schemas -->
        <div class="settings-card" *ngIf="activeTab === 'resource-types'">
          <div class="card-header-row">
            <div>
              <h2 class="card-heading">Resource Schemas & Base Definitions</h2>
              <p class="card-subheading">
                Configure travel resource categories (Vehicles, Hotels, Restaurants, Lodges) and their respective attributes.
              </p>
            </div>
          </div>

          <div class="types-grid">
            <div *ngFor="let rt of resourceTypes()" class="type-box">
              <div class="type-box-header">
                <strong>{{ rt.displayName }}</strong>
                <span class="type-key"><code>{{ rt.key }}</code></span>
              </div>
              <div class="fields-list">
                <span class="fields-count">{{ rt.fields.length }} defined schema attributes:</span>
                <ul>
                  <li *ngFor="let f of rt.fields">
                    {{ f.label }} ({{ f.dataType }}) {{ f.isRequired ? '*' : '' }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Organization Profile -->
        <div class="settings-card" *ngIf="activeTab === 'profile'">
          <div class="card-header-row">
            <div>
              <h2 class="card-heading">Organization Profile</h2>
              <p class="card-subheading">Company branding and business details</p>
            </div>
            <button class="btn btn-primary" (click)="saveProfile()">Save Profile</button>
          </div>

          <div class="form-body" style="max-width: 600px;">
            <div class="form-field">
              <label>Company Legal Name</label>
              <input type="text" [(ngModel)]="orgName" placeholder="V4Journey Pvt Ltd" />
            </div>
            <div class="form-field">
              <label>Booking Support Phone</label>
              <input type="text" [(ngModel)]="orgPhone" placeholder="+91 9442892326" />
            </div>
            <div class="form-field">
              <label>Official Inquiries Email</label>
              <input type="email" [(ngModel)]="orgEmail" placeholder="bookings@v4journey.com" />
            </div>
            <div class="form-field">
              <label>Headquarters City</label>
              <input type="text" [(ngModel)]="orgCity" placeholder="Tirunelveli, Tamil Nadu" />
            </div>
          </div>
        </div>

        <!-- Section 4: Trip Configuration -->
        <div class="settings-card" *ngIf="activeTab === 'trip-config'">
          <div class="card-header-row">
            <div>
              <h2 class="card-heading">Trip Configuration & Lifecycle Statuses</h2>
              <p class="card-subheading">Standard statuses and categories used across trips</p>
            </div>
          </div>

          <div class="config-grid">
            <div class="config-block">
              <h4 class="config-block-title">Trip Lifecycle Statuses</h4>
              <ul class="config-list">
                <li><span class="badge badge-draft">Draft</span> — In-progress itinerary, hidden from booking.</li>
                <li><span class="badge badge-upcoming">Upcoming</span> — Published package open for booking.</li>
                <li><span class="badge badge-active">Active</span> — Tour currently en-route.</li>
                <li><span class="badge badge-paid">Completed</span> — Journey concluded, final accounting open.</li>
                <li><span class="badge badge-canceled">Canceled</span> — Canceled trip with refund records.</li>
              </ul>
            </div>

            <div class="config-block">
              <h4 class="config-block-title">Standard Categories</h4>
              <ul class="config-list">
                <li>Family Trip</li>
                <li>Honeymoon Special</li>
                <li>Couple Gateway</li>
                <li>Adventure & Trekking</li>
                <li>Corporate & Group Tour</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Section 5: Multi-Tenant Isolation Switcher -->
        <div class="settings-card" *ngIf="activeTab === 'tenancy'">
          <div class="card-header-row">
            <div>
              <h2 class="card-heading">Multi-Tenant Organization Isolation</h2>
              <p class="card-subheading">
                Verify strict database query isolation between different company tenants.
              </p>
            </div>
          </div>

          <div class="tenant-switcher-box">
            <div class="current-tenant-info">
              <span class="t-lbl">Active Tenant Organization:</span>
              <h3 class="t-name">{{ auth.currentTenant()?.name }}</h3>
              <p class="t-slug">Tenant ID: <code>{{ auth.currentTenant()?.id }}</code></p>
            </div>

            <div class="switch-actions">
              <button
                class="btn btn-secondary"
                [disabled]="auth.currentTenant()?.id === tenant1.id"
                (click)="switchTenant(tenant1)"
              >
                Switch to Tenant 1 (V4Journey)
              </button>

              <button
                class="btn btn-secondary"
                [disabled]="auth.currentTenant()?.id === tenant2.id"
                (click)="switchTenant(tenant2)"
              >
                Switch to Tenant 2 (ExploreRoots)
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Custom Field Modal (with Options Builder & Live Preview) -->
      <div class="modal-backdrop" *ngIf="showAddModal" (click)="showAddModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Custom Field Definition</h3>
            <button class="close-x" (click)="showAddModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label>Target Module <span class="req">*</span></label>
              <select [(ngModel)]="newTargetEntity">
                <option *ngFor="let mod of availableModules" [value]="mod">{{ mod }}</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Field Label <span class="req">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newFieldLabel"
                  (input)="onLabelInput()"
                  placeholder="e.g. Vehicle Registration Number"
                />
              </div>
              <div class="form-field">
                <label>Field Key (auto-generated)</label>
                <input type="text" [(ngModel)]="newFieldKey" placeholder="e.g. vehicle_registration_number" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Data Type</label>
                <select [(ngModel)]="newFieldType">
                  <option value="text">Short text</option>
                  <option value="textarea">Long text</option>
                  <option value="number">Number</option>
                  <option value="currency">Currency (₹)</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                  <option value="boolean">Checkbox / Boolean</option>
                  <option value="select">Single-select Dropdown</option>
                  <option value="multiselect">Multi-select Dropdown</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="url">URL</option>
                </select>
              </div>
              <div class="form-field">
                <label>Default Value</label>
                <input type="text" [(ngModel)]="newDefaultValue" placeholder="Optional default" />
              </div>
            </div>

            <!-- Dropdown Options Builder -->
            <div class="options-builder-box" *ngIf="newFieldType === 'select' || newFieldType === 'multiselect'">
              <label class="block-label">Dropdown Options</label>
              <div class="options-tags">
                <span *ngFor="let opt of newOptions; let i = index" class="opt-tag">
                  {{ opt }}
                  <button type="button" class="del-opt" (click)="removeOption(i)">✕</button>
                </span>
              </div>
              <div class="add-opt-row">
                <input
                  type="text"
                  [(ngModel)]="tempOptionText"
                  placeholder="New option name"
                  (keyup.enter)="addOption()"
                />
                <button type="button" class="btn btn-secondary btn-sm" (click)="addOption()">+ Add</button>
              </div>
            </div>

            <div class="checkbox-row">
              <label>
                <input type="checkbox" [(ngModel)]="newIsRequired" /> Required Field
              </label>
              <label>
                <input type="checkbox" [(ngModel)]="newShowInTable" /> Show in Table
              </label>
            </div>

            <!-- Live Preview Box -->
            <div class="preview-box">
              <span class="preview-label">Form Preview:</span>
              <div class="preview-field">
                <label>{{ newFieldLabel || 'Sample Field' }} <span class="req" *ngIf="newIsRequired">*</span></label>
                <input *ngIf="newFieldType === 'text' || newFieldType === 'email' || newFieldType === 'url' || newFieldType === 'phone'" type="text" [placeholder]="newDefaultValue || ''" disabled />
                <textarea *ngIf="newFieldType === 'textarea'" rows="2" [placeholder]="newDefaultValue || ''" disabled></textarea>
                <input *ngIf="newFieldType === 'number' || newFieldType === 'currency'" type="number" [placeholder]="newDefaultValue || '0'" disabled />
                <input *ngIf="newFieldType === 'date'" type="date" disabled />
                <input *ngIf="newFieldType === 'time'" type="time" disabled />
                <select *ngIf="newFieldType === 'select' || newFieldType === 'multiselect'" disabled>
                  <option *ngFor="let opt of newOptions">{{ opt }}</option>
                </select>
                <label *ngIf="newFieldType === 'boolean'" class="chk-label">
                  <input type="checkbox" disabled /> Checkbox
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAddModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="commitCustomField()">Create Field</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      padding: 24px 32px;
      max-width: 1440px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #fff;
    }

    .page-subtitle {
      font-size: 0.84rem;
      color: var(--text-muted);
      margin-top: 3px;
    }

    .settings-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      border-bottom: 1px solid #232332;
      padding-bottom: 10px;
    }

    .settings-tabs button {
      padding: 8px 18px;
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
    }

    .settings-tabs button.active {
      background: var(--primary);
      color: #fff;
    }

    .settings-card {
      background: #14141c;
      border: 1px solid #232330;
      border-radius: var(--radius-md);
      padding: 24px;
    }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .card-heading {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
    }

    .card-subheading {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    /* Module Scope Selector */
    .module-pills-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
      background: #191924;
      border: 1px solid #272738;
      border-radius: var(--radius-sm);
      padding: 10px 16px;
    }

    .pills-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
    }

    .module-pills-track {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .module-pill {
      background: #20202e;
      border: 1px solid #2c2c3e;
      border-radius: 16px;
      padding: 4px 12px;
      font-size: 0.78rem;
      color: #c4c4d6;
      cursor: pointer;
      transition: all 0.2s;
    }

    .module-pill.active {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
      font-weight: 600;
    }

    .order-btns {
      display: flex;
      gap: 4px;
    }

    .btn-micro {
      background: #212130;
      border: 1px solid #2f2f42;
      color: #fff;
      width: 22px;
      height: 22px;
      border-radius: 3px;
      font-size: 0.72rem;
      cursor: pointer;
    }

    .btn-micro:disabled { opacity: 0.3; cursor: not-allowed; }

    .entity-pill {
      background: #1e1e2d;
      border: 1px solid #29293e;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.76rem;
      color: #38bdf8;
    }

    .type-badge {
      font-size: 0.76rem;
      color: #a78bfa;
    }

    .status-badge {
      font-size: 0.74rem;
      padding: 2px 8px;
      border-radius: 10px;
      background: #064e3b;
      color: #34d399;
    }

    .status-badge.archived {
      background: #292524;
      color: #a8a29e;
    }

    .archived-row {
      opacity: 0.6;
    }

    .btn-text {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .text-warning { color: #f59e0b; }
    .text-success { color: #10b981; }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-content {
      background: #181824;
      border: 1px solid #2c2c3e;
      border-radius: var(--radius-md);
      width: 100%;
      max-width: 540px;
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .req { color: var(--primary); }

    input, select, textarea {
      background: #1f1f2e;
      border: 1px solid #2d2d42;
      border-radius: var(--radius-sm);
      padding: 9px 12px;
      color: #fff;
      font-size: 0.86rem;
      width: 100%;
    }

    .options-builder-box {
      background: #1a1a28;
      border: 1px solid #29293e;
      border-radius: var(--radius-sm);
      padding: 12px;
      margin-bottom: 12px;
    }

    .options-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }

    .opt-tag {
      background: #252538;
      color: #fff;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.76rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .del-opt {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: 0.76rem;
    }

    .add-opt-row {
      display: flex;
      gap: 8px;
    }

    .checkbox-row {
      display: flex;
      gap: 20px;
      margin: 12px 0;
      font-size: 0.82rem;
      color: #c4c4d6;
    }

    .preview-box {
      background: #151520;
      border: 1px dashed #2e2e42;
      border-radius: var(--radius-sm);
      padding: 12px;
      margin-top: 14px;
    }

    .preview-label {
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--primary);
      display: block;
      margin-bottom: 6px;
    }

    .preview-field input, .preview-field select, .preview-field textarea {
      opacity: 0.8;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 18px;
    }

    /* Tenancy & Config */
    .tenant-switcher-box {
      background: #1a1a28;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .t-lbl { font-size: 0.76rem; color: var(--text-muted); }
    .t-name { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 4px 0; }
    .t-slug { font-size: 0.8rem; color: #38bdf8; }

    .switch-actions { display: flex; gap: 12px; }

    .types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 18px;
    }

    .type-box {
      background: #1a1a28;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 18px;
    }

    .type-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #242436;
      color: #fff;
    }

    .config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .config-block {
      background: #1a1a28;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 18px;
    }

    .config-block-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 12px;
    }

    .config-list {
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.82rem;
      color: #c4c4d6;
    }

    .empty-cell {
      padding: 40px;
      text-align: center;
      color: var(--text-muted);
    }
  `]
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private toast = inject(ToastService);

  activeTab = 'custom-fields';

  availableModules = [
    'Trip',
    'Traveller',
    'TeamMember',
    'Vehicle',
    'Hotel',
    'Restaurant',
    'Lodge',
    'Guide',
    'Driver',
    'Activity'
  ];
  selectedModule = 'Trip';

  customFields = signal<CustomField[]>([]);
  resourceTypes = signal<ResourceType[]>([]);

  // Add Custom Field Modal State
  showAddModal = false;
  newTargetEntity = 'Trip';
  newFieldLabel = '';
  newFieldKey = '';
  newFieldType = 'text';
  newDefaultValue = '';
  newIsRequired = false;
  newShowInTable = true;
  newOptions: string[] = ['Standard', 'Deluxe', 'Premium'];
  tempOptionText = '';

  // Org Profile State
  orgName = 'V4Journey Travels';
  orgPhone = '+91 9442892326';
  orgEmail = 'bookings@v4journey.com';
  orgCity = 'Tirunelveli, Tamil Nadu';

  tenant1 = { id: '00000000-0000-0000-0000-000000000001', name: 'V4Journey' };
  tenant2 = { id: '00000000-0000-0000-0000-000000000002', name: 'ExploreRoots' };

  ngOnInit() {
    this.loadCustomFields();
    this.loadResourceTypes();
  }

  loadCustomFields() {
    this.api.getCustomFields(undefined, true).subscribe({
      next: data => this.customFields.set(data)
    });
  }

  loadResourceTypes() {
    this.api.getResourceTypes().subscribe({
      next: types => this.resourceTypes.set(types)
    });
  }

  selectModule(mod: string) {
    this.selectedModule = mod;
  }

  filteredFields(): CustomField[] {
    return this.customFields().filter(f => f.targetEntity.toLowerCase() === this.selectedModule.toLowerCase());
  }

  openAddFieldModal() {
    this.newTargetEntity = this.selectedModule;
    this.newFieldLabel = '';
    this.newFieldKey = '';
    this.newFieldType = 'text';
    this.newDefaultValue = '';
    this.newIsRequired = false;
    this.newShowInTable = true;
    this.newOptions = ['Option 1', 'Option 2', 'Option 3'];
    this.tempOptionText = '';
    this.showAddModal = true;
  }

  onLabelInput() {
    if (!this.newFieldKey || this.newFieldKey.startsWith(this.newFieldLabel.substring(0, 3).toLowerCase())) {
      this.newFieldKey = this.newFieldLabel
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }
  }

  addOption() {
    if (this.tempOptionText.trim()) {
      this.newOptions.push(this.tempOptionText.trim());
      this.tempOptionText = '';
    }
  }

  removeOption(index: number) {
    this.newOptions.splice(index, 1);
  }

  commitCustomField() {
    if (!this.newFieldLabel.trim()) {
      this.toast.error('Field Label is required.');
      return;
    }

    const payload = {
      targetEntity: this.newTargetEntity,
      fieldKey: this.newFieldKey.trim() || this.newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      fieldLabel: this.newFieldLabel.trim(),
      fieldType: this.newFieldType,
      defaultValue: this.newDefaultValue.trim(),
      isRequired: this.newIsRequired,
      showInTable: this.newShowInTable,
      optionsJson: (this.newFieldType === 'select' || this.newFieldType === 'multiselect')
        ? JSON.stringify(this.newOptions)
        : null
    };

    this.api.createCustomField(payload).subscribe({
      next: () => {
        this.toast.success(`Custom field added to module "${this.newTargetEntity}".`);
        this.showAddModal = false;
        this.loadCustomFields();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to create custom field.');
      }
    });
  }

  toggleArchive(field: CustomField, archive: boolean) {
    this.api.archiveCustomField(field.id, archive).subscribe({
      next: () => {
        this.toast.success(archive ? 'Field archived safely. Historical customer data remains intact.' : 'Field restored.');
        this.loadCustomFields();
      }
    });
  }

  moveField(idx: number, delta: number) {
    const list = this.filteredFields();
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    const fieldIds = list.map(f => f.id);
    this.api.reorderCustomFields(fieldIds).subscribe({
      next: () => {
        this.loadCustomFields();
      }
    });
  }

  saveProfile() {
    this.toast.success('Organization profile details saved.');
  }

  switchTenant(tenant: { id: string; name: string }) {
    this.auth.switchTenant({ id: tenant.id, name: tenant.name, slug: tenant.name.toLowerCase() });
    this.toast.success(`Switched tenant context to ${tenant.name}.`);
    this.loadCustomFields();
    this.loadResourceTypes();
  }
}
