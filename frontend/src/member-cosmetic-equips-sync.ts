import { useSyncExternalStore } from 'react';

import {
  hydrateMemberCosmeticEquipsFromServer,
  readLocalEquipsForSync,
} from './member-cosmetic-equips-store.js';
import { isMemberCosmeticEquipsApiAvailable } from './member-cosmetic-equips-api.js';

const POLL_INTERVAL_MS = 5000;

const listeners = new Set<() => void>();
let syncVersion = 0;
let pollHandle: ReturnType<typeof setInterval> | null = null;
let pollSubscriberCount = 0;
let refreshInFlight = false;

function emit(): void {
  syncVersion += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function useMemberCosmeticEquipsSyncSignal(): number {
  return useSyncExternalStore(subscribe, () => syncVersion, () => 0);
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
    // Best-effort refresh while chat is open.
  } finally {
    refreshInFlight = false;
  }
}

export function startMemberCosmeticEquipsPolling(): () => void {
  if (!isMemberCosmeticEquipsApiAvailable()) {
    return () => undefined;
  }

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