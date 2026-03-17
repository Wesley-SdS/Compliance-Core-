'use client';

import { useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border px-4 py-3 shadow-lg text-sm max-w-sm animate-in slide-in-from-bottom-5 ${
            toast.variant === 'destructive'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-slate-200 bg-white text-slate-800'
          }`}
        >
          {toast.title && <div className="font-medium">{toast.title}</div>}
          {toast.description && <div className="mt-1 text-xs opacity-80">{toast.description}</div>}
          <button type="button" onClick={() => dismiss(toast.id)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
