import { describe, expect, it } from 'vitest';

import { resolveChannelDirectory } from './channel-directory-provider.js';
import type { NamiChannel } from './domain/types.js';
import type { DiscoveryChannelRanking } from './protocol.js';

function discoveryRanking(
  partial: Omit<DiscoveryChannelRanking, 'score_components'> &
    Partial<Pick<DiscoveryChannelRanking, 'score_components'>>,
): DiscoveryChannelRanking {
  return {
    ...partial,
    score_components: partial.score_components ?? {
      boost: partial.boost_power * 10,
      verification: partial.is_verified ? 50 : 0,
      badges: 0,
      guild: 0,
      moderation: 0,
      base: partial.is_public ? 10 : 0,
    },
  };
}

const fixtureChannel: NamiChannel = {
  id: 'fiends',
  surfaceType: 'game',
  name: 'FIENDS',
  handle: '@fiends',
  owner: 'Goonie Labs',
  developerId: 'goonie-labs',
  developerName: 'Goonie Labs',
  developerLogoSeed: 'GL',
  coverArtSeed: 'cyber-alley',
  coverArtStyle: 'neon',
  verifiedGame: true,
  genre: 'Gaming / Social',
  platforms: ['PC'],
  subscribers: 128,
  verified: true,
  partner: true,
  signal: 'Green',
  tagline: 'Fixture channel',
  banner: 'Fixture banner',
  theme: 'crimson',
  modules: [],
  officialBadges: [],
  customBadges: [],
  verifiedLinks: [],
  announcements: [],
};

describe('channel-directory-provider', () => {
  it('prefers live discovery rankings when indexed data is available', () => {
    const items = resolveChannelDirectory({
      liveRankings: [
        discoveryRanking({
          channel_id: '0xabc123',
          owner: '0xowner',
          is_verified: true,
          is_public: true,
          boost_power: 120,
          boost_count: 3,
          score: 420,
          week_id: 12,
          rank: 1,
          signals: ['verified'],
        }),
      ],
      loadState: 'ready',
      liveQueryEnabled: true,
      fixtureChannels: [fixtureChannel],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('live');
    expect(items[0]?.channel.id).toBe('0xabc123');
    expect(items[0]?.channel.verified).toBe(true);
    expect(items[0]?.rank).toBe(1);
  });

  it('returns fixture channels when the live query is unavailable', () => {
    const items = resolveChannelDirectory({
      liveRankings: [],
      loadState: 'ready',
      liveQueryEnabled: false,
      fixtureChannels: [fixtureChannel],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('fixture');
    expect(items[0]?.channel.name).toBe('FIENDS');
  });

  it('falls back to fixtures when live discovery is empty during dev polish', () => {
    const items = resolveChannelDirectory({
      liveRankings: [],
      loadState: 'ready',
      liveQueryEnabled: true,
      fixtureChannels: [fixtureChannel],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('fixture');
  });

  it('falls back to fixtures after a live discovery load error', () => {
    const items = resolveChannelDirectory({
      liveRankings: [],
      loadState: 'error',
      liveQueryEnabled: true,
      fixtureChannels: [fixtureChannel],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('fixture');
    expect(items[0]?.channel.id).toBe('fiends');
  });

  it('shows fixture channels while discovery is still loading', () => {
    const items = resolveChannelDirectory({
      liveRankings: [],
      loadState: 'loading',
      liveQueryEnabled: true,
      fixtureChannels: [fixtureChannel],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('fixture');
  });

  it('deduplicates channels by handle when live and local catalogs overlap', () => {
    const localChannel: NamiChannel = {
      ...fixtureChannel,
      id: 'owner-game-fiends',
      handle: '@fiends',
      name: 'FIENDS',
    };

    const items = resolveChannelDirectory({
      liveRankings: [
        discoveryRanking({
          channel_id: 'fiends',
          owner: '0xowner',
          is_verified: true,
          is_public: true,
          boost_power: 40,
          boost_count: 2,
          score: 220,
          week_id: 12,
          rank: 1,
          signals: ['verified'],
        }),
      ],
      loadState: 'ready',
      liveQueryEnabled: true,
      fixtureChannels: [fixtureChannel],
      localChannels: [localChannel],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.channel.id).toBe('fiends');
    expect(items[0]?.source).toBe('live');
  });

  it('prefers local created channels when live discovery is empty', () => {
    const localChannel: NamiChannel = {
      ...fixtureChannel,
      id: 'owner-game-pawtato',
      name: 'Pawtato Land',
      handle: '@pawtato',
    };

    const items = resolveChannelDirectory({
      liveRankings: [],
      loadState: 'ready',
      liveQueryEnabled: true,
      fixtureChannels: [fixtureChannel],
      localChannels: [localChannel],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.channel.id).toBe('owner-game-pawtato');
    expect(items[0]?.source).toBe('live');
  });

  it('enriches fixture metadata when a live ranking matches a fixture id', () => {
    const items = resolveChannelDirectory({
      liveRankings: [
        discoveryRanking({
          channel_id: 'fiends',
          owner: '0xowner',
          is_verified: true,
          is_public: true,
          boost_power: 80,
          boost_count: 2,
          score: 900,
          week_id: 12,
          rank: 2,
          signals: ['verified'],
        }),
      ],
      loadState: 'ready',
      liveQueryEnabled: true,
      fixtureChannels: [fixtureChannel],
    });

    expect(items[0]?.source).toBe('live');
    expect(items[0]?.channel.name).toBe('FIENDS');
    expect(items[0]?.channel.subscribers).toBe(900);
  });
});