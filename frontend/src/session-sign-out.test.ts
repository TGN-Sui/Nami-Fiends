import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('session-sign-out', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.localStorage.setItem('nami.member.streaming-online', JSON.stringify({ m1: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('turns off streaming when the local session is cleared', async () => {
    const { clearLocalNamiSession } = await import('./session-sign-out.js');
    const { readSelfStreamingOnline } = await import('./member-online-store.js');

    expect(readSelfStreamingOnline()).toBe(true);

    clearLocalNamiSession();

    expect(readSelfStreamingOnline()).toBe(false);
  });
});