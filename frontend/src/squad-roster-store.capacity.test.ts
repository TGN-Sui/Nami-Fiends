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

vi.mock('./channel-owner-access.js', () => ({
  isGameChannelOwner: () => false,
}));

vi.mock('./nami-affiliations.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./nami-affiliations.js')>();

  return {
    ...actual,
    namiSquads: [],
  };
});

vi.mock('./member-access.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./member-access.js')>();

  return {
    ...actual,
    getSelfMember: () => ({
      id: 'm1',
      surfaceType: 'member',
      name: 'Owner',
      avatarSeed: 'OW',
      signal: 'Green',
      tier: 'NPC',
      badge: 'Boss',
      isNamiBoss: true,
    }),
    memberFeatureTier: () => 'Elite' as const,
  };
});

describe('squadCapacityDisplay', () => {
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

  it('shows roster fill against remaining invite slots for squad leaders', async () => {
    window.localStorage.setItem(
      'nami.squad.created-records',
      JSON.stringify([
        {
          id: 'squad-created-new',
          name: 'Raid Team',
          memberIds: ['m1'],
          maxSlots: 3,
        },
        {
          id: 'squad-created-other',
          name: 'Other Team',
          memberIds: ['m1', 'm2'],
          maxSlots: 3,
        },
      ])
    );

    const { squadCapacityDisplay } = await import('./squad-roster-store.js');

    const capacity = squadCapacityDisplay({
      id: 'squad-created-new',
      name: 'Raid Team',
      memberIds: ['m1'],
      maxSlots: 3,
    });

    expect(capacity).toEqual({ filled: 1, total: 3 });
  });
});