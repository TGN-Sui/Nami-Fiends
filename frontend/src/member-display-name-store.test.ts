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

describe('member-display-name-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('rejects display names that are too short', async () => {
    const { checkDisplayNameAvailability } = await import('./member-display-name-store.js');

    expect(checkDisplayNameAvailability('a', 'm1').available).toBe(false);
  });

  it('accepts the current passport display name', async () => {
    const { checkDisplayNameAvailability } = await import('./member-display-name-store.js');

    expect(checkDisplayNameAvailability('Robbos', 'm1').available).toBe(true);
  });
});