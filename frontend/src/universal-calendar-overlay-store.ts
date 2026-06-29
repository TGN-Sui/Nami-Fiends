import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openUniversalCalendarOverlay(): void {
  open = true;
  emit();
}

export function closeUniversalCalendarOverlay(): void {
  open = false;
  emit();
}

export function isUniversalCalendarOverlayOpen(): boolean {
  return open;
}

export function useUniversalCalendarOverlayOpen(): boolean {
  return useSyncExternalStore(subscribe, isUniversalCalendarOverlayOpen, () => false);
}