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
          <p class="page-subtitle">Configure organization multi-tenancy, dynamic custom fields, and resource schemas</p>
        </div>
      </div>

      <div class="settings-layout">
        <!-- Settings Nav Pills -->
        <div class="settings-tabs">
          <button [class.active]="activeTab === 'custom-fields'" (click)="activeTab = 'custom-fields'">
            Dynamic Custom Fields
          </button>
          <button [class.active]="activeTab === 'resource-types'" (click)="activeTab = 'resource-types'">
            Resource Schemas
          </button>
          <button [class.active]="activeTab === 'tenancy'" (click)="activeTab = 'tenancy'">
            Multi-Tenant Isolation
          </button>
        </div>

        <!-- Section 1: Dynamic Custom Fields (Section 20 & 21 of Directive) -->
        <div class="settings-card" *ngIf="activeTab === 'custom-fields'">
          <div class="card-header-row">
            <div>
              <h2 class="card-heading">Dynamic Custom Fields</h2>
              <p class="card-subheading">
                Define custom attributes that automatically render into create forms, details view, and tables without code changes.
              </p>
            </div>
            <button class="btn btn-primary" (click)="openAddFieldModal()">+ Add Custom Field</button>
          </div>

          <table class="figma-table">
            <thead>
              <tr>
                <th>Target Entity</th>
                <th>Field Label</th>
                <th>Field Key</th>
                <th>Data Type</th>
                <th>Required</th>
                <th>Show in Table</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of customFields()">
                <td><span class="entity-pill">{{ f.targetEntity }}</span></td>
                <td><strong>{{ f.fieldLabel }}</strong></td>
                <td><code>{{ f.fieldKey }}</code></td>
                <td>{{ f.fieldType }}</td>
                <td>{{ f.isRequired ? 'Yes' : 'No' }}</td>
                <td>{{ f.showInTable ? 'Yes' : 'No' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 2: Resource Types & Schemas (Section 7 of Directive) -->
        <div class="settings-card" *ngIf="activeTab === 'resource-types'">
          <div class="card-header-row">
            <div>
              <h2 class="card-heading">Data-Driven Resource Types</h2>
              <p class="card-subheading">
                Define new travel resources (e.g. Campsites, Houseboats, Cruise) and their custom schemas.
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

        <!-- Section 3: Multi-Tenant Isolation Switcher (Section 54 of Directive) -->
        <div class="settings-card" *ngIf="activeTab === 'tenancy'">
          <div class="card-header-row">
            <div>
              <h2 class="card-heading">Multi-Tenant Company Isolation</h2>
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
                Switch to Tenant 2 (SkyWay Holidays)
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Custom Field Modal -->
      <div class="modal-backdrop" *ngIf="showAddModal" (click)="showAddModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Custom Field Definition</h3>
            <button class="close-x" (click)="showAddModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label>Target Entity</label>
              <select [(ngModel)]="newTargetEntity">
                <option value="Member">Member</option>
                <option value="Trip">Trip</option>
                <option value="Resource">Resource</option>
              </select>
            </div>

            <div class="form-field">
              <label>Field Label <span class="req">*</span></label>
              <input type="text" [(ngModel)]="newFieldLabel" placeholder="e.g. Passport Expiry or Emergency Contact" />
            </div>

            <div class="form-field">
              <label>Field Key (CamelCase)</label>
              <input type="text" [(ngModel)]="newFieldKey" placeholder="e.g. passportExpiry" />
            </div>

            <div class="form-field">
              <label>Field Data Type</label>
              <select [(ngModel)]="newFieldType">
                <option value="text">Text</option>
                <option value="date">Date</option>
                <option value="number">Number</option>
                <option value="boolean">Yes / No</option>
              </select>
            </div>

            <div class="checkbox-row">
              <label>
                <input type="checkbox" [(ngModel)]="newIsRequired" /> Required Field
              </label>
              <label>
                <input type="checkbox" [(ngModel)]="newShowInTable" /> Show in Table
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAddModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="commitCustomField()">Add Field</button>
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
      border-bottom: 1px solid #20202e;
      padding-bottom: 14px;
    }

    .card-heading {
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
    }

    .card-subheading {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .figma-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;
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
      padding: 14px;
      border-bottom: 1px solid #1c1c28;
      color: #d8d8e6;
    }

    .entity-pill {
      background: #1f1f2e;
      color: #38bdf8;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-weight: 600;
    }

    .types-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .type-box {
      background: #191924;
      border: 1px solid #252538;
      border-radius: var(--radius-sm);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .type-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #fff;
    }

    .type-key {
      font-size: 0.78rem;
    }

    .fields-list {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .fields-list ul {
      margin-top: 8px;
      padding-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tenant-switcher-box {
      background: #191924;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .t-lbl {
      font-size: 0.76rem;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    .t-name {
      font-size: 1.4rem;
      color: #fff;
      margin: 4px 0;
    }

    .t-slug {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .switch-actions {
      display: flex;
      gap: 12px;
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
      margin-bottom: 16px;
    }

    .modal-header h3 {
      font-size: 1.15rem;
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

    .checkbox-row {
      display: flex;
      gap: 20px;
      font-size: 0.84rem;
      color: var(--text-muted);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private toast = inject(ToastService);

  activeTab: 'custom-fields' | 'resource-types' | 'tenancy' = 'custom-fields';

  customFields = signal<CustomField[]>([]);
  resourceTypes = signal<ResourceType[]>([]);

  showAddModal = false;
  newTargetEntity = 'Member';
  newFieldLabel = '';
  newFieldKey = '';
  newFieldType = 'text';
  newIsRequired = false;
  newShowInTable = true;

  tenant1 = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'V4Journey Pvt Ltd',
    slug: 'v4journey'
  };

  tenant2 = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'SkyWay Holidays',
    slug: 'skyway'
  };

  ngOnInit() {
    this.loadCustomFields();
    this.loadResourceTypes();
  }

  loadCustomFields() {
    this.api.getCustomFields('').subscribe(fields => this.customFields.set(fields));
  }

  loadResourceTypes() {
    this.api.getResourceTypes().subscribe(types => this.resourceTypes.set(types));
  }

  openAddFieldModal() {
    this.newFieldLabel = '';
    this.newFieldKey = '';
    this.newIsRequired = false;
    this.newShowInTable = true;
    this.showAddModal = true;
  }

  commitCustomField() {
    if (!this.newFieldLabel.trim()) {
      this.toast.error('Field Label is required.');
      return;
    }

    const key = this.newFieldKey.trim() || this.newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');

    const payload = {
      targetEntity: this.newTargetEntity,
      fieldKey: key,
      fieldLabel: this.newFieldLabel,
      fieldType: this.newFieldType,
      isRequired: this.newIsRequired,
      showInTable: this.newShowInTable
    };

    this.api.createCustomField(payload).subscribe({
      next: () => {
        this.toast.success('Custom field configured successfully.');
        this.showAddModal = false;
        this.loadCustomFields();
      }
    });
  }

  switchTenant(tenant: any) {
    this.auth.switchTenant(tenant);
    this.toast.success(`Switched active context to ${tenant.name}.`);
    window.location.reload();
  }
}

