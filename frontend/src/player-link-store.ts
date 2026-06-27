import { useSyncExternalStore } from 'react';

import {
  ensurePlatformSyncSnapshot,
  refreshPlatformSync,
  removePlatformSyncSnapshot,
} from './player-platform-sync-store.js';
import type { VerifiedPlatformLinkRecord } from './player-score-platform-eligibility.js';

const STORAGE_KEY = 'nami.player.platform-links';

export type PlayerLinkPlatform =
  | 'steam'
  | 'epic'
  | 'xbox'
  | 'playstation'
  | 'nintendo'
  | 'riot'
  | 'discord'
  | 'itch';

const PLATFORM_IDS: ReadonlySet<string> = new Set([
  'steam',
  'epic',
  'xbox',
  'playstation',
  'nintendo',
  'riot',
  'discord',
  'itch',
]);

let cachedLinks: VerifiedPlatformLinkRecord[] | undefined;

function invalidateCache(): void {
  cachedLinks = undefined;
}

function emitChange(): void {
  invalidateCache();
  window.dispatchEvent(new CustomEvent('nami-player-platform-links-changed'));
}

function isPlayerLinkPlatform(value: unknown): value is PlayerLinkPlatform {
  return typeof value === 'string' && PLATFORM_IDS.has(value);
}

function normalizeLinkRecord(entry: unknown): VerifiedPlatformLinkRecord | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const record = entry as Partial<VerifiedPlatformLinkRecord>;

  if (!isPlayerLinkPlatform(record.platformId)) {
    return null;
  }

  return {
    platformId: record.platformId,
    linkedAtMs: typeof record.linkedAtMs === 'number' ? record.linkedAtMs : Date.now(),
    verified: record.verified === true,
    platformUserId: typeof record.platformUserId === 'string' ? record.platformUserId : undefined,
    accountCreatedAtMs:
      typeof record.accountCreatedAtMs === 'number' ? record.accountCreatedAtMs : undefined,
    scoreEligible: typeof record.scoreEligible === 'boolean' ? record.scoreEligible : undefined,
    hasPostPassportActivity:
      typeof record.hasPostPassportActivity === 'boolean'
        ? record.hasPostPassportActivity
        : undefined,
  };
}

function migrateLegacyLinks(parsed: { linked?: unknown; links?: unknown }): VerifiedPlatformLinkRecord[] {
  if (Array.isArray(parsed.links)) {
    return parsed.links
      .map((entry) => normalizeLinkRecord(entry))
      .filter((entry): entry is VerifiedPlatformLinkRecord => entry !== null);
  }

  if (!Array.isArray(parsed.linked)) {
    return [];
  }

  const migratedAtMs = Date.now();

  return parsed.linked
    .filter((entry): entry is PlayerLinkPlatform => isPlayerLinkPlatform(entry))
    .map((platformId) => ({
      platformId,
      linkedAtMs: migratedAtMs,
      verified: false,
    }));
}

export function readPlayerPlatformLinks(): VerifiedPlatformLinkRecord[] {
  if (cachedLinks) {
    return cachedLinks;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedLinks = [];
      return cachedLinks;
    }

    const parsed = JSON.parse(stored) as { linked?: unknown; links?: unknown };
    cachedLinks = migrateLegacyLinks(parsed);
    return cachedLinks;
  } catch {
    cachedLinks = [];
    return cachedLinks;
  }
}

export function readLinkedPlayerPlatforms(): PlayerLinkPlatform[] {
  return readPlayerPlatformLinks().map((entry) => entry.platformId);
}

export function isPlayerPlatformLinked(platformId: PlayerLinkPlatform): boolean {
  return readLinkedPlayerPlatforms().includes(platformId);
}

function writePlayerPlatformLinks(links: VerifiedPlatformLinkRecord[]): void {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      links,
      updatedAtMs: Date.now(),
    })
  );
  emitChange();
}

export function linkPlayerPlatform(platformId: PlayerLinkPlatform): void {
  const existing = readPlayerPlatformLinks();
  const next = existing.filter((entry) => entry.platformId !== platformId);

  next.push({
    platformId,
    linkedAtMs: Date.now(),
    verified: false,
  });

  writePlayerPlatformLinks(next);
  ensurePlatformSyncSnapshot(platformId);
  refreshPlatformSync(platformId);
}

export function upsertVerifiedPlayerPlatformLink(
  record: VerifiedPlatformLinkRecord
): void {
  const next = readPlayerPlatformLinks().filter(
    (entry) => entry.platformId !== record.platformId
  );

  next.push(record);
  writePlayerPlatformLinks(next);
  ensurePlatformSyncSnapshot(record.platformId);
  refreshPlatformSync(record.platformId);
}

export function canUnlinkPlayerPlatform(platformId: PlayerLinkPlatform): boolean {
  return platformId === 'steam';
}

export function unlinkPlayerPlatform(platformId: PlayerLinkPlatform): boolean {
  if (!canUnlinkPlayerPlatform(platformId)) {
    return false;
  }

  const next = readPlayerPlatformLinks().filter((entry) => entry.platformId !== platformId);
  writePlayerPlatformLinks(next);
  removePlatformSyncSnapshot(platformId);
  return true;
}

export function togglePlayerPlatform(platformId: PlayerLinkPlatform): boolean {
  if (isPlayerPlatformLinked(platformId)) {
    return unlinkPlayerPlatform(platformId) ? false : true;
  }

  linkPlayerPlatform(platformId);
  return true;
}

function subscribe(onStoreChange: () => void): () => void {
  function handleChange(): void {
    invalidateCache();
    onStoreChange();
  }

  window.addEventListener('nami-player-platform-links-changed', handleChange);

  return () => {
    window.removeEventListener('nami-player-platform-links-changed', handleChange);
  };
}

export function useLinkedPlayerPlatforms(): PlayerLinkPlatform[] {
  return useSyncExternalStore(subscribe, readLinkedPlayerPlatforms, () => []);
}

export function usePlayerPlatformLinks(): VerifiedPlatformLinkRecord[] {
  return useSyncExternalStore(subscribe, readPlayerPlatformLinks, () => []);
}