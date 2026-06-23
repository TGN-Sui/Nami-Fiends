import { getChannelBoostPower } from './channel-boost-store.js';
import { gameBubbleScaleFromBoostPower } from './bubble-weekly-scale.js';
import { dedupeChannelsByIdentity } from './local-channel-directory.js';
import type { NamiCryptoBubbleEntry } from './CryptoBubbleBoard.js';
import type { NamiChannel } from './domain/types.js';

export type ChannelDiscoveryScoreLookup = Map<string, number> | Readonly<Record<string, number>>;

function resolveDiscoveryScore(
  channelId: string,
  discoveryScores?: ChannelDiscoveryScoreLookup,
): number | null {
  if (!discoveryScores) {
    return null;
  }

  if (discoveryScores instanceof Map) {
    const score = discoveryScores.get(channelId);

    return score === undefined ? null : score;
  }

  const score = discoveryScores[channelId];

  return score === undefined ? null : score;
}

function weeklyScaleForChannel(channelId: string, discoveryScore: number | null): number {
  if (discoveryScore === null || discoveryScore <= 0) {
    return gameBubbleScaleFromBoostPower(getChannelBoostPower(channelId));
  }

  return gameBubbleScaleFromBoostPower(Math.max(1, Math.round(discoveryScore / 10)));
}

export function buildGameBubbleDiscoveryEntries(
  channels: NamiChannel[],
  maxEntries = 50,
  discoveryScores?: ChannelDiscoveryScoreLookup,
): NamiCryptoBubbleEntry[] {
  const uniqueChannels = dedupeChannelsByIdentity(channels);

  return [...uniqueChannels]
    .sort((left, right) => {
      const leftScore =
        resolveDiscoveryScore(left.id, discoveryScores) ?? getChannelBoostPower(left.id);
      const rightScore =
        resolveDiscoveryScore(right.id, discoveryScores) ?? getChannelBoostPower(right.id);

      return rightScore - leftScore;
    })
    .slice(0, maxEntries)
    .map((channel) => {
      const discoveryScore = resolveDiscoveryScore(channel.id, discoveryScores);

      return {
        channel,
        slotId: channel.id + '-discovery-bubble',
        weeklyScale: weeklyScaleForChannel(channel.id, discoveryScore),
      };
    });
}

export function discoveryScoreLookupFromDirectory(
  items: ReadonlyArray<{ channel: NamiChannel; score: number; source: string }>,
): Map<string, number> {
  const lookup = new Map<string, number>();

  for (const item of items) {
    if (item.source !== 'live' || item.score <= 0) {
      continue;
    }

    lookup.set(item.channel.id, item.score);
  }

  return lookup;
}