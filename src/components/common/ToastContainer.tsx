import React, { useEffect, useState } from 'react';
import { toastService, ToastItem } from '../../services/toastService';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastService.subscribe((items) => {
      setToasts(items);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          SUCCESS: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
          ERROR: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
          WARNING: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
          INFO: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
        };

        const bgBorders = {
          SUCCESS: 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white',
          ERROR: 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white',
          WARNING: 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white',
          INFO: 'bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-800 text-slate-900 dark:text-white',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${bgBorders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 text-xs">
              {toast.title && <div className="font-bold text-xs mb-0.5">{toast.title}</div>}
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => toastService.remove(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
