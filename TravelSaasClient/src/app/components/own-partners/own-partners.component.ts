import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ResourceType, ResourceItem, ResourceField } from '../../models/models';

@Component({
  selector: 'app-own-partners',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="partners-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Own & Partners</h1>
          <p class="page-subtitle">Here you can manage your own and partnerships</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateDrawer()">
          + Add {{ getActiveTypeName() }}
        </button>
      </div>

      <!-- Resource Type Navigation Switcher Pills matching Figma -->
      <div class="type-nav-bar">
        <div class="pills-track">
          <button
            *ngFor="let t of resourceTypes()"
            class="type-pill-btn"
            [class.active]="selectedTypeKey() === t.key"
            (click)="selectType(t.key)"
          >
            {{ t.displayName }}
          </button>
        </div>
      </div>

      <!-- Search & Filters Bar -->
      <div class="filters-bar">
        <div class="search-box">
          <input
            type="text"
            placeholder="Search resources, vehicle no, partner name..."
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
          />
          <span class="search-icon-btn">🔍</span>
        </div>

        <div class="filter-controls">
          <select [(ngModel)]="ownershipFilter" (change)="loadResources()">
            <option value="All">All Ownership</option>
            <option value="Own">Own</option>
            <option value="Partner">Partner</option>
          </select>

          <select [(ngModel)]="statusFilter" (change)="loadResources()">
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="InTrip">In-Trip</option>
            <option value="None">None</option>
          </select>
        </div>
      </div>

      <!-- Unified Dynamic Table Container -->
      <div class="table-card">
        <table class="figma-table">
          <thead>
            <tr>
              <th class="th-pic">Pictures</th>
              <th>Resource ID</th>
              <th>Model / Name</th>
              <!-- Dynamic Fields for Selected Resource Type -->
              <th *ngFor="let f of activeTableFields()">{{ f.label }}</th>
              <th>Ownership</th>
              <th>Partner Name</th>
              <th>Contact No</th>
              <th>Address</th>
              <th>Status</th>
              <th>Trip Name</th>
              <th class="th-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of resources()">
              <!-- Picture Placeholder -->
              <td class="td-pic">
                <div class="pic-thumb">
                  <span>{{ getResourceIcon() }}</span>
                </div>
              </td>

              <!-- Code -->
              <td class="td-code" (click)="openDetailDrawer(r)">{{ r.code }}</td>

              <!-- Name -->
              <td class="td-name" (click)="openDetailDrawer(r)">
                <strong>{{ r.name }}</strong>
              </td>

              <!-- Dynamic Field Values -->
              <td *ngFor="let f of activeTableFields()">
                {{ getFieldValue(r, f.fieldKey) }}
              </td>

              <!-- Ownership Badge -->
              <td>
                <span class="badge" [ngClass]="r.ownership === 'Own' ? 'badge-own' : 'badge-partner'">
                  {{ r.ownership }}
                </span>
              </td>

              <!-- Partner Name -->
              <td>{{ r.partnerName || '-' }}</td>

              <!-- Contact -->
              <td>{{ r.contactNo || '-' }}</td>

              <!-- Address -->
              <td class="td-addr" title="{{ r.address }}">{{ r.address || '-' }}</td>

              <!-- Status Badge -->
              <td>
                <span class="badge" [ngClass]="'badge-' + r.status.toLowerCase()">
                  {{ r.status }}
                </span>
              </td>

              <!-- Trip Name -->
              <td class="td-trip">{{ r.currentTripName || '-' }}</td>

              <!-- Actions -->
              <td class="td-actions">
                <div class="action-btns">
                  <button class="btn-icon" title="View details" (click)="openDetailDrawer(r)">👁</button>
                  <button class="btn-icon" title="Edit" (click)="openEditDrawer(r)">✎</button>
                  <button class="btn-icon text-danger" title="Delete" (click)="deleteResource(r.id)">🗑</button>
                </div>
              </td>
            </tr>

            <tr *ngIf="resources().length === 0 && !loading()">
              <td colspan="12" class="empty-cell">
                <div class="empty-state">
                  <span class="empty-icon">🚗</span>
                  <h3>No {{ getActiveTypeName() }} found</h3>
                  <p>Add your first resource to start managing your fleet and partnerships.</p>
                  <button class="btn btn-primary" style="margin-top: 14px;" (click)="openCreateDrawer()">
                    + Add {{ getActiveTypeName() }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination-bar" *ngIf="totalPages() > 1">
          <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
          <div class="page-buttons">
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() === 1" (click)="changePage(currentPage() - 1)">
              Previous
            </button>
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() === totalPages()" (click)="changePage(currentPage() + 1)">
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Dynamic Add / Edit Resource Drawer -->
      <div class="drawer-backdrop" *ngIf="showDrawer" (click)="closeDrawer()">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>{{ isEditMode ? 'Edit' : 'Add New' }} {{ getActiveTypeName() }}</h2>
            <button class="close-btn" (click)="closeDrawer()">✕</button>
          </div>

          <div class="drawer-body">
            <!-- Standard Resource Attributes -->
            <div class="form-row">
              <div class="form-field">
                <label>Resource ID / Code</label>
                <input type="text" [(ngModel)]="currentResourceCode" placeholder="Auto-generated if empty" />
              </div>
              <div class="form-field">
                <label>{{ getActiveTypeName() }} Name <span class="req">*</span></label>
                <input type="text" [(ngModel)]="currentResourceName" placeholder="e.g. Honda Traveler or Grand Munnar" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Ownership Type</label>
                <select [(ngModel)]="currentOwnership">
                  <option value="Own">Own</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>
              <div class="form-field">
                <label>Status</label>
                <select [(ngModel)]="currentStatus">
                  <option value="Available">Available</option>
                  <option value="InTrip">In-Trip</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>

            <div class="form-row" *ngIf="currentOwnership === 'Partner'">
              <div class="form-field">
                <label>Partner / Vendor Name</label>
                <input type="text" [(ngModel)]="currentPartnerName" placeholder="e.g. Sai Traders" />
              </div>
              <div class="form-field">
                <label>Contact Phone</label>
                <input type="text" [(ngModel)]="currentContactNo" placeholder="+91 9080702373" />
              </div>
            </div>

            <div class="form-field">
              <label>Address / Base Location</label>
              <input type="text" [(ngModel)]="currentAddress" placeholder="e.g. Viruthunagar Main Rd" />
            </div>

            <!-- DATA-DRIVEN DYNAMIC FORM FIELDS (Generated from ResourceFieldDefinition) -->
            <div class="dynamic-section">
              <h3 class="dynamic-heading">{{ getActiveTypeName() }} Specifications</h3>

              <div class="dynamic-fields-grid">
                <div *ngFor="let field of activeTypeFields()" class="form-field">
                  <label>
                    {{ field.label }}
                    <span class="req" *ngIf="field.isRequired">*</span>
                  </label>

                  <!-- Dynamic Select Input -->
                  <select
                    *ngIf="field.dataType === 'select'"
                    [(ngModel)]="dynamicValues[field.fieldKey]"
                  >
                    <option value="">- Select -</option>
                    <option *ngFor="let opt of getFieldOptions(field)" [value]="opt">
                      {{ opt }}
                    </option>
                  </select>

                  <!-- Dynamic Number Input -->
                  <input
                    *ngIf="field.dataType === 'number'"
                    type="number"
                    [(ngModel)]="dynamicValues[field.fieldKey]"
                    placeholder="Enter {{ field.label }}"
                  />

                  <!-- Dynamic Date Input -->
                  <input
                    *ngIf="field.dataType === 'date'"
                    type="date"
                    [(ngModel)]="dynamicValues[field.fieldKey]"
                  />

                  <!-- Dynamic Text Input (Default) -->
                  <input
                    *ngIf="field.dataType !== 'select' && field.dataType !== 'number' && field.dataType !== 'date'"
                    type="text"
                    [(ngModel)]="dynamicValues[field.fieldKey]"
                    placeholder="Enter {{ field.label }}"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <button class="btn btn-secondary" (click)="closeDrawer()">Cancel</button>
            <button class="btn btn-primary" (click)="saveResource()">
              {{ isEditMode ? 'Update' : 'Create' }} {{ getActiveTypeName() }}
            </button>
          </div>
        </div>
      </div>

      <!-- Dynamic Resource Detail Drawer -->
      <div class="drawer-backdrop" *ngIf="showDetailDrawer" (click)="showDetailDrawer = false">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>{{ activeDetailResource?.name }} ({{ activeDetailResource?.code }})</h2>
            <button class="close-btn" (click)="showDetailDrawer = false">✕</button>
          </div>

          <div class="drawer-body" *ngIf="activeDetailResource">
            <div class="detail-badge-row">
              <span class="badge" [ngClass]="activeDetailResource.ownership === 'Own' ? 'badge-own' : 'badge-partner'">
                {{ activeDetailResource.ownership }}
              </span>
              <span class="badge" [ngClass]="'badge-' + activeDetailResource.status.toLowerCase()">
                {{ activeDetailResource.status }}
              </span>
              <span class="type-name-tag">{{ activeDetailResource.resourceTypeName }}</span>
            </div>

            <div class="detail-grid">
              <div class="detail-box">
                <span class="d-lbl">Partner Name</span>
                <strong>{{ activeDetailResource.partnerName || 'Directly Owned' }}</strong>
              </div>
              <div class="detail-box">
                <span class="d-lbl">Contact Phone</span>
                <strong>{{ activeDetailResource.contactNo || 'N/A' }}</strong>
              </div>
              <div class="detail-box">
                <span class="d-lbl">Address</span>
                <strong>{{ activeDetailResource.address || 'N/A' }}</strong>
              </div>
              <div class="detail-box">
                <span class="d-lbl">Current Trip</span>
                <strong class="text-primary">{{ activeDetailResource.currentTripName || 'No active trip' }}</strong>
              </div>
            </div>

            <!-- Dynamic Specs Display -->
            <div class="dynamic-specs-section">
              <h3 class="dynamic-heading">Specifications & Details</h3>
              <div class="specs-list">
                <div *ngFor="let field of activeTypeFields()" class="spec-row">
                  <span class="spec-lbl">{{ field.label }}</span>
                  <span class="spec-val">{{ getFieldValue(activeDetailResource, field.fieldKey) || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <button class="btn btn-secondary" (click)="showDetailDrawer = false">Close</button>
            <button class="btn btn-primary" (click)="editFromDetail()">Edit Resource</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .partners-page {
      padding: 24px 32px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
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

    /* Type Switcher Pills matching Figma */
    .type-nav-bar {
      margin-bottom: 20px;
    }

    .pills-track {
      display: inline-flex;
      background: #15151e;
      border: 1px solid #242434;
      border-radius: var(--radius-full);
      padding: 4px;
      gap: 4px;
    }

    .type-pill-btn {
      padding: 8px 20px;
      border-radius: var(--radius-full);
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: all 0.15s ease;
    }

    .type-pill-btn.active {
      background: #3a1510;
      color: var(--primary);
      border: 1px solid rgba(255, 69, 0, 0.4);
    }

    .type-pill-btn:hover:not(.active) {
      color: #fff;
      background: #1c1c28;
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      gap: 16px;
    }

    .search-box {
      position: relative;
      width: 380px;
    }

    .search-box input {
      background: #14141c;
      border: 1px solid #232332;
      border-radius: var(--radius-full);
      padding: 10px 42px 10px 18px;
      font-size: 0.86rem;
    }

    .search-icon-btn {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.9rem;
      color: var(--primary);
    }

    .filter-controls {
      display: flex;
      gap: 12px;
    }

    .filter-controls select {
      background: #14141c;
      border: 1px solid #232332;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.84rem;
      width: auto;
    }

    /* Table Card */
    .table-card {
      background: #14141c;
      border: 1px solid #232330;
      border-radius: var(--radius-md);
      overflow-x: auto;
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

    .figma-table td {
      padding: 14px;
      border-bottom: 1px solid #1c1c28;
      color: #d8d8e6;
      white-space: nowrap;
    }

    .figma-table tr:hover {
      background: #1a1a24;
    }

    .td-pic {
      width: 50px;
    }

    .pic-thumb {
      width: 36px;
      height: 36px;
      background: #1e1e2c;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .td-code {
      font-weight: 600;
      color: #fff;
      cursor: pointer;
    }

    .td-name {
      color: #fff;
      cursor: pointer;
    }

    .td-addr {
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .td-trip {
      color: #38bdf8;
      font-weight: 500;
    }

    .action-btns {
      display: flex;
      gap: 6px;
    }

    .btn-icon {
      padding: 4px 8px;
      font-size: 0.95rem;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
    }

    .btn-icon:hover {
      background: #252538;
      color: #fff;
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

    .page-buttons {
      display: flex;
      gap: 8px;
    }

    /* Drawer Styles */
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.15s ease-out;
    }

    .drawer-panel {
      width: 540px;
      max-width: 100%;
      height: 100%;
      background: #161622;
      border-left: 1px solid #2a2a3e;
      display: flex;
      flex-direction: column;
      box-shadow: -10px 0 35px rgba(0,0,0,0.7);
    }

    .drawer-header {
      padding: 20px 24px;
      border-bottom: 1px solid #242436;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .drawer-header h2 {
      font-size: 1.2rem;
      color: #fff;
    }

    .close-btn {
      font-size: 1.2rem;
      color: #8b8b9f;
    }

    .drawer-body {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .drawer-footer {
      padding: 18px 24px;
      border-top: 1px solid #242436;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #13131c;
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

    .dynamic-section {
      background: #1a1a27;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 16px;
      margin-top: 8px;
    }

    .dynamic-heading {
      font-size: 0.95rem;
      color: #fff;
      margin-bottom: 14px;
    }

    .dynamic-fields-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .detail-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .type-name-tag {
      font-size: 0.78rem;
      color: #38bdf8;
      background: #1e1e2c;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin: 12px 0;
    }

    .detail-box {
      background: #1b1b28;
      border: 1px solid #252538;
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .d-lbl {
      font-size: 0.72rem;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    .dynamic-specs-section {
      border-top: 1px solid #252538;
      padding-top: 14px;
    }

    .specs-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .spec-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #1b1b28;
      border-radius: var(--radius-sm);
      font-size: 0.84rem;
    }

    .spec-lbl {
      color: var(--text-muted);
    }

    .spec-val {
      font-weight: 600;
      color: #fff;
    }
  `]
})
export class OwnPartnersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  resourceTypes = signal<ResourceType[]>([]);
  selectedTypeKey = signal<string>('vehicle');
  resources = signal<ResourceItem[]>([]);
  totalCount = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  loading = signal(false);

  // Filters
  searchQuery = '';
  ownershipFilter = 'All';
  statusFilter = 'All';
  private searchTimeout: any;

  // Add / Edit Drawer State
  showDrawer = false;
  isEditMode = false;
  editingResourceId: string | null = null;

  // Standard Form Fields
  currentResourceCode = '';
  currentResourceName = '';
  currentOwnership = 'Own';
  currentStatus = 'Available';
  currentPartnerName = '';
  currentContactNo = '';
  currentAddress = '';

  // Dynamic values dict
  dynamicValues: Record<string, any> = {};

  // Detail Drawer State
  showDetailDrawer = false;
  activeDetailResource: ResourceItem | null = null;

  ngOnInit() {
    this.api.getResourceTypes().subscribe({
      next: types => {
        this.resourceTypes.set(types);
        if (types.length > 0) {
          this.selectedTypeKey.set(types[0].key);
        }
        this.loadResources();
      }
    });
  }

  selectType(key: string) {
    this.selectedTypeKey.set(key);
    this.currentPage.set(1);
    this.loadResources();
  }

  loadResources() {
    this.loading.set(true);
    this.api.getResources({
      typeKey: this.selectedTypeKey(),
      search: this.searchQuery,
      ownership: this.ownershipFilter,
      status: this.statusFilter,
      page: this.currentPage(),
      pageSize: 15
    }).subscribe({
      next: res => {
        this.resources.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchInput() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadResources();
    }, 300);
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadResources();
  }

  getActiveType(): ResourceType | undefined {
    return this.resourceTypes().find(t => t.key === this.selectedTypeKey());
  }

  getActiveTypeName(): string {
    const t = this.getActiveType();
    if (!t) return 'Resource';
    // Singularize simple names
    if (t.displayName.endsWith('s')) {
      return t.displayName.slice(0, -1);
    }
    return t.displayName;
  }

  activeTableFields(): ResourceField[] {
    const t = this.getActiveType();
    return t ? t.fields.filter(f => f.showInTable) : [];
  }

  activeTypeFields(): ResourceField[] {
    const t = this.getActiveType();
    return t ? t.fields : [];
  }

  getFieldOptions(field: ResourceField): string[] {
    if (!field.optionsJson) return [];
    try {
      return JSON.parse(field.optionsJson);
    } catch {
      return [];
    }
  }

  getFieldValue(r: ResourceItem, fieldKey: string): string {
    if (!r.customValuesJson) return '-';
    try {
      const parsed = JSON.parse(r.customValuesJson);
      return parsed[fieldKey] !== undefined ? parsed[fieldKey] : '-';
    } catch {
      return '-';
    }
  }

  getResourceIcon(): string {
    const k = this.selectedTypeKey();
    if (k === 'vehicle') return '🚐';
    if (k === 'hotel') return '🏨';
    if (k === 'restaurant') return '🍽️';
    if (k === 'lodge') return '🏡';
    return '📦';
  }

  openCreateDrawer() {
    this.isEditMode = false;
    this.editingResourceId = null;
    this.currentResourceCode = '';
    this.currentResourceName = '';
    this.currentOwnership = 'Own';
    this.currentStatus = 'Available';
    this.currentPartnerName = '';
    this.currentContactNo = '';
    this.currentAddress = '';
    this.dynamicValues = {};
    this.showDrawer = true;
  }

  openEditDrawer(r: ResourceItem) {
    this.isEditMode = true;
    this.editingResourceId = r.id;
    this.currentResourceCode = r.code;
    this.currentResourceName = r.name;
    this.currentOwnership = r.ownership;
    this.currentStatus = r.status;
    this.currentPartnerName = r.partnerName || '';
    this.currentContactNo = r.contactNo || '';
    this.currentAddress = r.address || '';
    try {
      this.dynamicValues = JSON.parse(r.customValuesJson || '{}');
    } catch {
      this.dynamicValues = {};
    }
    this.showDrawer = true;
  }

  closeDrawer() {
    this.showDrawer = false;
  }

  saveResource() {
    if (!this.currentResourceName.trim()) {
      this.toast.error('Resource Name is required.');
      return;
    }

    const activeType = this.getActiveType();
    if (!activeType) return;

    const payload = {
      resourceTypeId: activeType.id,
      code: this.currentResourceCode,
      name: this.currentResourceName,
      ownership: this.currentOwnership,
      status: this.currentStatus,
      partnerName: this.currentPartnerName,
      contactNo: this.currentContactNo,
      address: this.currentAddress,
      customValuesJson: JSON.stringify(this.dynamicValues)
    };

    if (this.isEditMode && this.editingResourceId) {
      this.api.updateResource(this.editingResourceId, payload).subscribe({
        next: () => {
          this.toast.success(`${this.getActiveTypeName()} updated successfully.`);
          this.closeDrawer();
          this.loadResources();
        }
      });
    } else {
      this.api.createResource(payload).subscribe({
        next: () => {
          this.toast.success(`${this.getActiveTypeName()} created successfully.`);
          this.closeDrawer();
          this.loadResources();
        }
      });
    }
  }

  deleteResource(id: string) {
    if (confirm('Are you sure you want to delete this resource?')) {
      this.api.deleteResource(id).subscribe({
        next: () => {
          this.toast.success('Resource deleted.');
          this.loadResources();
        }
      });
    }
  }

  openDetailDrawer(r: ResourceItem) {
    this.activeDetailResource = r;
    this.showDetailDrawer = true;
  }

  editFromDetail() {
    if (this.activeDetailResource) {
      const res = this.activeDetailResource;
      this.showDetailDrawer = false;
      this.openEditDrawer(res);
    }
  }
}

