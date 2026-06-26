import { describe, expect, it } from 'vitest';

import type { NamiMember } from './domain/types.js';
import { grantRosterMembers } from './official-grant-roster.js';

const rosterMember = (id: string, name: string): NamiMember => ({
  id,
  surfaceType: 'member',
  name,
  avatarSeed: 'NA',
  signal: 'Green',
  tier: 'Pro',
  badge: 'Hearth Basic',
});

describe('official-grant-roster', () => {
  it('sorts roster members and preserves unknown granted ids', () => {
    const roster = grantRosterMembers(
      [rosterMember('m2', 'Zara'), rosterMember('m1', 'Alex')],
      ['legacy-grant', 'm1']
    );

    expect(roster.map((member) => member.id)).toEqual(['m1', 'm2', 'legacy-grant']);
    expect(roster.find((member) => member.id === 'legacy-grant')?.name).toBe('legacy-grant');
  });
});