const DB_NAME = 'nami-channel-media';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const MANIFEST_KEY = '__channel-media-manifest__';
const MANIFEST_LS_KEY = 'nami.channel-media.manifest';

export const CHANNEL_MEDIA_HYDRATED_EVENT = 'nami-channel-media-hydrated';

const memoryUrls = new Map<string, string>();
const memoryBlobKeys = new Set<string>();
const persistentDiskCache = new Map<string, string | Blob>();
const pendingHydrationKeys = new Set<string>();

let hydrationFlushPromise: Promise<void> | null = null;
let bootstrapPromise: Promise<void> | null = null;
let persistenceVersion = 0;

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function dispatchPersistenceHydrated(): void {
  persistenceVersion += 1;

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(CHANNEL_MEDIA_HYDRATED_EVENT));
  window.dispatchEvent(new CustomEvent('nami-channel-cover-changed'));
  window.dispatchEvent(new CustomEvent('nami-channel-owner-media-changed'));
}

function revokeMemoryUrl(key: string): void {
  if (!memoryBlobKeys.has(key)) {
    return;
  }

  const current = memoryUrls.get(key);

  if (current?.startsWith('blob:')) {
    URL.revokeObjectURL(current);
  }

  memoryBlobKeys.delete(key);
  memoryUrls.delete(key);
}

function rememberUrl(key: string, url: string, fromBlob: boolean): void {
  revokeMemoryUrl(key);
  memoryUrls.set(key, url);

  if (fromBlob) {
    memoryBlobKeys.add(key);
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
    request.onerror = () => reject(request.error ?? new Error('Could not open channel media storage.'));
  });
}

async function idbGetFromDatabase(key: string): Promise<string | Blob | null> {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(key);

    request.onsuccess = () => {
      database.close();
      const value = request.result;

      if (typeof value === 'string' || value instanceof Blob) {
        resolve(value);
        return;
      }

      resolve(null);
    };

    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error('Could not read channel media.'));
    };
  });
}

async function idbGet(key: string): Promise<string | Blob | null> {
  try {
    const stored = await idbGetFromDatabase(key);

    if (stored) {
      persistentDiskCache.set(key, stored);
      return stored;
    }
  } catch {
    // Fall back to the in-memory disk cache below.
  }

  return persistentDiskCache.get(key) ?? null;
}

function sanitizeManifestKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) {
    return [];
  }

  return keys.filter(
    (entry): entry is string =>
      typeof entry === 'string' && entry !== MANIFEST_KEY && entry.trim() !== '',
  );
}

function readManifestKeysFromLocalStorage(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(MANIFEST_LS_KEY);

    if (!stored) {
      return [];
    }

    return sanitizeManifestKeys(JSON.parse(stored));
  } catch {
    return [];
  }
}

function writeManifestKeysToLocalStorage(keys: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(MANIFEST_LS_KEY, JSON.stringify(keys));
  } catch {
    // Manifest is tiny; ignore quota errors.
  }
}

async function readManifestKeys(): Promise<string[]> {
  const localManifest = readManifestKeysFromLocalStorage();
  const stored = await idbGet(MANIFEST_KEY);

  if (typeof stored !== 'string' || stored.trim() === '') {
    return localManifest;
  }

  try {
    const indexedManifest = sanitizeManifestKeys(JSON.parse(stored));
    return [...new Set([...localManifest, ...indexedManifest])];
  } catch {
    return localManifest;
  }
}

async function writeManifestKeys(keys: string[]): Promise<void> {
  const uniqueKeys = [...new Set(keys.filter((entry) => entry !== MANIFEST_KEY))];
  writeManifestKeysToLocalStorage(uniqueKeys);
  await idbPut(MANIFEST_KEY, JSON.stringify(uniqueKeys));
}

async function rememberManifestKey(key: string): Promise<void> {
  if (key === MANIFEST_KEY) {
    return;
  }

  const manifest = await readManifestKeys();

  if (manifest.includes(key)) {
    return;
  }

  await writeManifestKeys([...manifest, key]);
}

async function forgetManifestKey(key: string): Promise<void> {
  const manifest = await readManifestKeys();
  await writeManifestKeys(manifest.filter((entry) => entry !== key));
}

async function idbListKeys(): Promise<string[]> {
  if (!isIndexedDbAvailable()) {
    return [];
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    if (typeof store.getAllKeys === 'function') {
      const request = store.getAllKeys();

      request.onsuccess = () => {
        database.close();
        resolve(
          request.result.filter((entry): entry is string => typeof entry === 'string'),
        );
      };

      request.onerror = () => {
        database.close();
        reject(request.error ?? new Error('Could not list channel media keys.'));
      };

      return;
    }

    const keys: string[] = [];
    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;

      if (!cursor) {
        database.close();
        resolve(keys);
        return;
      }

      if (typeof cursor.key === 'string') {
        keys.push(cursor.key);
      }

      cursor.continue();
    };

    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error('Could not list channel media keys.'));
    };
  });
}

async function idbPut(key: string, value: string | Blob): Promise<void> {
  persistentDiskCache.set(key, value);

  if (!isIndexedDbAvailable()) {
    return;
  }

  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const request = transaction.objectStore(STORE_NAME).put(value, key);

    request.onsuccess = () => {
      database.close();
      resolve();
    };

    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error('Could not save channel media.'));
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Could not save channel media.'));
    };
  });
}

