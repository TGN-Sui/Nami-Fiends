import { describe, expect, it, vi } from 'vitest';

import { canFoundNewGuild, canLeadSquadInvites } from './guild-space-access.js';
import type { NamiMember } from './domain/types.js';

vi.mock('./channel-owner-access.js', () => ({
  qualifiesForOwnerSoloGuild: vi.fn(() => false),
}));

vi.mock('./guild-creation-store.js', () => ({
  channelOwnerOfficialGuildCount: vi.fn(() => 0),
}));

vi.mock('./member-access.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./member-access.js')>();

  return {
    ...actual,
    isMemberVerified: () => true,
    memberFeatureTier: () => 'Elite',
    SELF_MEMBER_ID: 'm1',
  };
});

const officialOwnerMember: NamiMember = {
  id: 'm1',
  surfaceType: 'member',
  name: 'Owner',
  avatarSeed: 'OW',
  signal: 'Green',
  tier: 'NPC',
  badge: 'Boss',
  isNamiBoss: true,
};

describe('guild-space-access', () => {
  it('allows official owner NPC passport to found guilds and lead squads', () => {
    expect(canFoundNewGuild(officialOwnerMember)).toBe(true);
    expect(canLeadSquadInvites(officialOwnerMember)).toBe(true);
  });

  it('allows game channel owners to found a solo official guild without membership tier', async () => {
    const { qualifiesForOwnerSoloGuild } = await import('./channel-owner-access.js');
    const { channelOwnerOfficialGuildCount } = await import('./guild-creation-store.js');

    vi.mocked(qualifiesForOwnerSoloGuild).mockReturnValue(true);
    vi.mocked(channelOwnerOfficialGuildCount).mockReturnValue(0);

    const npcOwner: NamiMember = {
      ...officialOwnerMember,
      tier: 'NPC',
    };

    expect(canFoundNewGuild(npcOwner)).toBe(true);

    vi.mocked(channelOwnerOfficialGuildCount).mockReturnValue(1);
    expect(canFoundNewGuild(npcOwner)).toBe(false);

    vi.mocked(qualifiesForOwnerSoloGuild).mockReturnValue(false);
  });
});