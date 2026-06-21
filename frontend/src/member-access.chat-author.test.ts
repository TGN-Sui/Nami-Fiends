import { describe, expect, it } from 'vitest';

import { getChatPresenceMembers, resolveMessageAuthorMember } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

const selfMember: NamiMember = {
  id: 'm1',
  surfaceType: 'member',
  name: 'Robbos',
  avatarSeed: 'RB',
  signal: 'Green',
  tier: 'NPC',
  badge: 'Hearth Basic',
};

const shellSelfMember: NamiMember = {
  ...selfMember,
  name: 'Traveler',
};

const roster: NamiMember[] = [
  shellSelfMember,
  {
    id: 'm2',
    surfaceType: 'member',
    name: 'HarborMint',
    avatarSeed: 'HM',
    signal: 'Green',
    tier: 'Adventurer',
    badge: 'Community Mark',
  },
];

describe('chat author resolution', () => {
  it('does not treat fixture authors with the same display name as the signed-in member', () => {
    const fixtureMessage = {
      id: 'og1',
      author: 'Robbos',
    };

    expect(resolveMessageAuthorMember(fixtureMessage, selfMember, roster)).toBeUndefined();
  });

  it('still resolves messages the signed-in member actually sent', () => {
    const userMessage = {
      id: 'user-gc-official-nami-global-123',
      author: 'Robbos',
    };

    expect(resolveMessageAuthorMember(userMessage, selfMember, roster)?.id).toBe('m1');
  });

  it('shows the live self passport in chat presence instead of the shell placeholder', () => {
    const presence = getChatPresenceMembers(selfMember, roster);

    expect(presence[0]?.name).toBe('Robbos');
    expect(presence.some((member) => member.name === 'Traveler')).toBe(false);
  });
});