import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';
const USER_CLAIM_STATUS_KEY = 'nami.user.claimStatus';

vi.mock('./protocol-owner-resolve.js', () => ({
  readResolvedProtocolOwner: () => null,
}));

vi.mock('./protocol-env.js', () => ({
  readOfficialOwner: () => OFFICIAL_OWNER,
  readDemoOwner: () => null,
}));

vi.mock('./app-config.js', () => ({
  readAppConfig: () => ({
    testLaunch: true,
    devFixtures: false,
    officialOwner: OFFICIAL_OWNER,
  }),
  shouldUseDevFixtures: () => false,
}));

vi.mock('./genesis-member.js', () => ({
  shouldUseGenesisSelfMember: () => true,
  applyGenesisSelfOverrides: (member: { id: string; tier: string }) => ({
    ...member,
    tier: 'NPC',
  }),
}));

vi.mock('./uiMockData.js', () => ({
  members: [
    {
      id: 'm1',
      surfaceType: 'member',
      name: 'Gamer',
      signal: 'Green',
      tier: 'NPC',
      badge: 'Hearth Basic',
      avatarSeed: 'NA',
    },
    {
      id: 'm2',
      surfaceType: 'member',
      name: 'Verified Pro',
      signal: 'Green',
      tier: 'Pro',
      badge: 'Hearth Basic',
      avatarSeed: 'NB',
    },
  ],
}));

vi.mock('./membership-plans-store.js', () => ({
  applyMembershipTierToMember: (member: { tier: string }) => member,
  effectiveMemberTier: () => 'NPC',
}));

vi.mock('./official-membership-access.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./official-membership-access.js')>();

  return {
    ...actual,
    hasComplimentaryMembershipAccess: () => false,
  };
});

describe('member-access passport badge book gate', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();

    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        clear: () => storage.clear(),
        key: () => null,
        length: 0,
      },
    });
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('locks badge book for self until passport claim is approved', async () => {
    const { canAccessBadgeBook, getSelfMember } = await import('./member-access.js');

    expect(canAccessBadgeBook(getSelfMember())).toBe(false);

    window.localStorage.setItem(
      USER_CLAIM_STATUS_KEY,
      JSON.stringify({
        claimId: 'claim-1',
        status: 'approved',
        nodename: 'fiendgamer',
        updatedAtMs: Date.now(),
      })
    );

    vi.resetModules();
    const refreshed = await import('./member-access.js');

    expect(refreshed.canAccessBadgeBook(refreshed.getSelfMember())).toBe(true);
  });

  it('still allows viewing other verified members badge books', async () => {
    const { members } = await import('./uiMockData.js');
    const { canAccessBadgeBook } = await import('./member-access.js');

    expect(canAccessBadgeBook(members[1]!)).toBe(true);
  });
});