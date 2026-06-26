import { useSyncExternalStore } from 'react';

import { isMemberCosmeticEquipsApiAvailable } from './member-cosmetic-equips-api.js';
import {
  hydrateMemberCosmeticEquipsFromServer,
  invalidateMemberCosmeticEquipsCache,
  MEMBER_COSMETIC_EQUIPS_STORAGE_KEY,
  readLocalEquipsForSync,
} from './member-cosmetic-equips-store.js';

const POLL_INTERVAL_MS = 5000;
const BROADCAST_CHANNEL_NAME = 'nami-member-cosmetic-equips';

const listeners = new Set<() => void>();
let syncVersion = 0;
let pollHandle: ReturnType<typeof setInterval> | null = null;
let pollSubscriberCount = 0;
let refreshInFlight = false;
let runtimeStarted = false;
let broadcastChannel: BroadcastChannel | null = null;

function emit(): void {
  syncVersion += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function readMemberCosmeticEquipsSyncVersion(): number {
  return syncVersion;
}

export function useMemberCosmeticEquipsSyncSignal(): number {
  return useSyncExternalStore(subscribe, readMemberCosmeticEquipsSyncVersion, () => 0);
}

function postCrossTabEquipChange(): void {
  try {
    broadcastChannel?.postMessage({ type: 'equips-changed' });
  } catch {
    // BroadcastChannel is best-effort for cross-tab equip sync.
  }
}

function handleExternalEquipChange(): void {
  invalidateMemberCosmeticEquipsCache();
  emit();
}

function onSameTabEquipChange(): void {
  emit();
  postCrossTabEquipChange();
}

function onStorageEquipChange(event: StorageEvent): void {
  if (event.key !== MEMBER_COSMETIC_EQUIPS_STORAGE_KEY) {
    return;
  }

  handleExternalEquipChange();
}

function onBroadcastEquipChange(): void {
  handleExternalEquipChange();
}

function onVisibilityChange(): void {
  if (!document.hidden) {
    void refreshMemberCosmeticEquipsFromServer();
  }
}

function ensureEquipSyncRuntime(): void {
  if (runtimeStarted) {
    return;
  }

  runtimeStarted = true;
  window.addEventListener('nami-member-cosmetic-equips-changed', onSameTabEquipChange);
  window.addEventListener('storage', onStorageEquipChange);
  document.addEventListener('visibilitychange', onVisibilityChange);

  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = onBroadcastEquipChange;
  }
}

export async function refreshMemberCosmeticEquipsFromServer(): Promise<void> {
  if (!isMemberCosmeticEquipsApiAvailable() || refreshInFlight) {
    return;
  }

  refreshInFlight = true;

  try {
    const before = JSON.stringify(readLocalEquipsForSync());
    const changed = await hydrateMemberCosmeticEquipsFromServer();
    const after = JSON.stringify(readLocalEquipsForSync());

    if (changed || before !== after) {
      emit();
    }
  } catch {
    // Best-effort refresh while the app is open.
  } finally {
    refreshInFlight = false;
  }
}

export function startMemberCosmeticEquipsPolling(): () => void {
  if (!isMemberCosmeticEquipsApiAvailable()) {
    return () => undefined;
  }

  ensureEquipSyncRuntime();
  pollSubscriberCount += 1;

  if (!pollHandle) {
    void refreshMemberCosmeticEquipsFromServer();

    pollHandle = setInterval(() => {
      void refreshMemberCosmeticEquipsFromServer();
    }, POLL_INTERVAL_MS);
  }

  return () => {
    pollSubscriberCount = Math.max(0, pollSubscriberCount - 1);

    if (pollSubscriberCount === 0 && pollHandle) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
  };
}

/** Register cross-tab + focus listeners without starting polling. */
export function initMemberCosmeticEquipsSyncListeners(): void {
  ensureEquipSyncRuntime();
}

/** App-wide equip sync: polling, cross-tab updates, and focus refresh. */
export function startMemberCosmeticEquipsAppSync(): () => void {
  initMemberCosmeticEquipsSyncListeners();
  return startMemberCosmeticEquipsPolling();
}