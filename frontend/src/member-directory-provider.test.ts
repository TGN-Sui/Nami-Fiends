import { describe, expect, it } from 'vitest';

import { resolveMemberDirectory } from './member-directory-provider.js';
import type { NamiMember } from './domain/types.js';

const fixtureMember: NamiMember = {
  id: 'm1',
  surfaceType: 'member',
  name: 'Fixture Member',
  avatarSeed: 'FM',
  signal: 'Green',
  tier: 'Pro',
  badge: 'Verified',
};

describe('member-directory-provider', () => {
  it('prefers live members when indexed data is available', () => {
    const items = resolveMemberDirectory({
      liveMembers: [
        {
          id: 'live-1',
          surfaceType: 'member',
          name: 'Live Member',
          avatarSeed: 'LM',
          signal: 'Green',
          tier: 'Elite',
          badge: 'Indexed',
        },
      ],
      loadState: 'ready',
      liveQueryEnabled: true,
      fixtureMembers: [fixtureMember],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('live');
    expect(items[0]?.member.name).toBe('Live Member');
  });

  it('returns fixture members when the live query is unavailable', () => {
    const items = resolveMemberDirectory({
      liveMembers: [],
      loadState: 'ready',
      liveQueryEnabled: false,
      fixtureMembers: [fixtureMember],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('fixture');
    expect(items[0]?.member.name).toBe('Fixture Member');
  });

  it('returns no members when live query succeeds with an empty directory set', () => {
    const items = resolveMemberDirectory({
      liveMembers: [],
      loadState: 'ready',
      liveQueryEnabled: true,
      fixtureMembers: [fixtureMember],
    });

    expect(items).toHaveLength(0);
  });

  it('falls back to fixtures after a live member load error', () => {
    const items = resolveMemberDirectory({
      liveMembers: [],
      loadState: 'error',
      liveQueryEnabled: true,
      fixtureMembers: [fixtureMember],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('fixture');
    expect(items[0]?.member.id).toBe('m1');
  });
});