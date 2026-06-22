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

describe('events-store delete persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      sessionStorage: createLocalStorageMock(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('excludes tombstoned official catalog events from the hub list', async () => {
    window.localStorage.setItem('nami.deleted-event-ids', JSON.stringify(['nami-launch-festival']));

    const { getOfficialHubEvents } = await import('./events-store.js');
    const events = getOfficialHubEvents();

    expect(events.some((event) => event.id === 'nami-launch-festival')).toBe(false);
  });
});