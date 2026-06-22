import { describe, expect, it, vi } from 'vitest';

import { canFoundNewGuild, canLeadSquadInvites } from './guild-space-access.js';
import type { NamiMember } from './domain/types.js';

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
});