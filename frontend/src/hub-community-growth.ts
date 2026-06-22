import type { NamiChannel } from './domain/types.js';
import { channelDirectoryDedupeKey, dedupeChannelsByIdentity } from './local-channel-directory.js';
import { COMMUNITY_GROWTH_DISPLAY_LIMIT } from './owner-hub-curation-store.js';

export function buildDefaultCommunityGrowthLineup(
  sortedUniqueChannels: NamiChannel[],
  fallbackChannel: NamiChannel,
  limit = COMMUNITY_GROWTH_DISPLAY_LIMIT,
): NamiChannel[] {
  if (sortedUniqueChannels.length === 0) {
    return [fallbackChannel];
  }

  return sortedUniqueChannels.slice(0, limit);
}

export function buildCuratedCommunityGrowthLineup(
  channelIds: string[],
  resolveChannel: (channelId: string) => NamiChannel | undefined,
  limit = COMMUNITY_GROWTH_DISPLAY_LIMIT,
): NamiChannel[] {
  const resolved = channelIds
    .map((channelId) => resolveChannel(channelId))
    .filter((channel): channel is NamiChannel => channel !== undefined);

  return dedupeChannelsByIdentity(resolved).slice(0, limit);
}

export function resolveCommunityGrowthLineup(input: {
  sortedUniqueChannels: NamiChannel[];
  curatedChannelIds: string[];
  resolveChannel: (channelId: string) => NamiChannel | undefined;
  fallbackChannel: NamiChannel;
  limit?: number;
}): { channels: NamiChannel[]; usingCustom: boolean } {
  const limit = input.limit ?? COMMUNITY_GROWTH_DISPLAY_LIMIT;
  const curated = buildCuratedCommunityGrowthLineup(
    input.curatedChannelIds,
    input.resolveChannel,
    limit,
  );
  const usingCustom = input.curatedChannelIds.length > 0 && curated.length > 0;

  if (usingCustom) {
    return { channels: curated, usingCustom: true };
  }

  return {
    channels: buildDefaultCommunityGrowthLineup(
      input.sortedUniqueChannels,
      input.fallbackChannel,
      limit,
    ),
    usingCustom: false,
  };
}

export function communityGrowthChannelKey(
  channelId: string,
  resolveChannel: (channelId: string) => NamiChannel | undefined,
): string {
  const channel = resolveChannel(channelId);

  return channel ? channelDirectoryDedupeKey(channel) : 'id:' + channelId;
}

export function dedupeCommunityGrowthChannelIds(
  channelIds: string[],
  resolveChannel: (channelId: string) => NamiChannel | undefined,
): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const channelId of channelIds) {
    const key = communityGrowthChannelKey(channelId, resolveChannel);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(channelId);
  }

  return deduped;
}