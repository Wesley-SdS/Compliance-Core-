import { useState, useCallback, useEffect } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let toastState: Toast[] = [];
let toastCount = 0;

function dispatch(toasts: Toast[]) {
  toastState = toasts;
  listeners.forEach((l) => l(toasts));
}

export function toast(props: Omit<Toast, 'id'>) {
  const id = String(++toastCount);
  const newToast = { ...props, id };
  dispatch([...toastState, newToast]);
  setTimeout(() => {
    dispatch(toastState.filter((t) => t.id !== id));
  }, 4000);
  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastState);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    dispatch(toastState.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
