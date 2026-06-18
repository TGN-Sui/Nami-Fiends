import { useSyncExternalStore } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import {
  readAllOwnerAssets,
  readOwnerAsset,
  saveOwnerAssets,
  type OwnerAssetMap,
} from './nami-owner-assets-store.js';

export type NamiOwnerEditModeSnapshot = {
  active: boolean;
  dirty: boolean;
  drafts: OwnerAssetMap;
  notice: string | null;
  error: string | null;
};

const SETTINGS_SECTION_FOCUS_KEY = 'nami.settings.section-focus';

let snapshot: NamiOwnerEditModeSnapshot = {
  active: false,
  dirty: false,
  drafts: {},
  notice: null,
  error: null,
};

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): NamiOwnerEditModeSnapshot {
  return snapshot;
}

export function useNamiOwnerEditMode(): NamiOwnerEditModeSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function resolveOwnerAssetUrl(slotId: string): string | null {
  if (snapshot.active) {
    if (slotId in snapshot.drafts) {
      return snapshot.drafts[slotId] ?? null;
    }
  }

  return readOwnerAsset(slotId);
}

export function prepareOwnerDashboardReturn(): void {
  try {
    window.sessionStorage.setItem(SETTINGS_SECTION_FOCUS_KEY, 'advanced');
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function enterNamiOwnerEditMode(actorOwner: string | null): boolean {
  if (!isOfficialOwner(actorOwner)) {
    return false;
  }

  snapshot = {
    active: true,
    dirty: false,
    drafts: readAllOwnerAssets(),
    notice: null,
    error: null,
  };

  document.body.classList.add('is-nami-owner-edit-mode');
  emit();
  return true;
}

export function exitNamiOwnerEditMode(): void {
  snapshot = {
    active: false,
    dirty: false,
    drafts: {},
    notice: null,
    error: null,
  };

  document.body.classList.remove('is-nami-owner-edit-mode');
  emit();
}

export function returnToOwnerDashboard(): void {
  prepareOwnerDashboardReturn();
  exitNamiOwnerEditMode();
}

export function setOwnerAssetDraft(slotId: string, imageUrl: string | null): void {
  if (!snapshot.active) {
    return;
  }

  const drafts = { ...snapshot.drafts };

  if (imageUrl) {
    drafts[slotId] = imageUrl;
  } else {
    delete drafts[slotId];
  }

  snapshot = {
    ...snapshot,
    drafts,
    dirty: true,
    notice: null,
    error: null,
  };

  emit();
}

export function saveOwnerAssetDrafts(actorOwner: string | null): boolean {
  if (!isOfficialOwner(actorOwner) || !snapshot.active) {
    return false;
  }

  const saved = saveOwnerAssets(snapshot.drafts, actorOwner);

  if (!saved) {
    snapshot = {
      ...snapshot,
      error: 'Only the Nami Official owner can save platform artwork.',
    };
    emit();
    return false;
  }

  snapshot = {
    ...snapshot,
    dirty: false,
    notice: 'Platform artwork saved.',
    error: null,
  };

  emit();
  return true;
}

export function discardOwnerAssetDrafts(): void {
  if (!snapshot.active) {
    return;
  }

  snapshot = {
    ...snapshot,
    drafts: readAllOwnerAssets(),
    dirty: false,
    notice: null,
    error: null,
  };

  emit();
}