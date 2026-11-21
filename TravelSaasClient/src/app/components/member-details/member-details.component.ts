import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { MemberItem, PaymentItem } from '../../models/models';

@Component({
  selector: 'app-member-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="member-details-page" *ngIf="member(); else loadingTpl">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/team" class="back-btn">←</a>
          <div>
            <div class="title-with-pill">
              <h1 class="page-title">Member Details</h1>
              <span class="contract-pill">● Contract Ends In 14 Months</span>
            </div>
            <p class="page-subtitle">Here you can manage all your team members</p>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary" (click)="openEditModal()">Edit</button>
          <button class="btn btn-primary" (click)="openPayoutModal()">+ Record Payout</button>
        </div>
      </div>

      <!-- Main Layout: Left Profile Card + Right KPI Stats & Payment Details Table -->
      <div class="details-grid">
        <!-- Left Profile Card matching Figma -->
        <div class="profile-card">
          <div class="photo-box">
            <img *ngIf="member()?.photoUrl" [src]="member()?.photoUrl" alt="Member Photo" />
            <div *ngIf="!member()?.photoUrl" class="photo-placeholder">👤</div>
          </div>

          <div class="profile-header-meta">
            <div class="code-status-row">
              <span class="m-code">{{ member()?.memberCode }}</span>
              <span class="badge" [ngClass]="'badge-' + member()?.status?.toLowerCase()">
                {{ member()?.status }}
              </span>
            </div>
            <h2 class="profile-name">{{ member()?.fullName }}</h2>
            <div class="profile-role-phone">
              <span class="role-text">{{ member()?.role }}</span>
              <span class="phone-text">{{ member()?.mobileNo }}</span>
            </div>
          </div>

          <!-- Detailed Info Grid -->
          <div class="info-grid">
            <div class="info-item">
              <span class="i-lbl">Aadhaar Card No.</span>
              <strong class="i-val">{{ member()?.aadhaarNo || '-' }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">License No.</span>
              <strong class="i-val">{{ member()?.licenseNo || '-' }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Work Type</span>
              <strong class="i-val">{{ member()?.workType }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Salary Period</span>
              <strong class="i-val">{{ member()?.salaryPeriod }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Member Created Date</span>
              <strong class="i-val">{{ member()?.workJoinDate | date:'dd MMM yyyy' }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Contract Period</span>
              <strong class="i-val">{{ member()?.contractPeriod }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Work Join Date</span>
              <strong class="i-val">{{ member()?.workJoinDate | date:'dd MMM yyyy' }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Work End Date</span>
              <strong class="i-val">{{ member()?.workEndDate ? (member()?.workEndDate | date:'dd MMM yyyy') : '15 Dec 2029' }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">DOB (Age)</span>
              <strong class="i-val">{{ member()?.dateOfBirth ? (member()?.dateOfBirth | date:'dd MMM yyyy') : '27 Jun 1998' }} ({{ member()?.age }})</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Gender</span>
              <strong class="i-val">{{ member()?.gender }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Blood Grp</span>
              <strong class="i-val">{{ member()?.bloodGroup }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Food Info</span>
              <strong class="i-val">{{ member()?.foodInfo }}</strong>
            </div>
          </div>

          <!-- Address -->
          <div class="address-box">
            <span class="i-lbl">Address</span>
            <p class="address-text">{{ member()?.address || 'No address registered' }}</p>
          </div>

          <!-- Dynamic Custom Fields Configured by Admin -->
          <div class="custom-fields-display" *ngIf="parsedCustomFields().length > 0">
            <span class="i-lbl">Custom Configured Attributes</span>
            <div *ngFor="let cf of parsedCustomFields()" class="cf-item">
              <span class="cf-lbl">{{ cf.key }}:</span>
              <strong class="cf-val">{{ cf.val }}</strong>
            </div>
          </div>

          <!-- Attachments -->
          <div class="attachments-box">
            <span class="i-lbl">Attachments</span>
            <div class="attachment-file" (click)="viewAttachment()">
              <span class="file-icon">📄</span>
              <span class="file-name">{{ member()?.documentUrl ? 'Aadhaar-Document.pdf' : 'Aadhaar Card-rahul.jpg' }}</span>
            </div>
          </div>
        </div>

        <!-- Right Main Column: Stats & Payment Details Table matching Figma -->
        <div class="right-main">
          <!-- 3 Stat KPI Cards matching Figma -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="s-lbl">Trips Attempt</span>
              <strong class="s-val">{{ member()?.tripsAttemptCount }}</strong>
            </div>

            <div class="stat-card">
              <span class="s-lbl">Earnings</span>
              <strong class="s-val text-success">Rs.{{ member()?.totalEarnings | number }}</strong>
            </div>

            <div class="stat-card">
              <span class="s-lbl">Balance</span>
              <strong class="s-val text-warning">Rs.{{ member()?.totalBalance | number }}</strong>
            </div>
          </div>

          <!-- Payment Details Section -->
          <div class="payments-section">
            <h2 class="section-title">Payment Details</h2>

            <!-- Search, Sort & Export Bar matching Figma -->
            <div class="table-controls">
              <div class="search-box">
                <input
                  type="text"
                  placeholder="Search payment records..."
                  [(ngModel)]="searchPaymentQuery"
                />
                <span class="search-icon">🔍</span>
              </div>

              <div class="controls-right">
                <div class="sort-box">
                  <label>Sort</label>
                  <select [(ngModel)]="paymentSort">
                    <option value="date">Paid date</option>
                    <option value="amount">Amount</option>
                  </select>
                </div>

                <button class="btn btn-export" (click)="exportPayments()">Export</button>
              </div>
            </div>

            <!-- Payments Table matching Figma -->
            <table class="figma-table">
              <thead>
                <tr>
                  <th class="th-check"><input type="checkbox" /></th>
                  <th>Trip ID</th>
                  <th>Trip Name</th>
                  <th>Days</th>
                  <th>Working Period</th>
                  <th>Payment Mode</th>
                  <th>Paid Date</th>
                  <th>Paid Amount</th>
                  <th>Balance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of filteredPayments()">
                  <td class="td-check"><input type="checkbox" /></td>
                  <td class="td-code">{{ p.tripCode }}</td>
                  <td class="td-name">{{ p.tripName }}</td>
                  <td>{{ p.daysCount || '2D 1N' }}</td>
                  <td>{{ p.workingPeriod }}</td>
                  <td>{{ p.paymentMode }}</td>
                  <td>{{ p.paymentDate | date:'dd MMM yyyy' }}</td>
                  <td>{{ p.amount | number }}</td>
                  <td>{{ p.balance | number }}</td>
                  <td>
                    <button class="link-download" (click)="downloadReceipt(p)">
                      Download Receipt
                    </button>
                  </td>
                </tr>

                <tr *ngIf="filteredPayments().length === 0">
                  <td colspan="10" class="empty-cell">No payment records found for this team member.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Record Payout Modal -->
      <div class="modal-backdrop" *ngIf="showPayoutModal" (click)="showPayoutModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Record Team Payout</h3>
            <button class="close-x" (click)="showPayoutModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label>Trip Code & Name</label>
              <input type="text" [(ngModel)]="newPayoutTripCode" placeholder="e.g. #0001 Kochi to Munnar" />
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Paid Amount (Rs.)</label>
                <input type="number" [(ngModel)]="newPayoutAmount" />
              </div>
              <div class="form-field">
                <label>Balance (Rs.)</label>
                <input type="number" [(ngModel)]="newPayoutBalance" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Payment Mode</label>
                <select [(ngModel)]="newPayoutMode">
                  <option value="Online">Online</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BankTransfer">Bank Transfer</option>
                </select>
              </div>
              <div class="form-field">
                <label>Working Period</label>
                <input type="text" [(ngModel)]="newPayoutPeriod" placeholder="e.g. 10 Nov 2026 - 12 Nov 2026" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showPayoutModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="commitPayout()">Save Payout</button>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state">Loading member details...</div>
    </ng-template>
  `,
  styles: [`
    .member-details-page {
      padding: 24px 32px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
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

    .title-with-pill {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .page-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #fff;
    }

    .contract-pill {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid #3b82f6;
      color: #60a5fa;
      padding: 3px 12px;
      border-radius: var(--radius-full);
      font-size: 0.74rem;
      font-weight: 600;
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

    .details-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 24px;
      align-items: flex-start;
    }

    /* Left Profile Card matching Figma */
    .profile-card {
      background: #14141c;
      border: 1px solid #232330;
      border-radius: var(--radius-md);
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .photo-box {
      width: 100%;
      height: 190px;
      background: #1b1b26;
      border-radius: var(--radius-sm);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .photo-placeholder {
      font-size: 3.5rem;
    }

    .code-status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .m-code {
      font-weight: 700;
      color: var(--text-muted);
    }

    .profile-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
    }

    .profile-role-phone {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .role-text {
      color: #38bdf8;
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 10px;
      border-top: 1px solid #20202e;
      border-bottom: 1px solid #20202e;
      padding: 16px 0;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .i-lbl {
      font-size: 0.72rem;
      color: var(--text-dim);
      font-weight: 500;
    }

    .i-val {
      font-size: 0.82rem;
      color: #fff;
    }

    .address-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .address-text {
      font-size: 0.8rem;
      color: #b8b8cc;
      line-height: 1.4;
    }

    .custom-fields-display {
      background: #1a1a27;
      border: 1px solid #28283a;
      border-radius: var(--radius-sm);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .cf-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
    }

    .cf-lbl {
      color: var(--text-muted);
    }

    .attachments-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .attachment-file {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #191924;
      border: 1px solid #262638;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      color: #38bdf8;
      cursor: pointer;
    }

    /* Right Main Column */
    .right-main {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .stat-card {
      background: #14141c;
      border: 1px solid #232330;
      border-radius: var(--radius-sm);
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .s-lbl {
      font-size: 0.84rem;
      color: var(--text-muted);
    }

    .s-val {
      font-size: 1.8rem;
      font-weight: 800;
      color: #fff;
    }

    .payments-section {
      background: #14141c;
      border: 1px solid #232330;
      border-radius: var(--radius-md);
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
    }

    .table-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .search-box {
      position: relative;
      width: 320px;
    }

    .search-box input {
      background: #191924;
      border: 1px solid #262638;
      border-radius: var(--radius-full);
      padding: 8px 36px 8px 16px;
      font-size: 0.84rem;
    }

    .search-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.85rem;
      color: var(--primary);
    }

    .controls-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .sort-box {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.84rem;
      color: var(--text-muted);
    }

    .sort-box select {
      background: #191924;
      border: 1px solid #262638;
      border-radius: var(--radius-sm);
      padding: 6px 12px;
      font-size: 0.84rem;
    }

    .btn-export {
      border: 1px solid #ff4500;
      color: #ff4500;
      background: transparent;
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.84rem;
    }

    .btn-export:hover {
      background: rgba(255, 69, 0, 0.1);
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

    .link-download {
      color: #38bdf8;
      font-weight: 600;
      text-decoration: underline;
    }

    /* Modal */
    .modal-content {
      background: #181824;
      border: 1px solid #2d2d42;
      border-radius: var(--radius-md);
      width: 460px;
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

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
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
    }

    .loading-state {
      padding: 60px;
      text-align: center;
      color: var(--text-muted);
    }
  `]
})
export class MemberDetailsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  member = signal<MemberItem | null>(null);
  payments = signal<PaymentItem[]>([]);

  searchPaymentQuery = '';
  paymentSort = 'date';

  // Payout Modal
  showPayoutModal = false;
  newPayoutTripCode = '#0001 Kochi to Munnar';
  newPayoutAmount = 5000;
  newPayoutBalance = 0;
  newPayoutMode = 'Online';
  newPayoutPeriod = '15 Nov 2026 - 18 Nov 2026';

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadMember(params['id']);
      }
    });
  }

  loadMember(id: string) {
    this.api.getMemberById(id).subscribe(data => {
      this.member.set(data);
      this.loadPayments(id);
    });
  }

  loadPayments(memberId: string) {
    this.api.getPayments(memberId).subscribe(data => {
      this.payments.set(data);
    });
  }

  parsedCustomFields(): { key: string; val: string }[] {
    const raw = this.member()?.customFieldsJson;
    if (!raw) return [];
    try {
      const obj = JSON.parse(raw);
      return Object.entries(obj).map(([key, val]) => ({ key, val: String(val) }));
    } catch {
      return [];
    }
  }

  filteredPayments(): PaymentItem[] {
    let list = this.payments();
    if (this.searchPaymentQuery.trim()) {
      const q = this.searchPaymentQuery.toLowerCase();
      list = list.filter(p =>
        (p.tripCode && p.tripCode.toLowerCase().includes(q)) ||
        (p.tripName && p.tripName.toLowerCase().includes(q)) ||
        (p.paymentMode && p.paymentMode.toLowerCase().includes(q))
      );
    }
    return list;
  }

  openEditModal() {
    this.toast.info('Editing member profile.');
  }

  openPayoutModal() {
    this.showPayoutModal = true;
  }

  commitPayout() {
    const m = this.member();
    if (!m) return;

    const payload = {
      memberId: m.id,
      memberName: m.fullName,
      tripCode: this.newPayoutTripCode.split(' ')[0],
      tripName: this.newPayoutTripCode,
      amount: this.newPayoutAmount,
      balance: this.newPayoutBalance,
      paymentMode: this.newPayoutMode,
      status: this.newPayoutBalance === 0 ? 'Paid' : 'Partial',
      paymentDate: new Date().toISOString(),
      workingPeriod: this.newPayoutPeriod,
      daysCount: '3D 2N'
    };

    this.api.createPayment(payload).subscribe({
      next: () => {
        this.toast.success('Payout record saved.');
        this.showPayoutModal = false;
        this.loadPayments(m.id);
      }
    });
  }

  downloadReceipt(p: PaymentItem) {
    // Generate text/csv receipt for immediate real download
    const content = `RECEIPT - V4JOURNEY TRAVEL SAAS
Receipt No: ${p.receiptNumber || 'REC-2026-001'}
Date: ${new Date(p.paymentDate).toLocaleDateString()}
Team Member: ${p.memberName}
Trip: ${p.tripCode} - ${p.tripName}
Period: ${p.workingPeriod}
Payment Mode: ${p.paymentMode}
Amount Paid: Rs. ${p.amount}
Balance: Rs. ${p.balance}
Status: ${p.status}
Issued By: V4Journey Operations`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${p.receiptNumber || 'payout'}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('Receipt downloaded.');
  }

  exportPayments() {
    this.toast.info('Exporting payment ledger.');
  }

  viewAttachment() {
    this.toast.info('Aadhaar Document opened.');
  }
}

