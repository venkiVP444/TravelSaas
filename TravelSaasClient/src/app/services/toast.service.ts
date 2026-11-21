import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);
  private counter = 0;

  show(type: 'success' | 'error' | 'info', message: string, durationMs = 3500) {
    const id = ++this.counter;
    this.toasts.update(current => [...current, { id, type, message }]);

    setTimeout(() => {
      this.dismiss(id);
    }, durationMs);
  }

  success(message: string) {
    this.show('success', message);
  }

  error(message: string) {
    this.show('error', message);
  }

  info(message: string) {
    this.show('info', message);
  }

  dismiss(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}

