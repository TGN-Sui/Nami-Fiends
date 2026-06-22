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

import { getSelfMember } from './member-access.js';
import { canPublishMemberFeed } from './member-feed-access.js';
import { getConfigurableEmbeddedFeedSurfaces } from './surface-preferences.js';

describe('member-feed-access', () => {
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
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('lets the official owner publish a member feed despite NPC passport tier', () => {
    const self = getSelfMember();

    expect(self.tier).toBe('NPC');
    expect(canPublishMemberFeed(self)).toBe(true);
  });

  it('keeps member feed configurable while viewing as a game channel owner', () => {
    const self = getSelfMember();

    expect(getConfigurableEmbeddedFeedSurfaces('channel-owner', self)).toEqual(['member', 'game']);
  });
});