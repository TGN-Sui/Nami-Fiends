import { useSyncExternalStore } from 'react';

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

let cachedLinks: PlayerLinkPlatform[] | undefined;

function invalidateCache(): void {
  cachedLinks = undefined;
}

function emitChange(): void {
  invalidateCache();
  window.dispatchEvent(new CustomEvent('nami-player-platform-links-changed'));
}

export function readLinkedPlayerPlatforms(): PlayerLinkPlatform[] {
  if (cachedLinks) {
    return cachedLinks;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedLinks = [];
      return cachedLinks;
    }

    const parsed = JSON.parse(stored) as { linked?: unknown };

    if (!Array.isArray(parsed.linked)) {
      cachedLinks = [];
      return cachedLinks;
    }

    cachedLinks = parsed.linked.filter((entry): entry is PlayerLinkPlatform => {
      return typeof entry === 'string' && PLATFORM_IDS.has(entry);
    });

    return cachedLinks;
  } catch {
    cachedLinks = [];
    return cachedLinks;
  }
}

export function isPlayerPlatformLinked(platformId: PlayerLinkPlatform): boolean {
  return readLinkedPlayerPlatforms().includes(platformId);
}

export function linkPlayerPlatform(platformId: PlayerLinkPlatform): void {
  const next = new Set(readLinkedPlayerPlatforms());
  next.add(platformId);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      linked: [...next],
      updatedAtMs: Date.now(),
    }),
  );
  emitChange();
}

export function unlinkPlayerPlatform(platformId: PlayerLinkPlatform): void {
  const next = readLinkedPlayerPlatforms().filter((entry) => entry !== platformId);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      linked: next,
      updatedAtMs: Date.now(),
    }),
  );
  emitChange();
}

export function togglePlayerPlatform(platformId: PlayerLinkPlatform): boolean {
  if (isPlayerPlatformLinked(platformId)) {
    unlinkPlayerPlatform(platformId);
    return false;
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