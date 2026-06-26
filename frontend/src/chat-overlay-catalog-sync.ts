import { useSyncExternalStore } from 'react';

import { isChatOverlayRewardsApiAvailable } from './chat-overlay-rewards-api.js';
import { processChatOverlayCatalogSyncQueue } from './chat-overlay-rewards-retry-queue.js';
import { hydrateChatOverlayRewardsFromServer } from './chat-overlay-rewards-sync.js';
import {
  invalidateOfficialChatOverlayRewardsCache,
  OFFICIAL_CHAT_OVERLAY_REWARDS_STORAGE_KEY,
  readOfficialChatOverlayRewards,
} from './official-chat-overlay-rewards-store.js';

const POLL_INTERVAL_MS = 15000;
const BROADCAST_CHANNEL_NAME = 'nami-chat-overlay-rewards';

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

export function readChatOverlayCatalogSyncVersion(): number {
  return syncVersion;
}

export function useChatOverlayCatalogSyncSignal(): number {
  return useSyncExternalStore(subscribe, readChatOverlayCatalogSyncVersion, () => 0);
}

function postCrossTabCatalogChange(): void {
  try {
    broadcastChannel?.postMessage({ type: 'catalog-changed' });
  } catch {
    // BroadcastChannel is best-effort for cross-tab catalog sync.
  }
}

function handleExternalCatalogChange(): void {
  invalidateOfficialChatOverlayRewardsCache();
  emit();
}

function onSameTabCatalogChange(): void {
  emit();
  postCrossTabCatalogChange();
}

function onStorageCatalogChange(event: StorageEvent): void {
  if (event.key !== OFFICIAL_CHAT_OVERLAY_REWARDS_STORAGE_KEY) {
    return;
  }

  handleExternalCatalogChange();
}

function onBroadcastCatalogChange(): void {
  handleExternalCatalogChange();
}

function onVisibilityChange(): void {
  if (!document.hidden) {
    void refreshChatOverlayCatalogFromServer();
    void processChatOverlayCatalogSyncQueue();
  }
}

function ensureCatalogSyncRuntime(): void {
  if (runtimeStarted) {
    return;
  }

  runtimeStarted = true;
  window.addEventListener('nami-official-chat-overlay-rewards-changed', onSameTabCatalogChange);
  window.addEventListener('storage', onStorageCatalogChange);
  document.addEventListener('visibilitychange', onVisibilityChange);

  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = onBroadcastCatalogChange;
  }
}

function catalogFingerprint(): string {
  return JSON.stringify(
    readOfficialChatOverlayRewards().map((reward) => ({
      id: reward.id,
      updatedAtMs: reward.updatedAtMs,
      staticArtUrl: reward.staticArtUrl,
      animatedArtUrl: reward.animatedArtUrl,
      condition: reward.condition,
      enabled: reward.enabled,
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
    const changed = await hydrateChatOverlayRewardsFromServer();
    const after = catalogFingerprint();

    if (changed || before !== after) {
      emit();
    }
  } catch {
    // Best-effort refresh while the app is open.
  } finally {
    refreshInFlight = false;
  }
}

export function startChatOverlayCatalogPolling(): () => void {
  if (!isChatOverlayRewardsApiAvailable()) {
    return () => undefined;
  }

  ensureCatalogSyncRuntime();
  pollSubscriberCount += 1;

  if (!pollHandle) {
    void refreshChatOverlayCatalogFromServer();

    pollHandle = setInterval(() => {
      void refreshChatOverlayCatalogFromServer();
      void processChatOverlayCatalogSyncQueue();
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
export function initChatOverlayCatalogSyncListeners(): void {
  ensureCatalogSyncRuntime();
}

/** App-wide catalog sync: polling, cross-tab updates, and focus refresh. */
export function startChatOverlayCatalogAppSync(): () => void {
  initChatOverlayCatalogSyncListeners();
  return startChatOverlayCatalogPolling();
}

export function resetChatOverlayCatalogSyncForTests(): void {
  syncVersion = 0;
  refreshInFlight = false;
  runtimeStarted = false;
  pollSubscriberCount = 0;

  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }

  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
}