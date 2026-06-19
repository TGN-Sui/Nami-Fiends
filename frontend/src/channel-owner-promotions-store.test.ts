import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readChannelOwnerPromotionsState,
  resetChannelOwnerPromotionsStateForTests,
} from './channel-owner-promotions-store.js';

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

describe('channel-owner-promotions-store', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetChannelOwnerPromotionsStateForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetChannelOwnerPromotionsStateForTests();
  });

  it('returns a stable cached snapshot for useSyncExternalStore', () => {
    const firstRead = readChannelOwnerPromotionsState();
    const secondRead = readChannelOwnerPromotionsState();

    expect(secondRead).toBe(firstRead);
  });
});