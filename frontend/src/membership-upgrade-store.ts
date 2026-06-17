import { useSyncExternalStore } from 'react';

let overlayOpen = false;

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readOverlayOpen(): boolean {
  return overlayOpen;
}

export function openMembershipUpgradeOverlay(): void {
  if (overlayOpen) {
    return;
  }

  overlayOpen = true;
  emit();
}

export function closeMembershipUpgradeOverlay(): void {
  if (!overlayOpen) {
    return;
  }

  overlayOpen = false;
  emit();
}

export function useMembershipUpgradeOverlayOpen(): boolean {
  return useSyncExternalStore(subscribe, readOverlayOpen, () => false);
}