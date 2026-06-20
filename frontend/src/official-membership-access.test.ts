import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';
const MODERATOR = '0xmoderatorwallet';

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

vi.mock('./protocol-env.js', () => ({
  readOfficialOwner: () => OFFICIAL_OWNER,
  readDemoOwner: () => null,
}));

vi.mock('./zklogin.js', () => ({
  getZkLoginSession: () => null,
}));

vi.mock('./uiMockData.js', () => ({
  members: [
    {
      id: 'm1',
      surfaceType: 'member',
      name: 'Team Member',
      signal: 'Green',
      tier: 'Pro',
      isNamiTeam: true,
    },
    {
      id: 'm2',
      surfaceType: 'member',
      name: 'Regular',
      signal: 'Green',
      tier: 'Adventurer',
      isNamiTeam: false,
    },
  ],
}));

describe('official-membership-access', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createLocalStorageMock() });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('grants complimentary access to the official owner wallet', async () => {
    const { hasComplimentaryMembershipAccess } = await import('./official-membership-access.js');

    expect(hasComplimentaryMembershipAccess(OFFICIAL_OWNER)).toBe(true);
  });

  it('grants complimentary access to official moderators', async () => {
    window.localStorage.setItem('nami.admin.moderators', JSON.stringify([MODERATOR]));

    const { hasComplimentaryMembershipAccess } = await import('./official-membership-access.js');

    expect(hasComplimentaryMembershipAccess(MODERATOR)).toBe(true);
  });

  it('grants complimentary access to Nami team members', async () => {
    const { hasComplimentaryMembershipAccess } = await import('./official-membership-access.js');

    expect(hasComplimentaryMembershipAccess(null)).toBe(true);
  });

  it('maps complimentary members to Elite effective tier', async () => {
    const { effectiveMemberTier } = await import('./membership-plans-store.js');

    expect(effectiveMemberTier()).toBe('Elite');
  });

  it('blocks paid membership checkout for complimentary members', async () => {
    const { canPurchasePaidMembership } = await import('./membership-plans-store.js');

    expect(canPurchasePaidMembership()).toBe(false);
  });
});