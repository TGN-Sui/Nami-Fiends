import type { FeaturedAuctionStatus, FeaturedAuctionWinner } from './featured-placement-auction-store.js';
import type { NamiChannel } from './uiMockData.js';

export type HubFeaturedBannerContext = {
  kind: 'auction-winner' | 'hub-featured' | 'partner-carousel' | 'discovery';
  pool?: FeaturedAuctionWinner['pool'];
};

export function resolveAuctionWinnerChannels(
  auctionStatus: FeaturedAuctionStatus,
  resolveChannel: (channelId: string) => NamiChannel | undefined,
): NamiChannel[] {
  if (auctionStatus.isOpen || auctionStatus.winners.length === 0) {
    return [];
  }

  return auctionStatus.winners
    .map((winner) => resolveChannel(winner.channelId))
    .filter((channel): channel is NamiChannel => Boolean(channel));
}

export function resolveFeaturedShowcaseChannels(input: {
  auctionWinnerChannels: NamiChannel[];
  hubFeaturedChannel: NamiChannel | null;
  directoryChannels: NamiChannel[];
  fallbackChannel: NamiChannel;
  maxDiscoverySlots?: number;
}): NamiChannel[] {
  const maxDiscoverySlots = input.maxDiscoverySlots ?? 8;
  const reservedFeaturedIds = new Set([
    ...input.auctionWinnerChannels.map((channel) => channel.id),
    ...(input.hubFeaturedChannel ? [input.hubFeaturedChannel.id] : []),
  ]);

  if (
    input.auctionWinnerChannels.length > 0 ||
    input.directoryChannels.length > 0 ||
    input.hubFeaturedChannel
  ) {
    return [
      ...input.auctionWinnerChannels,
      ...(input.hubFeaturedChannel ? [input.hubFeaturedChannel] : []),
      ...input.directoryChannels
        .filter((channel) => !reservedFeaturedIds.has(channel.id))
        .slice(0, Math.max(0, maxDiscoverySlots - input.auctionWinnerChannels.length)),
    ];
  }

  return [input.fallbackChannel];
}

export function resolveHubFeaturedBannerContext(input: {
  channelId: string;
  auctionStatus: FeaturedAuctionStatus;
  hubFeaturedChannelId: string | null;
  hasPartnerCarousel: boolean;
}): HubFeaturedBannerContext {
  const winner = input.auctionStatus.winners.find((entry) => entry.channelId === input.channelId);

  if (winner && !input.auctionStatus.isOpen) {
    return {
      kind: 'auction-winner',
      pool: winner.pool,
    };
  }

  if (input.hubFeaturedChannelId && input.channelId === input.hubFeaturedChannelId) {
    return { kind: 'hub-featured' };
  }

  if (input.hasPartnerCarousel) {
    return { kind: 'partner-carousel' };
  }

  return { kind: 'discovery' };
}

export function formatHubFeaturedBannerLabel(context: HubFeaturedBannerContext): string {
  if (context.kind === 'auction-winner') {
    return context.pool === 'rising' ? 'Rising pool winner' : 'Featured placement winner';
  }

  if (context.kind === 'hub-featured') {
    return 'Hub featured game';
  }

  if (context.kind === 'partner-carousel') {
    return 'Featured partner banner carousel';
  }

  return 'Discovery spotlight';
}