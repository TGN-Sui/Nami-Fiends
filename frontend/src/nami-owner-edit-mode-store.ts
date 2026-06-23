import { useSyncExternalStore } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import {
  ownerAssetSaveErrorMessage,
  readAllOwnerAssets,
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

export function resolveOwnerAssetUrl(
  slotId: string,
  persistedAssets: OwnerAssetMap = readAllOwnerAssets()
): string | null {
  if (snapshot.active && slotId in snapshot.drafts) {
    return snapshot.drafts[slotId] ?? null;
  }

  return persistedAssets[slotId] ?? null;
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

export async function saveOwnerAssetDrafts(actorOwner: string | null): Promise<boolean> {
  if (!isOfficialOwner(actorOwner) || !snapshot.active) {
    return false;
  }

  const saveError = await saveOwnerAssets(snapshot.drafts, actorOwner);

  if (saveError) {
    snapshot = {
      ...snapshot,
      error: ownerAssetSaveErrorMessage(saveError),
    };
    emit();
    return false;
  }

  snapshot = {
    ...snapshot,
    dirty: false,
    drafts: readAllOwnerAssets(),
    notice: 'Platform artwork saved. Testers will see it after the next page load.',
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