async function idbDelete(key: string): Promise<void> {
  persistentDiskCache.delete(key);

  if (!isIndexedDbAvailable()) {
    return;
  }

  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const request = transaction.objectStore(STORE_NAME).delete(key);

    request.onsuccess = () => {
      database.close();
      resolve();
    };

    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error('Could not delete channel media.'));
    };
  });
}

function cacheValue(key: string, value: string | Blob): void {
  if (typeof value === 'string') {
    rememberUrl(key, value, false);
    return;
  }

  rememberUrl(key, URL.createObjectURL(value), true);
}

async function hydrateValue(key: string, value: string | Blob): Promise<void> {
  cacheValue(key, value);
}

function readLegacyLocalStorageValue(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(key);

    if (!stored || stored.trim() === '') {
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

function listLegacyLocalStorageKeys(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const keys: string[] = [];

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith('nami.channel.')) {
        keys.push(key);
      }
    }
  } catch {
    return [];
  }

  return keys;
}

function removeLegacyLocalStorageValue(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function readChannelMediaUrl(key: string): string | null {
  return memoryUrls.get(key) ?? null;
}

export function readChannelMediaPersistenceVersion(): number {
  return persistenceVersion;
}

export async function saveChannelMediaValue(key: string, value: string | Blob): Promise<void> {
  cacheValue(key, value);
  await idbPut(key, value);
  await rememberManifestKey(key);
  removeLegacyLocalStorageValue(key);
}

export async function clearChannelMediaValue(key: string): Promise<void> {
  revokeMemoryUrl(key);
  await idbDelete(key);
  await forgetManifestKey(key);
  removeLegacyLocalStorageValue(key);
}

export async function migrateLegacyLocalStorageMedia(key: string): Promise<void> {
  const legacy = readLegacyLocalStorageValue(key);

  if (!legacy) {
    return;
  }

  await saveChannelMediaValue(key, legacy);
}

export async function hydrateChannelMediaKeys(keys: string[]): Promise<void> {
  for (const key of keys) {
    if (memoryUrls.has(key)) {
      continue;
    }

    const legacy = readLegacyLocalStorageValue(key);

    if (legacy) {
      await saveChannelMediaValue(key, legacy);
      continue;
    }

    const stored = await idbGet(key);

    if (stored) {
      await hydrateValue(key, stored);
    }
  }
}

async function flushPendingHydration(notify: boolean): Promise<void> {
  let loadedAny = false;

  while (pendingHydrationKeys.size > 0) {
    const keys = [...pendingHydrationKeys];
    pendingHydrationKeys.clear();

    const missing = keys.filter((key) => !memoryUrls.has(key));

    if (missing.length === 0) {
      continue;
    }

    await hydrateChannelMediaKeys(missing);
    loadedAny = true;
  }

  if (notify && loadedAny) {
    dispatchPersistenceHydrated();
  }
}

function scheduleKeyHydration(key: string, notify: boolean): Promise<void> {
  if (memoryUrls.has(key)) {
    return Promise.resolve();
  }

  pendingHydrationKeys.add(key);

  if (!hydrationFlushPromise) {
    hydrationFlushPromise = flushPendingHydration(notify).finally(() => {
      hydrationFlushPromise = null;
    });
  }

  return hydrationFlushPromise;
}

export async function ensureChannelMediaHydrated(keys: string[]): Promise<void> {
  const missing = keys.filter((key) => !memoryUrls.has(key));

  if (missing.length === 0) {
    return;
  }

  for (const key of missing) {
    pendingHydrationKeys.add(key);
  }

  if (!hydrationFlushPromise) {
    hydrationFlushPromise = flushPendingHydration(true).finally(() => {
      hydrationFlushPromise = null;
    });
  }

  await hydrationFlushPromise;
}

export function ensureChannelMediaHydratedForKey(key: string): Promise<void> {
  return scheduleKeyHydration(key, true);
}

export async function bootstrapChannelMediaPersistence(): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const legacyKeys = listLegacyLocalStorageKeys();

    for (const key of legacyKeys) {
      await migrateLegacyLocalStorageMedia(key);
    }

    const [manifestKeys, indexedKeys] = await Promise.all([readManifestKeys(), idbListKeys()]);
    const keysToHydrate = [...new Set([...legacyKeys, ...manifestKeys, ...indexedKeys])];

    if (keysToHydrate.length > 0) {
      await hydrateChannelMediaKeys(keysToHydrate);
      dispatchPersistenceHydrated();
    }
  })().finally(() => {
    bootstrapPromise = null;
  });

  return bootstrapPromise;
}

export function resetChannelMediaPersistenceForTests(): void {
  for (const key of [...memoryBlobKeys]) {
    revokeMemoryUrl(key);
  }

  memoryUrls.clear();
  memoryBlobKeys.clear();
  pendingHydrationKeys.clear();
  hydrationFlushPromise = null;
  bootstrapPromise = null;
  persistenceVersion = 0;
}

export function resetChannelMediaDiskForTests(): void {
  persistentDiskCache.clear();

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(MANIFEST_LS_KEY);
    } catch {
      // ignore
    }
  }
}