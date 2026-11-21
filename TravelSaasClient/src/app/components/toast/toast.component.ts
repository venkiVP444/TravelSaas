import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toastService.toasts().length > 0">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast-item"
        [ngClass]="'toast-' + toast.type"
        (click)="toastService.dismiss(toast.id)"
      >
        <span class="toast-icon">
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'info'">ℹ</span>
        </span>
        <span class="toast-text">{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .toast-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: var(--radius-sm);
      font-size: 0.88rem;
      font-weight: 500;
      color: #fff;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      cursor: pointer;
      animation: slideUp 0.2s ease-out;
    }
    .toast-success {
      background: #065f46;
      border: 1px solid #10b981;
    }
    .toast-error {
      background: #881337;
      border: 1px solid #f43f5e;
    }
    .toast-info {
      background: #1e3a8a;
      border: 1px solid #3b82f6;
    }
    .toast-icon {
      font-weight: 700;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}

