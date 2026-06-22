import { getChannelBoostPower } from './channel-boost-store.js';
import { gameBubbleScaleFromBoostPower } from './bubble-weekly-scale.js';
import { dedupeChannelsByIdentity } from './local-channel-directory.js';
import type { NamiCryptoBubbleEntry } from './CryptoBubbleBoard.js';
import type { NamiChannel } from './domain/types.js';

export function buildGameBubbleDiscoveryEntries(
  channels: NamiChannel[],
  maxEntries = 50,
): NamiCryptoBubbleEntry[] {
  const uniqueChannels = dedupeChannelsByIdentity(channels);

  return [...uniqueChannels]
    .sort((left, right) => getChannelBoostPower(right.id) - getChannelBoostPower(left.id))
    .slice(0, maxEntries)
    .map((channel) => ({
      channel,
      slotId: channel.id + '-discovery-bubble',
      weeklyScale: gameBubbleScaleFromBoostPower(getChannelBoostPower(channel.id)),
    }));
}