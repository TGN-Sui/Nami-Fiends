import { describe, expect, it } from 'vitest';

import { resolveCommunityGrowthLineup } from './hub-community-growth.js';
import type { NamiChannel } from './domain/types.js';

function channel(id: string, handle: string, subscribers: number): NamiChannel {
  return {
    id,
    name: handle,
    handle,
    tagline: handle,
    genre: 'Indie',
    platforms: ['PC'],
    subscribers,
    partner: false,
    officialBadges: [],
    memberCount: 0,
    boostPower: 0,
    isVerified: true,
    isLive: false,
    coverUrl: '',
    logoUrl: '',
  };
}

describe('hub-community-growth', () => {
  it('shows a single channel once when only one qualifies', () => {
    const suuuisplash = channel('owner-game-suuuisplash', 'suuuisplash', 1200);

    const lineup = resolveCommunityGrowthLineup({
      sortedUniqueChannels: [suuuisplash],
      curatedChannelIds: [],
      resolveChannel: (channelId) => (channelId === suuuisplash.id ? suuuisplash : undefined),
      fallbackChannel: suuuisplash,
    });

    expect(lineup.usingCustom).toBe(false);
    expect(lineup.channels).toHaveLength(1);
    expect(lineup.channels[0]?.handle).toBe('suuuisplash');
  });

  it('dedupes curated lineup entries that resolve to the same handle', () => {
    const primary = channel('owner-game-suuuisplash', 'suuuisplash', 1200);
    const duplicate = channel('ticket-suuuisplash', '@suuuisplash', 900);

    const lineup = resolveCommunityGrowthLineup({
      sortedUniqueChannels: [],
      curatedChannelIds: [primary.id, duplicate.id],
      resolveChannel: (channelId) => {
        if (channelId === primary.id) {
          return primary;
        }

        if (channelId === duplicate.id) {
          return duplicate;
        }

        return undefined;
      },
      fallbackChannel: primary,
    });

    expect(lineup.usingCustom).toBe(true);
    expect(lineup.channels).toHaveLength(1);
    expect(lineup.channels[0]?.id).toBe(primary.id);
  });
});