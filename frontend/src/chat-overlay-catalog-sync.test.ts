import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hydrateChatOverlayRewardsFromServer = vi.fn(async () => false);

vi.mock('./chat-overlay-rewards-sync.js', () => ({
  hydrateChatOverlayRewardsFromServer: (...args: unknown[]) =>
    hydrateChatOverlayRewardsFromServer(...args),
}));

vi.mock('./chat-overlay-rewards-retry-queue.js', () => ({
  processChatOverlayCatalogSyncQueue: vi.fn(async () => false),
}));

vi.mock('./chat-overlay-rewards-api.js', () => ({
  isChatOverlayRewardsApiAvailable: () => true,
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

describe('chat-overlay-catalog-sync', () => {
  beforeEach(() => {
    vi.resetModules();
    hydrateChatOverlayRewardsFromServer.mockReset();
    hydrateChatOverlayRewardsFromServer.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('bumps sync signal when another tab updates local catalog storage', async () => {
    const localStorage = createLocalStorageMock();
    const listeners = new Map<string, Set<EventListener>>();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('document', {
      hidden: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: (type: string, handler: EventListener) => {
        const bucket = listeners.get(type) ?? new Set<EventListener>();
        bucket.add(handler);
        listeners.set(type, bucket);
      },
      removeEventListener: vi.fn(),
    });

    const store = await import('./official-chat-overlay-rewards-store.js');
    const sync = await import('./chat-overlay-catalog-sync.js');

    store.resetOfficialChatOverlayRewardsForTests();
    sync.resetChatOverlayCatalogSyncForTests();
    sync.startChatOverlayCatalogAppSync();

    const before = sync.readChatOverlayCatalogSyncVersion();
    localStorage.setItem(
      store.OFFICIAL_CHAT_OVERLAY_REWARDS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'overlay-remote',
          name: 'Remote Glow',
          description: 'Synced reward',
          borderStyle: 'signal-glow',
          motion: 'static',
          accent: 'cyan',
          staticArtUrl: null,
          animatedArtUrl: null,
          artSliceInsets: { top: 56, right: 32, bottom: 24, left: 32 },
          displayWidths: { top: 28, right: 16, bottom: 12, left: 16 },
          condition: { type: 'verified' },
          enabled: true,
          updatedAtMs: 9000,
        },
      ])
    );

    const storageHandlers = listeners.get('storage');

    storageHandlers?.forEach((handler) =>
      handler({
        key: store.OFFICIAL_CHAT_OVERLAY_REWARDS_STORAGE_KEY,
        newValue: localStorage.getItem(store.OFFICIAL_CHAT_OVERLAY_REWARDS_STORAGE_KEY),
      } as StorageEvent)
    );

    expect(sync.readChatOverlayCatalogSyncVersion()).toBeGreaterThan(before);
    expect(store.readOfficialChatOverlayRewards()[0]?.id).toBe('overlay-remote');
  });

  it('refreshes catalog from the server when the tab becomes visible', async () => {
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

    const sync = await import('./chat-overlay-catalog-sync.js');

    sync.resetChatOverlayCatalogSyncForTests();
    sync.initChatOverlayCatalogSyncListeners();

    expect(visibilityListeners.size).toBeGreaterThan(0);

    documentState.hidden = false;
    visibilityListeners.forEach((handler) => handler());

    await vi.waitFor(() => {
      expect(hydrateChatOverlayRewardsFromServer).toHaveBeenCalled();
    });
  });
});