import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { MemberItem, CustomField } from '../../models/models';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="team-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Team Members</h1>
          <p class="page-subtitle">Here you can manage all your team members</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">+ Add Member</button>
      </div>

      <!-- Filters & Search Bar matching Figma -->
      <div class="top-controls-bar">
        <div class="filter-and-search">
          <select [(ngModel)]="selectedRole" (change)="loadMembers()" class="role-select">
            <option value="All">All</option>
            <option value="Guider">Guiders</option>
            <option value="Driver">Drivers</option>
            <option value="Staff">Staffs</option>
            <option value="Helper">Helpers</option>
          </select>

          <div class="search-box">
            <input
              type="text"
              placeholder="Search by name, ID, age, gender, etc..."
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
            />
            <span class="search-icon">🔍</span>
          </div>
        </div>

        <!-- View Mode Switcher -->
        <div class="view-toggle">
          <button [class.active]="viewMode === 'board'" (click)="viewMode = 'board'">Board View</button>
          <button [class.active]="viewMode === 'table'" (click)="viewMode = 'table'">Table View</button>
        </div>
      </div>

      <!-- KANBAN BOARD VIEW Grouped by Roles matching Figma -->
      <div class="kanban-board" *ngIf="viewMode === 'board'">
        <!-- Guiders Column -->
        <div class="kanban-col">
          <div class="col-header">
            <span class="col-title">Guiders ( {{ getMembersByRole('Guider').length }} )</span>
          </div>
          <div class="cards-list">
            <div
              *ngFor="let m of getMembersByRole('Guider')"
              class="member-card"
              (click)="openMemberDetails(m.id)"
            >
              <div class="card-avatar">
                <span>👤</span>
              </div>
              <div class="card-info">
                <div class="name-id-row">
                  <span class="m-code">({{ m.memberCode }})</span>
                  <strong class="m-name">{{ m.fullName }}</strong>
                </div>
                <div class="m-meta">
                  <span>{{ m.age }} / {{ m.gender }} / {{ m.mobileNo }}</span>
                </div>
                <div class="badges-row">
                  <span class="badge" [ngClass]="'badge-' + m.status.toLowerCase()">{{ m.status }}</span>
                  <span class="work-badge">{{ m.workType }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="getMembersByRole('Guider').length === 0" class="empty-col">No guiders found</div>
          </div>
        </div>

        <!-- Drivers Column -->
        <div class="kanban-col">
          <div class="col-header">
            <span class="col-title">Drivers ( {{ getMembersByRole('Driver').length }} )</span>
          </div>
          <div class="cards-list">
            <div
              *ngFor="let m of getMembersByRole('Driver')"
              class="member-card"
              (click)="openMemberDetails(m.id)"
            >
              <div class="card-avatar">
                <span>🚗</span>
              </div>
              <div class="card-info">
                <div class="name-id-row">
                  <span class="m-code">({{ m.memberCode }})</span>
                  <strong class="m-name">{{ m.fullName }}</strong>
                </div>
                <div class="m-meta">
                  <span>{{ m.age }} / {{ m.gender }} / {{ m.mobileNo }}</span>
                </div>
                <div class="badges-row">
                  <span class="badge" [ngClass]="'badge-' + m.status.toLowerCase()">{{ m.status }}</span>
                  <span class="work-badge">{{ m.workType }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="getMembersByRole('Driver').length === 0" class="empty-col">No drivers found</div>
          </div>
        </div>

        <!-- Staffs Column -->
        <div class="kanban-col">
          <div class="col-header">
            <span class="col-title">Staffs ( {{ getMembersByRole('Staff').length }} )</span>
          </div>
          <div class="cards-list">
            <div
              *ngFor="let m of getMembersByRole('Staff')"
              class="member-card"
              (click)="openMemberDetails(m.id)"
            >
              <div class="card-avatar">
                <span>💼</span>
              </div>
              <div class="card-info">
                <div class="name-id-row">
                  <span class="m-code">({{ m.memberCode }})</span>
                  <strong class="m-name">{{ m.fullName }}</strong>
                </div>
                <div class="m-meta">
                  <span>{{ m.age }} / {{ m.gender }} / {{ m.mobileNo }}</span>
                </div>
                <div class="badges-row">
                  <span class="badge" [ngClass]="'badge-' + m.status.toLowerCase()">{{ m.status }}</span>
                  <span class="work-badge">{{ m.workType }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="getMembersByRole('Staff').length === 0" class="empty-col">No staffs found</div>
          </div>
        </div>

        <!-- Helpers Column -->
        <div class="kanban-col">
          <div class="col-header">
            <span class="col-title">Helpers ( {{ getMembersByRole('Helper').length }} )</span>
          </div>
          <div class="cards-list">
            <div
              *ngFor="let m of getMembersByRole('Helper')"
              class="member-card"
              (click)="openMemberDetails(m.id)"
            >
              <div class="card-avatar">
                <span>🤝</span>
              </div>
              <div class="card-info">
                <div class="name-id-row">
                  <span class="m-code">({{ m.memberCode }})</span>
                  <strong class="m-name">{{ m.fullName }}</strong>
                </div>
                <div class="m-meta">
                  <span>{{ m.age }} / {{ m.gender }} / {{ m.mobileNo }}</span>
                </div>
                <div class="badges-row">
                  <span class="badge" [ngClass]="'badge-' + m.status.toLowerCase()">{{ m.status }}</span>
                  <span class="work-badge">{{ m.workType }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="getMembersByRole('Helper').length === 0" class="empty-col">No helpers found</div>
          </div>
        </div>
      </div>

      <!-- TABLE VIEW -->
      <div class="table-card" *ngIf="viewMode === 'table'">
        <table class="figma-table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Age / Gender</th>
              <th>Mobile</th>
              <th>Work Type</th>
              <th>Salary Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of members()">
              <td class="td-code" (click)="openMemberDetails(m.id)">{{ m.memberCode }}</td>
              <td class="td-name" (click)="openMemberDetails(m.id)">{{ m.fullName }}</td>
              <td><span class="role-tag">{{ m.role }}</span></td>
              <td>{{ m.age }} / {{ m.gender }}</td>
              <td>{{ m.mobileNo }}</td>
              <td>{{ m.workType }}</td>
              <td>{{ m.salaryPeriod }}</td>
              <td>
                <span class="badge" [ngClass]="'badge-' + m.status.toLowerCase()">{{ m.status }}</span>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" (click)="openMemberDetails(m.id)">View Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ADD MEMBER MODAL matching Figma 'add member form.png' -->
      <div class="modal-backdrop" *ngIf="showAddModal" (click)="closeAddModal()">
        <div class="modal-content-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Add Member</h2>
            <button class="close-btn" (click)="closeAddModal()">✕</button>
          </div>

          <div class="modal-body">
            <!-- Row 1: ID, Name, Aadhaar -->
            <div class="form-row-3">
              <div class="form-field">
                <label>Member ID</label>
                <input type="text" [(ngModel)]="newMemberCode" placeholder="#0010" />
              </div>
              <div class="form-field">
                <label>Member Name <span class="req">*</span></label>
                <input type="text" [(ngModel)]="newFullName" placeholder="Enter name" />
              </div>
              <div class="form-field">
                <label>Aadhaar Card No.</label>
                <input type="text" [(ngModel)]="newAadhaarNo" placeholder="Enter number" />
              </div>
            </div>

            <!-- Row 2: Age/DOB, Gender, Blood Group, Mobile -->
            <div class="form-row-4">
              <div class="form-field">
                <label>Date of Birth</label>
                <input type="date" [(ngModel)]="newDob" (change)="calcAge()" />
              </div>
              <div class="form-field">
                <label>Gender</label>
                <select [(ngModel)]="newGender">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-field">
                <label>Blood Group</label>
                <select [(ngModel)]="newBloodGroup">
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div class="form-field">
                <label>Mobile No. <span class="req">*</span></label>
                <input type="text" [(ngModel)]="newMobileNo" placeholder="+91 8300658968" />
              </div>
            </div>

            <!-- Row 3: Food Info, Role, License -->
            <div class="form-row-3">
              <div class="form-field">
                <label>Food Info</label>
                <select [(ngModel)]="newFoodInfo">
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Veg">Veg</option>
                </select>
              </div>
              <div class="form-field">
                <label>Role</label>
                <select [(ngModel)]="newRole">
                  <option value="Guider">Guider</option>
                  <option value="Driver">Driver</option>
                  <option value="Staff">Staff</option>
                  <option value="Helper">Helper</option>
                </select>
              </div>
              <div class="form-field">
                <label>License No.</label>
                <input type="text" [(ngModel)]="newLicenseNo" placeholder="Enter license no." />
              </div>
            </div>

            <!-- Row 4: Work Type, Contract Period, Join Date, Salary Period -->
            <div class="form-row-4">
              <div class="form-field">
                <label>Work Type</label>
                <select [(ngModel)]="newWorkType">
                  <option value="Full-time (Contract)">Full-time (Contract)</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
              <div class="form-field">
                <label>Contract Period</label>
                <select [(ngModel)]="newContractPeriod">
                  <option value="1 year">1 year</option>
                  <option value="2 years">2 years</option>
                  <option value="3 years">3 years</option>
                  <option value="Permanent">Permanent</option>
                </select>
              </div>
              <div class="form-field">
                <label>Work Join Date</label>
                <input type="date" [(ngModel)]="newJoinDate" />
              </div>
              <div class="form-field">
                <label>Salary Period</label>
                <select [(ngModel)]="newSalaryPeriod">
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Per Trip">Per Trip</option>
                </select>
              </div>
            </div>

            <!-- Row 5: Address -->
            <div class="form-field">
              <label>Address</label>
              <input type="text" [(ngModel)]="newAddress" placeholder="Enter complete residential address" />
            </div>

            <!-- Row 6: Upload Picture & Document -->
            <div class="form-row">
              <div class="form-field">
                <label>Upload Picture</label>
                <input type="file" (change)="onPictureSelected($event)" accept="image/*" />
                <span class="file-ok" *ngIf="newPhotoUrl">✓ Picture selected</span>
              </div>
              <div class="form-field">
                <label>Upload Document (ID / License proof)</label>
                <input type="file" (change)="onDocSelected($event)" accept=".pdf,image/*" />
                <span class="file-ok" *ngIf="newDocUrl">✓ Document selected</span>
              </div>
            </div>

            <!-- DYNAMIC CUSTOM MEMBER FIELDS (Configured by admin!) -->
            <div class="custom-fields-box" *ngIf="customFields.length > 0">
              <h3 class="custom-title">Additional Configured Custom Fields</h3>
              <div class="form-row">
                <div *ngFor="let cf of customFields" class="form-field">
                  <label>{{ cf.fieldLabel }} <span class="req" *ngIf="cf.isRequired">*</span></label>
                  <input
                    [type]="cf.fieldType === 'date' ? 'date' : cf.fieldType === 'number' ? 'number' : 'text'"
                    [(ngModel)]="dynamicFieldValues[cf.fieldKey]"
                    placeholder="Enter {{ cf.fieldLabel }}"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAddModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveMember()">Add Member</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .team-page {
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

    .top-controls-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 16px;
    }

    .filter-and-search {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .role-select {
      background: #14141c;
      border: 1px solid #232332;
      border-radius: var(--radius-sm);
      padding: 9px 16px;
      font-size: 0.84rem;
      color: #fff;
      width: 130px;
    }

    .search-box {
      position: relative;
      width: 440px;
    }

    .search-box input {
      background: #14141c;
      border: 1px solid #232332;
      border-radius: var(--radius-full);
      padding: 9px 42px 9px 18px;
      font-size: 0.84rem;
    }

    .search-icon {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.9rem;
      color: var(--primary);
    }

    .view-toggle {
      display: flex;
      background: #14141c;
      border: 1px solid #232332;
      border-radius: var(--radius-sm);
      padding: 2px;
    }

    .view-toggle button {
      padding: 6px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
    }

    .view-toggle button.active {
      background: #252538;
      color: #fff;
    }

    /* Kanban Board Columns */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      align-items: flex-start;
    }

    .kanban-col {
      background: #13131b;
      border: 1px solid #20202c;
      border-radius: var(--radius-md);
      padding: 16px;
      min-height: 500px;
    }

    .col-header {
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #20202c;
    }

    .col-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: #fff;
    }

    .cards-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .member-card {
      background: #191924;
      border: 1px solid #262638;
      border-radius: var(--radius-sm);
      padding: 14px;
      display: flex;
      gap: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .member-card:hover {
      background: #20202f;
      border-color: #35354d;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }

    .card-avatar {
      width: 44px;
      height: 44px;
      background: #242436;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .card-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      overflow: hidden;
    }

    .name-id-row {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
    }

    .m-code {
      font-size: 0.8rem;
      color: var(--text-dim);
      font-weight: 600;
    }

    .m-name {
      font-size: 0.88rem;
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .m-meta {
      font-size: 0.74rem;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badges-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .work-badge {
      font-size: 0.7rem;
      color: #94a3b8;
      background: #151520;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
    }

    .empty-col {
      padding: 30px 10px;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.8rem;
    }

    /* Table View */
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
    }

    .figma-table td {
      padding: 14px;
      border-bottom: 1px solid #1c1c28;
      color: #d8d8e6;
    }

    .role-tag {
      background: #1f1f2e;
      color: #38bdf8;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-weight: 600;
    }

    /* Modal */
    .modal-content-lg {
      background: #171722;
      border: 1px solid #2a2a3e;
      border-radius: var(--radius-md);
      width: 820px;
      max-width: 95%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 45px rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #242436;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      color: #fff;
    }

    .close-btn {
      font-size: 1.2rem;
      color: #8b8b9f;
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-footer {
      padding: 18px 24px;
      border-top: 1px solid #242436;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #14141c;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-row-3 {
      display: grid;
      grid-template-columns: 1fr 1.5fr 1.5fr;
      gap: 14px;
    }

    .form-row-4 {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr 1.5fr;
      gap: 14px;
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

    .file-ok {
      font-size: 0.76rem;
      color: #10b981;
    }

    .custom-fields-box {
      background: #1a1a27;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 16px;
    }

    .custom-title {
      font-size: 0.9rem;
      color: #fff;
      margin-bottom: 12px;
    }
  `]
})
export class TeamMembersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  members = signal<MemberItem[]>([]);
  customFields: CustomField[] = [];
  viewMode: 'board' | 'table' = 'board';

  selectedRole = 'All';
  searchQuery = '';
  private searchTimeout: any;

  // Add Member Modal State
  showAddModal = false;
  newMemberCode = '';
  newFullName = '';
  newAadhaarNo = '';
  newDob = '1998-06-27';
  newAge = 28;
  newGender = 'Male';
  newBloodGroup = 'O+';
  newMobileNo = '';
  newFoodInfo = 'Non-Veg';
  newRole = 'Driver';
  newLicenseNo = '';
  newWorkType = 'Full-time (Contract)';
  newContractPeriod = '2 years';
  newJoinDate = new Date().toISOString().substring(0, 10);
  newSalaryPeriod = 'Weekly';
  newAddress = '';
  newPhotoUrl = '';
  newDocUrl = '';

  // Dynamic values dict for custom fields
  dynamicFieldValues: Record<string, any> = {};

  ngOnInit() {
    this.loadMembers();
    this.api.getCustomFields('Member').subscribe(fields => {
      this.customFields = fields;
    });
  }

  loadMembers() {
    this.api.getMembers({
      role: this.selectedRole,
      search: this.searchQuery
    }).subscribe(mems => {
      this.members.set(mems);
    });
  }

  onSearchInput() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadMembers();
    }, 300);
  }

  getMembersByRole(role: string): MemberItem[] {
    return this.members().filter(m => m.role.toLowerCase() === role.toLowerCase());
  }

  openMemberDetails(id: string) {
    this.router.navigate(['/team', id]);
  }

  openAddModal() {
    this.newMemberCode = '';
    this.newFullName = '';
    this.newAadhaarNo = '';
    this.newMobileNo = '';
    this.newLicenseNo = '';
    this.newAddress = '';
    this.dynamicFieldValues = {};
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  calcAge() {
    if (this.newDob) {
      const birth = new Date(this.newDob);
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      this.newAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
  }

  onPictureSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.api.uploadFile(file, 'members').subscribe({
        next: res => {
          this.newPhotoUrl = res.fileUrl;
          this.toast.success('Picture uploaded.');
        }
      });
    }
  }

  onDocSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.api.uploadFile(file, 'documents').subscribe({
        next: res => {
          this.newDocUrl = res.fileUrl;
          this.toast.success('Document uploaded.');
        }
      });
    }
  }

  saveMember() {
    if (!this.newFullName.trim()) {
      this.toast.error('Member Name is required.');
      return;
    }
    if (!this.newMobileNo.trim()) {
      this.toast.error('Mobile Number is required.');
      return;
    }

    const payload = {
      memberCode: this.newMemberCode,
      fullName: this.newFullName,
      email: `${this.newFullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@v4journey.com`,
      mobileNo: this.newMobileNo,
      aadhaarNo: this.newAadhaarNo,
      licenseNo: this.newLicenseNo,
      dateOfBirth: this.newDob ? new Date(this.newDob).toISOString() : undefined,
      age: this.newAge,
      gender: this.newGender,
      bloodGroup: this.newBloodGroup,
      foodInfo: this.newFoodInfo,
      role: this.newRole,
      workType: this.newWorkType,
      contractPeriod: this.newContractPeriod,
      workJoinDate: new Date(this.newJoinDate).toISOString(),
      salaryPeriod: this.newSalaryPeriod,
      address: this.newAddress,
      photoUrl: this.newPhotoUrl,
      documentUrl: this.newDocUrl,
      status: 'Available',
      customFieldsJson: JSON.stringify(this.dynamicFieldValues)
    };

    this.api.createMember(payload).subscribe({
      next: () => {
        this.toast.success('Member added successfully.');
        this.closeAddModal();
        this.loadMembers();
      }
    });
  }
}

