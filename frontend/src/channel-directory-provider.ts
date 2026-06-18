import { useMemo } from 'react';

import { shouldUseFixtureCatalogFallback } from './app-config.js';
import type { ChannelModule, ConductSignal, NamiChannel } from './domain/types.js';
import { channels as seedChannels } from './fixtures/seed-data.js';
import type { DiscoveryChannelRanking } from './protocol.js';
import { useDiscoveryChannelsQuery, type ProtocolLoadState } from './protocol-query.js';

export type DirectoryDataSource = 'live' | 'fixture';

export type ChannelDirectoryItem = {
  channel: NamiChannel;
  source: DirectoryDataSource;
  rank: number;
  score: number;
};

const DEFAULT_CHANNEL_MODULES: ChannelModule[] = [
  { label: 'Game Chat', description: 'Main live community chat.' },
  { label: 'Timeline', description: 'Official posts and community updates.' },
  { label: 'Guilds', description: 'Guilds created inside this channel.' },
  { label: 'Events', description: 'Upcoming events and tournaments.' },
];

const COVER_ART_STYLES: NamiChannel['coverArtStyle'][] = [
  'neon',
  'ocean',
  'cozy',
  'arcade',
  'builder',
];

function conductSignalFromSignals(signals: string[]): ConductSignal {
  const normalized = signals.map((signal) => signal.toLowerCase());

  if (normalized.some((signal) => signal.includes('black'))) {
    return 'Black';
  }

  if (normalized.some((signal) => signal.includes('red'))) {
    return 'Red';
  }

  if (normalized.some((signal) => signal.includes('orange'))) {
    return 'Orange';
  }

  return 'Green';
}

function fixtureChannelForRanking(
  ranking: DiscoveryChannelRanking,
  fixtureChannels: NamiChannel[]
): NamiChannel | undefined {
  return fixtureChannels.find((channel) => {
    return (
      channel.id === ranking.channel_id ||
      channel.handle.replace('@', '') === ranking.channel_id ||
      channel.id === ranking.channel_id.replace(/^0x/, '')
    );
  });
}

function coverArtStyleForChannelId(channelId: string): NamiChannel['coverArtStyle'] {
  const hash = channelId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return COVER_ART_STYLES[hash % COVER_ART_STYLES.length]!;
}

function syntheticChannelFromRanking(
  ranking: DiscoveryChannelRanking,
  fixtureChannels: NamiChannel[]
): NamiChannel {
  const fixture = fixtureChannelForRanking(ranking, fixtureChannels);

  if (fixture) {
    return {
      ...fixture,
      id: ranking.channel_id,
      verified: ranking.is_verified || fixture.verified,
      subscribers: Math.max(fixture.subscribers, Math.round(ranking.score)),
      signal: conductSignalFromSignals(ranking.signals),
    };
  }

  const shortId = ranking.channel_id.slice(0, 8);
  const coverArtStyle = coverArtStyleForChannelId(ranking.channel_id);

  return {
    id: ranking.channel_id,
    surfaceType: 'game',
    name: 'Channel ' + shortId,
    handle: '@' + shortId,
    owner: ranking.owner,
    developerId: 'live-' + shortId,
    developerName: ranking.owner.slice(0, 12),
    developerLogoSeed: shortId.slice(0, 2).toUpperCase(),
    coverArtSeed: 'discovery-' + shortId,
    coverArtStyle,
    verifiedGame: ranking.is_verified,
    genre: 'Discovery',
    platforms: ['PC'],
    subscribers: Math.max(1, Math.round(ranking.score)),
    verified: ranking.is_verified,
    partner: ranking.boost_power >= 100,
    signal: conductSignalFromSignals(ranking.signals),
    tagline: 'Indexed discovery channel.',
    banner: 'Discovery ranking',
    theme: 'blue',
    modules: DEFAULT_CHANNEL_MODULES,
    officialBadges: ranking.is_verified ? ['Verified Channel'] : [],
    customBadges: [],
    verifiedLinks: [],
    announcements: [],
  };
}

function mapLiveRanking(
  ranking: DiscoveryChannelRanking,
  fixtureChannels: NamiChannel[]
): ChannelDirectoryItem {
  return {
    channel: syntheticChannelFromRanking(ranking, fixtureChannels),
    source: 'live',
    rank: ranking.rank,
    score: ranking.score,
  };
}

function mapFixtureChannel(channel: NamiChannel, index: number): ChannelDirectoryItem {
  return {
    channel,
    source: 'fixture',
    rank: index + 1,
    score: channel.subscribers,
  };
}

export function resolveChannelDirectory(input: {
  liveRankings: DiscoveryChannelRanking[];
  loadState: ProtocolLoadState;
  liveQueryEnabled: boolean;
  fixtureChannels?: NamiChannel[];
}): ChannelDirectoryItem[] {
  const fixtureChannels = input.fixtureChannels ?? seedChannels;

  if (input.liveRankings.length > 0) {
    return input.liveRankings.map((ranking) => mapLiveRanking(ranking, fixtureChannels));
  }

  if (!shouldUseFixtureCatalogFallback(input.liveRankings.length, input.loadState)) {
    return [];
  }

  return fixtureChannels.map(mapFixtureChannel);
}

export function channelDirectoryUsesFixtures(items: ChannelDirectoryItem[]): boolean {
  return items.some((item) => item.source === 'fixture');
}

export function channelsFromDirectory(items: ChannelDirectoryItem[]): NamiChannel[] {
  return items.map((item) => item.channel);
}

export function useChannelDirectory(limit = 50): {
  items: ChannelDirectoryItem[];
  channels: NamiChannel[];
  loadState: ProtocolLoadState;
  usesFixtures: boolean;
} {
  const { data, loadState, context } = useDiscoveryChannelsQuery(limit);
  const liveQueryEnabled = context.indexer !== null;

  const items = useMemo(
    () =>
      resolveChannelDirectory({
        liveRankings: data?.channels ?? [],
        loadState,
        liveQueryEnabled,
      }),
    [data?.channels, loadState, liveQueryEnabled]
  );

  return {
    items,
    channels: channelsFromDirectory(items),
    loadState,
    usesFixtures: channelDirectoryUsesFixtures(items),
  };
}