import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readLinkedPlatformSyncSnapshots,
  resetPlatformSyncStoreForTests,
} from './player-platform-sync-store.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('player-platform-sync-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetPlatformSyncStoreForTests();
  });

  it('returns a stable cached snapshot for linked platform ids', () => {
    const firstRead = readLinkedPlatformSyncSnapshots(['steam', 'epic']);
    const secondRead = readLinkedPlatformSyncSnapshots(['steam', 'epic']);

    expect(secondRead).toBe(firstRead);
  });
});