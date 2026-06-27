import { describe, expect, it } from 'vitest';

import type { FeaturedAuctionStatus } from './featured-placement-auction-store.js';
import {
  formatHubFeaturedBannerLabel,
  resolveAuctionWinnerChannels,
  resolveFeaturedShowcaseChannels,
  resolveHubFeaturedBannerContext,
} from './hub-featured-showcase.js';
import type { NamiChannel } from './domain/types.js';

function createChannel(id: string, name: string): NamiChannel {
  return {
    id,
    surfaceType: 'game',
    name,
    handle: '@' + id,
    owner: 'Studio',
    developerId: 'dev-' + id,
    developerName: 'Studio',
    developerLogoSeed: 'ST',
    coverArtSeed: id,
    coverArtStyle: 'neon',
    verifiedGame: true,
    genre: 'Action',
    platforms: ['PC'],
    subscribers: 100,
    verified: true,
    partner: false,
    signal: 'Green',
    tagline: 'Tagline',
    banner: 'Banner',
    theme: 'blue',
    modules: [],
    officialBadges: [],
    customBadges: [],
    verifiedLinks: [],
    announcements: [],
  };
}

const closedAuctionStatus: FeaturedAuctionStatus = {
  weekId: 12,
  isOpen: false,
  closesAtLabel: 'Mon 00:00 UTC',
  risingHidden: false,
  bids: [],
  winners: [
    {
      channelId: 'winner-open',
      channelName: 'Open Winner',
      pool: 'open',
      bidAmount: 40,
    },
    {
      channelId: 'winner-rising',
      channelName: 'Rising Winner',
      pool: 'rising',
      bidAmount: 12,
    },
  ],
};

describe('hub-featured-showcase', () => {
  it('returns auction winners only after close', () => {
    const channels = [createChannel('winner-open', 'Open Winner')];

    expect(
      resolveAuctionWinnerChannels(
        { ...closedAuctionStatus, isOpen: true },
        (id) => channels.find((channel) => channel.id === id),
      ),
    ).toEqual([]);

    expect(
      resolveAuctionWinnerChannels(closedAuctionStatus, (id) =>
        channels.find((channel) => channel.id === id),
      ),
    ).toEqual([channels[0]]);
  });

  it('prioritizes auction winners in showcase lineup', () => {
    const winner = createChannel('winner-open', 'Open Winner');
    const hubFeatured = createChannel('hub-featured', 'Hub Featured');
    const discovery = createChannel('discovery-a', 'Discovery A');

    const lineup = resolveFeaturedShowcaseChannels({
      auctionWinnerChannels: [winner],
      hubFeaturedChannel: hubFeatured,
      directoryChannels: [discovery, winner, hubFeatured],
      fallbackChannel: discovery,
    });

    expect(lineup.map((channel) => channel.id)).toEqual(['winner-open', 'hub-featured', 'discovery-a']);
  });

  it('labels auction-winner banner context by pool', () => {
    const context = resolveHubFeaturedBannerContext({
      channelId: 'winner-rising',
      auctionStatus: closedAuctionStatus,
      hubFeaturedChannelId: null,
      hasPartnerCarousel: false,
    });

    expect(context.kind).toBe('auction-winner');
    expect(formatHubFeaturedBannerLabel(context)).toBe('Rising pool winner');
  });
});