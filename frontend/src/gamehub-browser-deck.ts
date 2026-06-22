import type { NamiChannel } from './domain/types.js';
import type { GameHubBrowserFilter } from './gamehub-preferences.js';

export type GameHubBrowserDeckEntry = {
  channel: NamiChannel;
  copyIndex: number;
  sortKey: number;
};

export function stableGameHubBrowserDeckSortKey(
  channelId: string,
  browserFilter: GameHubBrowserFilter,
): number {
  const seed = browserFilter + '\0' + channelId;
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function buildGameHubBrowserDeckEntries(
  channels: NamiChannel[],
  browserFilter: GameHubBrowserFilter,
): GameHubBrowserDeckEntry[] {
  return channels
    .map((channel) => ({
      channel,
      copyIndex: 0,
      sortKey: stableGameHubBrowserDeckSortKey(channel.id, browserFilter),
    }))
    .sort((left, right) => {
      if (left.sortKey !== right.sortKey) {
        return left.sortKey - right.sortKey;
      }

      return left.channel.name.localeCompare(right.channel.name);
    });
}