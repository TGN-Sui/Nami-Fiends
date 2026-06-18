import { describe, expect, it } from 'vitest';

import { resolveMemberGuildAffiliations } from './affiliation-provider.js';
import type { NamiGuildRecord } from './nami-affiliations.js';

const createdGuild: NamiGuildRecord = {
  id: 'guild-created',
  name: 'Created Guild',
  ownerMemberId: 'm1',
  memberIds: ['m1'],
  isPublic: true,
};

const fixtureGuild: NamiGuildRecord = {
  id: 'guild-fixture',
  name: 'Fixture Guild',
  ownerMemberId: 'm2',
  memberIds: ['m1', 'm2'],
  isPublic: false,
};

describe('affiliation-provider', () => {
  it('prefers live guild cards when indexed data is available', () => {
    const items = resolveMemberGuildAffiliations({
      liveCards: [
        {
          id: 'guild-live',
          title: 'Live Guild',
          subtitle: 'Indexed membership',
          isPublic: true,
          memberCount: 4,
          source: 'indexer',
        },
      ],
      loadState: 'ready',
      liveQueryEnabled: true,
      memberId: 'm1',
      createdGuilds: [createdGuild],
      fixtureGuilds: [fixtureGuild],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('live');
    expect(items[0]?.title).toBe('Live Guild');
  });

  it('returns fixture guilds when the live query is unavailable', () => {
    const items = resolveMemberGuildAffiliations({
      liveCards: [],
      loadState: 'ready',
      liveQueryEnabled: false,
      memberId: 'm1',
      createdGuilds: [createdGuild],
      fixtureGuilds: [fixtureGuild],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('fixture');
    expect(items[0]?.title).toBe('Fixture Guild');
  });

  it('merges created guilds with member fixtures when no override is provided', () => {
    const items = resolveMemberGuildAffiliations({
      liveCards: [],
      loadState: 'ready',
      liveQueryEnabled: false,
      memberId: 'm1',
      createdGuilds: [createdGuild],
    });

    expect(items.some((item) => item.id === 'guild-created')).toBe(true);
    expect(items.every((item) => item.source === 'fixture')).toBe(true);
  });

  it('returns no guilds when live query succeeds with an empty membership set', () => {
    const items = resolveMemberGuildAffiliations({
      liveCards: [],
      loadState: 'ready',
      liveQueryEnabled: true,
      memberId: 'm1',
      createdGuilds: [createdGuild],
      fixtureGuilds: [fixtureGuild],
    });

    expect(items).toHaveLength(0);
  });

  it('falls back to fixtures after a live guild load error', () => {
    const items = resolveMemberGuildAffiliations({
      liveCards: [],
      loadState: 'error',
      liveQueryEnabled: true,
      memberId: 'm1',
      createdGuilds: [],
      fixtureGuilds: [fixtureGuild],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('fixture');
    expect(items[0]?.title).toBe('Fixture Guild');
  });
});