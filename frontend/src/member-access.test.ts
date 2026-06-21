import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';

vi.mock('./protocol-owner-resolve.js', () => ({
  readResolvedProtocolOwner: () => OFFICIAL_OWNER,
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
  applyGenesisSelfOverrides: (member: { id: string; tier: string; isNamiBoss?: boolean }) => ({
    ...member,
    tier: 'NPC',
    isNamiBoss: true,
  }),
}));

vi.mock('./uiMockData.js', () => ({
  members: [
    {
      id: 'm1',
      surfaceType: 'member',
      name: 'Owner',
      signal: 'Green',
      tier: 'NPC',
      badge: 'Hearth Basic',
      avatarSeed: 'NA',
    },
  ],
}));

vi.mock('./membership-plans-store.js', () => ({
  applyMembershipTierToMember: (member: { tier: string }) => member,
  effectiveMemberTier: () => 'Elite',
}));

vi.mock('./official-membership-access.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./official-membership-access.js')>();

  return {
    ...actual,
    hasComplimentaryMembershipAccess: (owner: string | null) => owner === OFFICIAL_OWNER,
  };
});

describe('member-access owner feature gates', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
        clear: () => undefined,
        key: () => null,
        length: 0,
      },
    });
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('treats the official owner as verified with elite feature tier at genesis', async () => {
    const { getSelfMember, isMemberVerified, memberFeatureTier, memberHasEliteAccess } =
      await import('./member-access.js');

    const self = getSelfMember();

    expect(self.isNamiBoss).toBe(true);
    expect(self.tier).toBe('NPC');
    expect(isMemberVerified(self)).toBe(true);
    expect(memberFeatureTier(self)).toBe('Elite');
    expect(memberHasEliteAccess(self)).toBe(true);
  });
});