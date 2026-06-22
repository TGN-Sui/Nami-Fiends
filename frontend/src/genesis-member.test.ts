import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';

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

vi.mock('./protocol-owner-resolve.js', () => ({
  readResolvedProtocolOwner: () => OFFICIAL_OWNER,
}));

vi.mock('./app-config.js', () => ({
  readAppConfig: () => ({
    testLaunch: true,
    devFixtures: false,
  }),
  shouldUseDevFixtures: () => false,
  shouldUseFunctionalMockCatalog: () => true,
  shouldUseDemoOwnerFallback: () => false,
  isTestLaunchMode: () => true,
}));

vi.mock('./protocol-env.js', () => ({
  readOfficialOwner: () => OFFICIAL_OWNER,
  readDemoOwner: () => null,
}));

vi.mock('./zklogin.js', () => ({
  getZkLoginSession: () => ({ address: OFFICIAL_OWNER }),
}));

describe('genesis-member', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createLocalStorageMock() });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('marks the official owner as Nami Boss with genesis npc fields', async () => {
    window.localStorage.setItem(
      'nami.member.session',
      JSON.stringify({
        displayName: 'Robbie',
        email: 'robbier640@gmail.com',
        flavorBadgeId: 'Hearth Basic',
      }),
    );

    const { applyGenesisSelfOverrides } = await import('./genesis-member.js');

    const member = applyGenesisSelfOverrides({
      id: 'm1',
      surfaceType: 'member',
      name: 'Traveler',
      avatarSeed: 'NA',
      signal: 'Green',
      tier: 'Elite',
      badge: 'Unset',
    });

    expect(member.name).toBe('Robbie');
    expect(member.tier).toBe('NPC');
    expect(member.badge).toBe('Hearth Basic');
    expect(member.isNamiBoss).toBe(true);
    expect(member.isNamiTeam).toBeUndefined();
  });

  it('purges demo chat stores once on test launch boot', async () => {
    window.localStorage.setItem('nami.user.message-threads', JSON.stringify([{ memberId: 'm2' }]));

    const { ensureGenesisLocalDataOnTestLaunch } = await import('./genesis-member.js');

    ensureGenesisLocalDataOnTestLaunch();
    expect(window.localStorage.getItem('nami.user.message-threads')).toBeNull();

    window.localStorage.setItem('nami.user.message-threads', JSON.stringify([{ memberId: 'm3' }]));
    ensureGenesisLocalDataOnTestLaunch();
    expect(window.localStorage.getItem('nami.user.message-threads')).not.toBeNull();
  });
});