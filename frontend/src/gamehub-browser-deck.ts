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

/** Fisher–Yates shuffle for swipe-deck rounds (tile strip keeps deterministic order). */
export function shuffleGameHubBrowserDeckEntries(
  entries: GameHubBrowserDeckEntry[],
): GameHubBrowserDeckEntry[] {
  const next = entries.map((entry, copyIndex) => ({
    ...entry,
    copyIndex,
  }));

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index]!;
    next[index] = next[swapIndex]!;
    next[swapIndex] = current;
  }

  return next;
}

export type GameHubSwipeDeckAdvanceResult =
  | { kind: 'next'; nextIndex: number; reshuffled: false }
  | { kind: 'next'; nextIndex: 0; reshuffled: true }
  | { kind: 'previous'; nextIndex: number; reshuffled: false };

export function advanceGameHubSwipeDeckIndex(
  index: number,
  deckLength: number,
  direction: 'next' | 'previous',
): GameHubSwipeDeckAdvanceResult | null {
  if (deckLength <= 0) {
    return null;
  }

  if (direction === 'previous') {
    if (index <= 0) {
      return null;
    }

    return { kind: 'previous', nextIndex: index - 1, reshuffled: false };
  }

  if (index < deckLength - 1) {
    return { kind: 'next', nextIndex: index + 1, reshuffled: false };
  }

  return { kind: 'next', nextIndex: 0, reshuffled: true };
}