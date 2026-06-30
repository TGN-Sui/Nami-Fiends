import { useSyncExternalStore } from 'react';

import {
  OFFICIAL_GIFT_CATALOG,
  type GiftCatalogEntry,
} from './gift-catalog.js';
import { fetchGiftCatalog, isGiftApiAvailable } from './gift-payments-api.js';

const listeners = new Set<() => void>();
let cachedCatalog: GiftCatalogEntry[] = OFFICIAL_GIFT_CATALOG.map((entry) => ({
  ...entry,
  iconUrl: entry.iconUrl ?? null,
  enabled: entry.enabled ?? true,
}));
let hydratePromise: Promise<void> | null = null;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): GiftCatalogEntry[] {
  return cachedCatalog;
}

export function useGiftCatalog(): GiftCatalogEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function readGiftCatalogSnapshot(): GiftCatalogEntry[] {
  return cachedCatalog;
}

export function setGiftCatalogSnapshot(entries: GiftCatalogEntry[]): void {
  cachedCatalog = entries.length > 0 ? entries : cachedCatalog;
  emit();
}

export function resolveGiftCatalogEntry(giftId: string): GiftCatalogEntry | undefined {
  return cachedCatalog.find((entry) => entry.id === giftId);
}

export async function hydrateGiftCatalog(): Promise<void> {
  if (!isGiftApiAvailable()) {
    return;
  }

  if (hydratePromise) {
    await hydratePromise;
    return;
  }

  hydratePromise = fetchGiftCatalog()
    .then((config) => {
      if (config.catalog.length > 0) {
        cachedCatalog = config.catalog;
        emit();
      }
    })
    .catch(() => {
      // Keep local defaults when the indexer is offline.
    })
    .finally(() => {
      hydratePromise = null;
    });

  await hydratePromise;
}

export function resetGiftCatalogStoreForTests(): void {
  cachedCatalog = OFFICIAL_GIFT_CATALOG.map((entry) => ({
    ...entry,
    iconUrl: entry.iconUrl ?? null,
    enabled: entry.enabled ?? true,
  }));
  hydratePromise = null;
  emit();
}