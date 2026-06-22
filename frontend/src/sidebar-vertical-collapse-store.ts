import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'nami.sidebar.vertically-collapsed';

/** Keep in sync with --sidebar-rail-collapse-duration in phase7-ui.css */
export const SIDEBAR_SECONDARY_COLLAPSE_ANIMATION_MS = 520;

const listeners = new Set<() => void>();
let collapsed = readCollapsedPreference();

function readCollapsedPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function emit(): void {
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-sidebar-vertical-collapse-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function readSidebarVerticallyCollapsed(): boolean {
  return collapsed;
}

export function saveSidebarVerticallyCollapsed(nextCollapsed: boolean): void {
  collapsed = nextCollapsed;

  try {
    window.localStorage.setItem(STORAGE_KEY, nextCollapsed ? 'true' : 'false');
  } catch {
    // Ignore restricted storage environments.
  }

  emit();
}

export function toggleSidebarVerticallyCollapsed(): boolean {
  const nextCollapsed = !collapsed;
  saveSidebarVerticallyCollapsed(nextCollapsed);

  return nextCollapsed;
}

export function useSidebarVerticallyCollapsed(): boolean {
  return useSyncExternalStore(subscribe, readSidebarVerticallyCollapsed, () => false);
}

export function resetSidebarVerticalCollapseStoreForTests(): void {
  collapsed = false;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  emit();
}