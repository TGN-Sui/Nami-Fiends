import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMemberCosmeticEquips = vi.fn(async () => ({
  equips: {},
  updatedAtMs: 0,
}));

vi.mock('./member-cosmetic-equips-api.js', () => ({
  isMemberCosmeticEquipsApiAvailable: () => true,
  fetchMemberCosmeticEquips: (...args: unknown[]) => fetchMemberCosmeticEquips(...args),
}));

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

describe('member-cosmetic-equips-sync', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMemberCosmeticEquips.mockReset();
    fetchMemberCosmeticEquips.mockResolvedValue({
      equips: { m2: 'overlay-wave-frame' },
      updatedAtMs: 5000,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('bumps sync signal when another tab updates local equip storage', async () => {
    const localStorage = createLocalStorageMock();
    const listeners = new Map<string, Set<EventListener>>();
    const dispatchEvent = vi.fn((event: Event) => {
      const handlers = listeners.get(event.type);

      handlers?.forEach((handler) => handler(event));
    });

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('document', {
      hidden: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent,
      addEventListener: (type: string, handler: EventListener) => {
        const bucket = listeners.get(type) ?? new Set<EventListener>();
        bucket.add(handler);
        listeners.set(type, bucket);
      },
      removeEventListener: vi.fn(),
    });

    const store = await import('./member-cosmetic-equips-store.js');
    const sync = await import('./member-cosmetic-equips-sync.js');

    store.resetMemberCosmeticEquipsForTests();
    sync.startMemberCosmeticEquipsAppSync();

    const before = sync.readMemberCosmeticEquipsSyncVersion();
    localStorage.setItem(
      store.MEMBER_COSMETIC_EQUIPS_STORAGE_KEY,
      JSON.stringify({ equips: { m3: 'overlay-pulse-ring' }, updatedAtMs: 9000 })
    );

    const storageHandlers = listeners.get('storage');

    storageHandlers?.forEach((handler) =>
      handler({
        key: store.MEMBER_COSMETIC_EQUIPS_STORAGE_KEY,
        newValue: localStorage.getItem(store.MEMBER_COSMETIC_EQUIPS_STORAGE_KEY),
      } as StorageEvent)
    );

    expect(sync.readMemberCosmeticEquipsSyncVersion()).toBeGreaterThan(before);
    expect(store.readEquippedChatOverlayIdForMember('m3')).toBe('overlay-pulse-ring');
  });

  it('refreshes equips from the server when the tab becomes visible', async () => {
    const localStorage = createLocalStorageMock();
    const visibilityListeners = new Set<() => void>();
    const documentState = { hidden: true };

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('document', {
      get hidden() {
        return documentState.hidden;
      },
      addEventListener: (_type: string, handler: () => void) => {
        visibilityListeners.add(handler);
      },
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const store = await import('./member-cosmetic-equips-store.js');
    const sync = await import('./member-cosmetic-equips-sync.js');

    store.resetMemberCosmeticEquipsForTests();
    sync.initMemberCosmeticEquipsSyncListeners();

    expect(visibilityListeners.size).toBeGreaterThan(0);

    documentState.hidden = false;
    visibilityListeners.forEach((handler) => handler());

    await vi.waitFor(() => {
      expect(fetchMemberCosmeticEquips).toHaveBeenCalled();
    });

    expect(store.readEquippedChatOverlayIdForMember('m2')).toBe('overlay-wave-frame');
  });
});