import { useSyncExternalStore } from 'react';

export type NamiToastTone = 'info' | 'success' | 'error';

export type NamiToast = {
  id: string;
  message: string;
  tone: NamiToastTone;
  createdAtMs: number;
  durationMs: number;
};

const DEFAULT_DURATION_MS = 5200;

const listeners = new Set<() => void>();
let toasts: NamiToast[] = [];
const dismissHandles = new Map<string, ReturnType<typeof setTimeout>>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function scheduleDismiss(toast: NamiToast): void {
  const existing = dismissHandles.get(toast.id);

  if (existing) {
    clearTimeout(existing);
  }

  const handle = setTimeout(() => {
    dismissNamiToast(toast.id);
  }, toast.durationMs);

  dismissHandles.set(toast.id, handle);
}

export function readNamiToasts(): NamiToast[] {
  return toasts;
}

export function pushNamiToast(
  message: string,
  tone: NamiToastTone = 'info',
  durationMs = DEFAULT_DURATION_MS
): string {
  const toast: NamiToast = {
    id: 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    message: message.trim(),
    tone,
    createdAtMs: Date.now(),
    durationMs,
  };

  toasts = [toast, ...toasts].slice(0, 4);
  scheduleDismiss(toast);
  emit();

  return toast.id;
}

export function dismissNamiToast(id: string): void {
  const handle = dismissHandles.get(id);

  if (handle) {
    clearTimeout(handle);
    dismissHandles.delete(id);
  }

  const next = toasts.filter((toast) => toast.id !== id);

  if (next.length === toasts.length) {
    return;
  }

  toasts = next;
  emit();
}

export function useNamiToasts(): NamiToast[] {
  return useSyncExternalStore(subscribe, readNamiToasts, readNamiToasts);
}

export function resetNamiToastsForTests(): void {
  dismissHandles.forEach((handle) => clearTimeout(handle));
  dismissHandles.clear();
  toasts = [];
  emit();
}