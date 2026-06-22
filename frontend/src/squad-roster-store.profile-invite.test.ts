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
    isMemberVerified: () => true,
  };
});

describe('squad profile invite visibility', () => {
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

  it('shows squad invite when the signed-in member leads a squad', async () => {
    window.localStorage.setItem(
      'nami.squad.created-records',
      JSON.stringify([
        {
          id: 'squad-created-test',
          name: 'Raid Team',
          memberIds: ['m1'],
          maxSlots: 3,
        },
      ])
    );

    const { canInviteMemberToAnySquad } = await import('./squad-roster-store.js');
    const { members } = await import('./uiMockData.js');

    const target = members.find((member) => member.id === 'm2');

    expect(target).toBeDefined();
    expect(canInviteMemberToAnySquad(target!)).toBe(true);
  });
});