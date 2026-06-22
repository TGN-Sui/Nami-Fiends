import type { OwnerAssetMap } from './nami-owner-assets-store.js';

export const OWNER_ASSETS_LEGACY_KEY = 'nami.owner.platform-assets';
const DB_NAME = 'nami-owner-assets';
const DB_VERSION = 1;
const STORE_NAME = 'slots';

let memoryAssets: OwnerAssetMap = {};
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function isPersistedOwnerAssetValue(value: string): boolean {
  return value.startsWith('data:image/') || value.startsWith('channel-media://');
}

function sanitizeAssetMap(value: unknown): OwnerAssetMap {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === 'string' &&
        typeof entry[1] === 'string' &&
        isPersistedOwnerAssetValue(entry[1])
    )
  );
}

function readLegacyLocalStorageAssets(): OwnerAssetMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(OWNER_ASSETS_LEGACY_KEY);

    if (!stored) {
      return {};
    }

    return sanitizeAssetMap(JSON.parse(stored) as unknown);
  } catch {
    return {};
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open artwork storage.'));
  });
}

async function readIndexedDbAssets(): Promise<OwnerAssetMap> {
  if (!isIndexedDbAvailable()) {
    return {};
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();
    const assets: OwnerAssetMap = {};

    request.onsuccess = () => {
      const keys = request.result;

      if (keys.length === 0) {
        database.close();
        resolve({});
        return;
      }

      let pending = keys.length;

      keys.forEach((key) => {
        if (typeof key !== 'string') {
          pending -= 1;

          if (pending === 0) {
            database.close();
            resolve(assets);
          }

          return;
        }

        const valueRequest = store.get(key);

        valueRequest.onsuccess = () => {
          const value = valueRequest.result;

          if (typeof value === 'string' && isPersistedOwnerAssetValue(value)) {
            assets[key] = value;
          }

          pending -= 1;

          if (pending === 0) {
            database.close();
            resolve(assets);
          }
        };

        valueRequest.onerror = () => {
          pending -= 1;

          if (pending === 0) {
            database.close();
            resolve(assets);
          }
        };
      });
    };

    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error('Could not read artwork storage.'));
    };
  });
}

async function writeIndexedDbAssets(assets: OwnerAssetMap): Promise<void> {
  if (!isIndexedDbAvailable()) {
    return;
  }

  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      const entries = Object.entries(assets);

      if (entries.length === 0) {
        database.close();
        resolve();
        return;
      }

      let pending = entries.length;

      entries.forEach(([slotId, dataUrl]) => {
        const putRequest = store.put(dataUrl, slotId);

        putRequest.onsuccess = () => {
          pending -= 1;

          if (pending === 0) {
            database.close();
            resolve();
          }
        };

        putRequest.onerror = () => {
          database.close();
          reject(putRequest.error ?? new Error('Could not save artwork.'));
        };
      });
    };

    clearRequest.onerror = () => {
      database.close();
      reject(clearRequest.error ?? new Error('Could not save artwork.'));
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Could not save artwork.'));
    };
  });
}

function writeLegacyLocalStorageAssets(assets: OwnerAssetMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (Object.keys(assets).length === 0) {
    window.localStorage.removeItem(OWNER_ASSETS_LEGACY_KEY);
    return;
  }

  window.localStorage.setItem(OWNER_ASSETS_LEGACY_KEY, JSON.stringify(assets));
}

async function hydrateOwnerAssets(): Promise<void> {
  if (hydrated) {
    return;
  }

  try {
    const indexedAssets = await readIndexedDbAssets();

    if (Object.keys(indexedAssets).length > 0) {
      memoryAssets = indexedAssets;
      hydrated = true;
      return;
    }

    const legacyAssets = readLegacyLocalStorageAssets();

    if (Object.keys(legacyAssets).length > 0) {
      memoryAssets = legacyAssets;

      if (isIndexedDbAvailable()) {
        await writeIndexedDbAssets(legacyAssets);
        window.localStorage.removeItem(OWNER_ASSETS_LEGACY_KEY);
      }

      hydrated = true;
      return;
    }
  } catch {
    memoryAssets = readLegacyLocalStorageAssets();
  }

  hydrated = true;
}

export function ensureOwnerAssetsHydrated(): Promise<void> {
  if (hydrated) {
    return Promise.resolve();
  }

  if (!hydratePromise) {
    hydratePromise = hydrateOwnerAssets().finally(() => {
      hydratePromise = null;
    });
  }

  return hydratePromise;
}

export function readPersistedOwnerAssets(): OwnerAssetMap {
  if (hydrated) {
    return { ...memoryAssets };
  }

  const legacyAssets = readLegacyLocalStorageAssets();

  if (Object.keys(legacyAssets).length > 0) {
    memoryAssets = legacyAssets;
    return { ...legacyAssets };
  }

  return { ...memoryAssets };
}

export async function persistOwnerAssets(assets: OwnerAssetMap): Promise<void> {
  memoryAssets = { ...assets };
  hydrated = true;

  if (isIndexedDbAvailable()) {
    await writeIndexedDbAssets(assets);
    window.localStorage.removeItem(OWNER_ASSETS_LEGACY_KEY);
    return;
  }

  writeLegacyLocalStorageAssets(assets);
}

export function resetOwnerAssetsPersistenceForTests(): void {
  memoryAssets = {};
  hydrated = false;
  hydratePromise = null;
}