import { useEffect, useSyncExternalStore } from 'react';

import type { PlayerLinkPlatform } from './player-link-store.js';

const STORAGE_KEY = 'nami.player.platform-sync';
const SYNC_INTERVAL_MS = 30_000;

export type PlatformSyncId = PlayerLinkPlatform | 'x';

export type PlatformGameplayStats = {
  platformId: PlatformSyncId;
  gamesInLibrary: number;
  achievementsUnlocked: number;
  hoursLogged: number;
  lastSyncedAtMs: number;
  nextSyncAtMs: number;
};

type SyncStore = Partial<Record<PlatformSyncId, PlatformGameplayStats>>;

const BASE_STATS: Record<PlatformSyncId, Omit<PlatformGameplayStats, 'lastSyncedAtMs' | 'nextSyncAtMs'>> = {
  x: { platformId: 'x', gamesInLibrary: 0, achievementsUnlocked: 0, hoursLogged: 0 },
  steam: { platformId: 'steam', gamesInLibrary: 128, achievementsUnlocked: 286, hoursLogged: 2410 },
  epic: { platformId: 'epic', gamesInLibrary: 34, achievementsUnlocked: 72, hoursLogged: 540 },
  xbox: { platformId: 'xbox', gamesInLibrary: 56, achievementsUnlocked: 910, hoursLogged: 1180 },
  playstation: { platformId: 'playstation', gamesInLibrary: 41, achievementsUnlocked: 640, hoursLogged: 920 },
  nintendo: { platformId: 'nintendo', gamesInLibrary: 18, achievementsUnlocked: 120, hoursLogged: 310 },
  riot: { platformId: 'riot', gamesInLibrary: 4, achievementsUnlocked: 88, hoursLogged: 760 },
  discord: { platformId: 'discord', gamesInLibrary: 0, achievementsUnlocked: 0, hoursLogged: 0 },
  itch: { platformId: 'itch', gamesInLibrary: 22, achievementsUnlocked: 14, hoursLogged: 140 },
};

let cachedStore: SyncStore | undefined;
const linkedSnapshotsCache = new Map<string, PlatformGameplayStats[]>();
const EMPTY_LINKED_SNAPSHOTS: PlatformGameplayStats[] = [];

function invalidateCache(): void {
  cachedStore = undefined;
  linkedSnapshotsCache.clear();
}

export function readLinkedPlatformSyncSnapshots(platformIds: PlatformSyncId[]): PlatformGameplayStats[] {
  if (platformIds.length === 0) {
    return EMPTY_LINKED_SNAPSHOTS;
  }

  const cacheKey = platformIds.join('|');
  const cached = linkedSnapshotsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const snapshots = platformIds.flatMap((platformId) => {
    const snapshot = readPlatformSyncSnapshot(platformId);
    return snapshot ? [snapshot] : [];
  });

  linkedSnapshotsCache.set(cacheKey, snapshots);
  return snapshots;
}

function emitChange(): void {
  invalidateCache();
  window.dispatchEvent(new CustomEvent('nami-player-platform-sync-changed'));
}

function readStore(): SyncStore {
  if (cachedStore) {
    return cachedStore;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedStore = {};
      return cachedStore;
    }

    const parsed = JSON.parse(stored) as SyncStore;
    cachedStore = parsed && typeof parsed === 'object' ? parsed : {};
    return cachedStore;
  } catch {
    cachedStore = {};
    return cachedStore;
  }
}

function writeStore(store: SyncStore): void {
  cachedStore = store;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  emitChange();
}

function randomDelta(max: number): number {
  return Math.floor(Math.random() * (max + 1));
}

function createInitialStats(platformId: PlatformSyncId, now = Date.now()): PlatformGameplayStats {
  const base = BASE_STATS[platformId];

  return {
    ...base,
    lastSyncedAtMs: now,
    nextSyncAtMs: now + SYNC_INTERVAL_MS,
  };
}

function tickStats(current: PlatformGameplayStats, now: number): PlatformGameplayStats {
  if (platformIdIsSocialOnly(current.platformId)) {
    return {
      ...current,
      lastSyncedAtMs: now,
      nextSyncAtMs: now + SYNC_INTERVAL_MS,
    };
  }

  return {
    ...current,
    gamesInLibrary: current.gamesInLibrary + (Math.random() > 0.82 ? 1 : 0),
    achievementsUnlocked: current.achievementsUnlocked + randomDelta(2),
    hoursLogged: current.hoursLogged + randomDelta(3),
    lastSyncedAtMs: now,
    nextSyncAtMs: now + SYNC_INTERVAL_MS,
  };
}

function platformIdIsSocialOnly(platformId: PlatformSyncId): boolean {
  return platformId === 'x' || platformId === 'discord';
}

export function ensurePlatformSyncSnapshot(platformId: PlatformSyncId): PlatformGameplayStats {
  const store = readStore();
  const existing = store[platformId];

  if (existing) {
    return existing;
  }

  const next = createInitialStats(platformId);
  writeStore({ ...store, [platformId]: next });

  return next;
}

export function readPlatformSyncSnapshot(platformId: PlatformSyncId): PlatformGameplayStats | null {
  return readStore()[platformId] ?? null;
}

export function refreshPlatformSync(platformId: PlatformSyncId): PlatformGameplayStats {
  const store = readStore();
  const current = store[platformId] ?? createInitialStats(platformId);
  const next = tickStats(current, Date.now());

  writeStore({ ...store, [platformId]: next });

  return next;
}

export function removePlatformSyncSnapshot(platformId: PlatformSyncId): void {
  const store = { ...readStore() };
  delete store[platformId];
  writeStore(store);
}

export function refreshAllPlatformSyncSnapshots(platformIds: PlatformSyncId[]): void {
  for (const platformId of platformIds) {
    refreshPlatformSync(platformId);
  }
}

function subscribe(onStoreChange: () => void): () => void {
  function handleChange(): void {
    invalidateCache();
    onStoreChange();
  }

  window.addEventListener('nami-player-platform-sync-changed', handleChange);

  return () => {
    window.removeEventListener('nami-player-platform-sync-changed', handleChange);
  };
}

export function usePlatformGameplayStats(platformId: PlatformSyncId | null): PlatformGameplayStats | null {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (platformId ? readPlatformSyncSnapshot(platformId) : null),
    () => null
  );

  return snapshot;
}

export function useLinkedPlatformSyncSnapshots(platformIds: PlatformSyncId[]): PlatformGameplayStats[] {
  useEffect(() => {
    if (platformIds.length === 0) {
      return;
    }

    for (const platformId of platformIds) {
      ensurePlatformSyncSnapshot(platformId);
    }

    refreshAllPlatformSyncSnapshots(platformIds);

    const timer = window.setInterval(() => {
      refreshAllPlatformSyncSnapshots(platformIds);
    }, SYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [platformIds.join('|')]);

  return useSyncExternalStore(
    subscribe,
    () => readLinkedPlatformSyncSnapshots(platformIds),
    () => EMPTY_LINKED_SNAPSHOTS,
  );
}

export function formatHoursLogged(hours: number): string {
  return hours.toLocaleString() + ' h';
}

export function resetPlatformSyncStoreForTests(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  emitChange();
}