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

describe('player-link-store', () => {
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

  it('only allows Steam to unlink', async () => {
    const {
      canUnlinkPlayerPlatform,
      linkPlayerPlatform,
      unlinkPlayerPlatform,
      isPlayerPlatformLinked,
    } = await import('./player-link-store.js');

    expect(canUnlinkPlayerPlatform('steam')).toBe(true);
    expect(canUnlinkPlayerPlatform('epic')).toBe(false);

    linkPlayerPlatform('epic');
    linkPlayerPlatform('steam');

    expect(isPlayerPlatformLinked('epic')).toBe(true);
    expect(unlinkPlayerPlatform('epic')).toBe(false);
    expect(isPlayerPlatformLinked('epic')).toBe(true);

    expect(unlinkPlayerPlatform('steam')).toBe(true);
    expect(isPlayerPlatformLinked('steam')).toBe(false);
  });

  it('returns a stable linked-platform snapshot for external-store reads', async () => {
    const { readLinkedPlayerPlatforms } = await import('./player-link-store.js');

    const first = readLinkedPlayerPlatforms();
    const second = readLinkedPlayerPlatforms();

    expect(first).toBe(second);
  });
});