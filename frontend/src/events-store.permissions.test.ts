import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';

vi.mock('./protocol-owner-resolve.js', () => ({
  readResolvedProtocolOwner: () => OFFICIAL_OWNER,
}));

vi.mock('./nami-capabilities.js', async () => {
  const actual = await vi.importActual<typeof import('./nami-capabilities.js')>('./nami-capabilities.js');

  return {
    ...actual,
    isOfficialOwner: (owner: string | null) => owner?.toLowerCase() === OFFICIAL_OWNER.toLowerCase(),
  };
});

vi.mock('./app-config.js', () => ({
  readAppConfig: () => ({ testLaunch: true, devFixtures: false }),
  shouldUseDevFixtures: () => false,
  shouldAutoSeedLocalData: () => false,
  shouldUseFunctionalMockCatalog: () => true,
  shouldUseDemoOwnerFallback: () => false,
  isTestLaunchMode: () => true,
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

describe('events-store official permissions', () => {
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

  it('grants official event edit to the connected official owner wallet', async () => {
    const { canEditOfficialEvent } = await import('./events-store.js');

    expect(
      canEditOfficialEvent({
        id: 'm1',
        surfaceType: 'member',
        name: 'Owner',
        avatarSeed: 'OW',
        signal: 'Green',
        tier: 'NPC',
        badge: 'Unset',
      })
    ).toBe(true);
  });

  it('denies official event edit to regular genesis members', async () => {
    vi.resetModules();
    vi.doMock('./protocol-owner-resolve.js', () => ({
      readResolvedProtocolOwner: () => null,
    }));

    const { canEditOfficialEvent } = await import('./events-store.js');

    expect(
      canEditOfficialEvent({
        id: 'm1',
        surfaceType: 'member',
        name: 'Traveler',
        avatarSeed: 'TR',
        signal: 'Green',
        tier: 'NPC',
        badge: 'Unset',
      })
    ).toBe(false);
  });
});