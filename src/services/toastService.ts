/**
 * In-App Toast Notification Service
 * Replaces window.alert and provides clean non-blocking feedback.
 */

export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(message: string, type: ToastType = 'INFO', title?: string, duration: number = 4000) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newToast: ToastItem = { id, message, type, title, duration };
    this.toasts = [...this.toasts, newToast];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, title: string = 'Thành công') {
    this.show(message, 'SUCCESS', title);
  }

  error(message: string, title: string = 'Lỗi / Cảnh báo') {
    this.show(message, 'ERROR', title, 5000);
  }

  warning(message: string, title: string = 'Lưu ý') {
    this.show(message, 'WARNING', title, 4500);
  }

  info(message: string, title: string = 'Thông báo') {
    this.show(message, 'INFO', title);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }
}

export const toastService = new ToastManager();
