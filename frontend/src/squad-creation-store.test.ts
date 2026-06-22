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

describe('squad-creation-store', () => {
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

  it('creates a squad led by the signed-in member', async () => {
    const { createMemberSquad, getCreatedSquadRecords } = await import('./squad-creation-store.js');

    const result = createMemberSquad('Raid Team');

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.squad.name).toBe('Raid Team');
      expect(result.squad.memberIds[0]).toBe('m1');
      expect(result.squad.maxSlots).toBe(3);
      expect(getCreatedSquadRecords()).toHaveLength(1);
    }
  });

  it('migrates legacy squads that stored maxSlots as squadSlots + 1', async () => {
    window.localStorage.setItem(
      'nami.squad.created-records',
      JSON.stringify([
        {
          id: 'squad-created-legacy',
          name: 'Legacy Squad',
          memberIds: ['m1'],
          maxSlots: 9,
        },
      ])
    );

    const { getCreatedSquadRecords } = await import('./squad-creation-store.js');

    expect(getCreatedSquadRecords()[0]?.maxSlots).toBe(3);
    expect(JSON.parse(window.localStorage.getItem('nami.squad.created-records')!)[0].maxSlots).toBe(3);
  });
});