import { useSyncExternalStore } from 'react';

import { isChatOverlayRewardsApiAvailable } from './chat-overlay-rewards-api.js';
import { hydrateChatOverlayRewardsFromServer } from './chat-overlay-rewards-sync.js';
import { readOfficialChatOverlayRewards } from './official-chat-overlay-rewards-store.js';

const POLL_INTERVAL_MS = 15000;

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

export function useChatOverlayCatalogSyncSignal(): number {
  return useSyncExternalStore(subscribe, () => syncVersion, () => 0);
}

function catalogFingerprint(): string {
  return JSON.stringify(
    readOfficialChatOverlayRewards().map((reward) => ({
      id: reward.id,
      updatedAtMs: reward.updatedAtMs,
      staticArtUrl: reward.staticArtUrl,
      animatedArtUrl: reward.animatedArtUrl,
      condition: reward.condition,
    }))
  );
}

export async function refreshChatOverlayCatalogFromServer(): Promise<void> {
  if (!isChatOverlayRewardsApiAvailable() || refreshInFlight) {
    return;
  }

  refreshInFlight = true;

  try {
    const before = catalogFingerprint();
    await hydrateChatOverlayRewardsFromServer();
    const after = catalogFingerprint();

    if (before !== after) {
      emit();
    }
  } catch {
    // Best-effort refresh while chat is open.
  } finally {
    refreshInFlight = false;
  }
}

export function startChatOverlayCatalogPolling(): () => void {
  if (!isChatOverlayRewardsApiAvailable()) {
    return () => undefined;
  }

  pollSubscriberCount += 1;

  if (!pollHandle) {
    void refreshChatOverlayCatalogFromServer();

    pollHandle = setInterval(() => {
      void refreshChatOverlayCatalogFromServer();
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