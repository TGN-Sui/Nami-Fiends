import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  estimateLocalStorageBytes,
  isQuotaExceededError,
  pruneLocalStorageForQuota,
  safeLocalStorageSetItem,
} from './local-storage-safe.js';

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

describe('local-storage-safe', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects quota exceeded errors', () => {
    const error = new DOMException('quota', 'QuotaExceededError');
    expect(isQuotaExceededError(error)).toBe(true);
  });

  it('prunes chat caches but keeps member session keys', () => {
    window.localStorage.setItem('nami.user.channel-messages', 'x'.repeat(100_000));
    window.localStorage.setItem('nami.member.session', '{"email":"a@b.com"}');

    const removed = pruneLocalStorageForQuota(10_000);

    expect(removed).toContain('nami.user.channel-messages');
    expect(window.localStorage.getItem('nami.member.session')).not.toBeNull();
  });

  it('writes protected values after pruning large caches', () => {
    window.localStorage.setItem('nami.user.global-chat-messages', 'y'.repeat(120_000));

    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    let attempts = 0;

    window.localStorage.setItem = (key: string, value: string) => {
      attempts += 1;

      if (attempts === 1 && key === 'nami.member.session') {
        throw new DOMException('quota', 'QuotaExceededError');
      }

      originalSetItem(key, value);
    };

    const saved = safeLocalStorageSetItem('nami.member.session', '{"email":"owner@example.com"}');

    expect(saved).toBe(true);
    expect(window.localStorage.getItem('nami.member.session')).toContain('owner@example.com');
    expect(window.localStorage.getItem('nami.user.global-chat-messages')).toBeNull();
  });

  it('estimates local storage footprint', () => {
    window.localStorage.setItem('nami.member.session', 'abc');

    expect(estimateLocalStorageBytes()).toBeGreaterThan(0);
  });
});