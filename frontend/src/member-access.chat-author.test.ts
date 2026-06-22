import { describe, expect, it } from 'vitest';

import {
  getChatPresenceMembers,
  resolveChatMessageAuthorLabel,
  resolveMessageAuthorMember,
} from './member-access.js';
import type { NamiMember } from './uiMockData.js';

const selfMember: NamiMember = {
  id: 'm1',
  surfaceType: 'member',
  name: 'NAMI',
  avatarSeed: 'NA',
  signal: 'Green',
  tier: 'Pro',
  badge: 'Owner',
};

const roster: NamiMember[] = [
  selfMember,
  {
    id: 'm2',
    surfaceType: 'member',
    name: 'HarborMint',
    avatarSeed: 'HM',
    signal: 'Green',
    tier: 'Adventurer',
    badge: 'Builder',
  },
];

describe('resolveMessageAuthorMember', () => {
  it('maps legacy self author names to the live passport', () => {
    const fixtureMessage = {
      id: 'fiends-m0',
      author: 'Robbos',
    };

    expect(resolveMessageAuthorMember(fixtureMessage, selfMember, roster)?.id).toBe('m1');
  });

  it('maps roster fixture authors by display name', () => {
    const fixtureMessage = {
      id: 'fiends-m1',
      author: 'HarborMint',
    };

    expect(resolveMessageAuthorMember(fixtureMessage, selfMember, roster)?.id).toBe('m2');
  });

  it('labels user-authored global chat with the current display name', () => {
    const userMessage = {
      id: 'user-gc-hub-123',
      author: 'Robbos',
    };

    expect(resolveChatMessageAuthorLabel(userMessage, selfMember, selfMember)).toBe('NAMI');
  });
});

describe('getChatPresenceMembers', () => {
  it('always includes the live self passport first', () => {
    const presence = getChatPresenceMembers(selfMember, roster, 3);

    expect(presence[0]?.id).toBe('m1');
    expect(presence[0]?.name).toBe('NAMI');
  });
});