import { create } from 'zustand';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  show: (type: ToastType, message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (type, message, duration = 4000) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
    if (duration > 0) {
      setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), duration);
    }
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: 'text-green-500 bg-green-500/10 border-green-500/20',
  error: 'text-red-500 bg-red-500/10 border-red-500/20',
  warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  info: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToastStore();
  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-lg backdrop-blur-sm animate-toast-in',
        'bg-[var(--bg-surface)] border-[var(--border)]'
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0', colors[toast.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm text-[var(--fg)] flex-1 min-w-0">{toast.message}</p>
      <button
        onClick={() => dismiss(toast.id)}
        className="h-6 w-6 flex items-center justify-center rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-surface-hover)] transition-colors flex-shrink-0 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

// Convenience function
export const toast = {
  success: (msg: string) => useToastStore.getState().show('success', msg),
  error: (msg: string) => useToastStore.getState().show('error', msg),
  warning: (msg: string) => useToastStore.getState().show('warning', msg),
  info: (msg: string) => useToastStore.getState().show('info', msg),
};
