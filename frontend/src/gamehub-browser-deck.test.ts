import { describe, expect, it } from 'vitest';

import type { NamiChannel } from './domain/types.js';
import {
  advanceGameHubSwipeDeckIndex,
  buildGameHubBrowserDeckEntries,
  shuffleGameHubBrowserDeckEntries,
  stableGameHubBrowserDeckSortKey,
} from './gamehub-browser-deck.js';

function sampleChannel(id: string, name: string): NamiChannel {
  return {
    id,
    surfaceType: 'game',
    name,
    handle: '@' + id,
    owner: 'Owner',
    developerId: 'dev-' + id,
    developerName: 'Studio',
    developerLogoSeed: 'S',
    coverArtSeed: 'seed',
    coverArtStyle: 'neon',
    verifiedGame: false,
    genre: 'Action',
    platforms: ['PC'],
    subscribers: 10,
    verified: false,
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

describe('gamehub-browser-deck', () => {
  it('returns the same deck order for repeated builds', () => {
    const channels = [
      sampleChannel('alpha', 'Alpha'),
      sampleChannel('beta', 'Beta'),
      sampleChannel('gamma', 'Gamma'),
    ];

    const first = buildGameHubBrowserDeckEntries(channels, 'All').map((entry) => entry.channel.id);
    const second = buildGameHubBrowserDeckEntries(channels, 'All').map((entry) => entry.channel.id);

    expect(second).toEqual(first);
  });

  it('changes deck order when the browser filter changes', () => {
    const channels = [
      sampleChannel('alpha', 'Alpha'),
      sampleChannel('beta', 'Beta'),
      sampleChannel('gamma', 'Gamma'),
    ];

    const allFilterOrder = buildGameHubBrowserDeckEntries(channels, 'All').map((entry) => entry.channel.id);
    const pcFilterOrder = buildGameHubBrowserDeckEntries(channels, 'PC').map((entry) => entry.channel.id);

    expect(pcFilterOrder).not.toEqual(allFilterOrder);
  });

  it('uses deterministic sort keys per channel and filter', () => {
    expect(stableGameHubBrowserDeckSortKey('channel-a', 'All')).toBe(
      stableGameHubBrowserDeckSortKey('channel-a', 'All'),
    );
    expect(stableGameHubBrowserDeckSortKey('channel-a', 'All')).not.toBe(
      stableGameHubBrowserDeckSortKey('channel-b', 'All'),
    );
  });

  it('advances swipe deck sequentially and reshuffles on the final next swipe', () => {
    expect(advanceGameHubSwipeDeckIndex(0, 4, 'next')).toEqual({
      kind: 'next',
      nextIndex: 1,
      reshuffled: false,
    });
    expect(advanceGameHubSwipeDeckIndex(3, 4, 'next')).toEqual({
      kind: 'next',
      nextIndex: 0,
      reshuffled: true,
    });
    expect(advanceGameHubSwipeDeckIndex(0, 4, 'previous')).toBeNull();
    expect(advanceGameHubSwipeDeckIndex(2, 4, 'previous')).toEqual({
      kind: 'previous',
      nextIndex: 1,
      reshuffled: false,
    });
  });

  it('keeps the same channel multiset when shuffling swipe deck entries', () => {
    const channels = [
      sampleChannel('alpha', 'Alpha'),
      sampleChannel('beta', 'Beta'),
      sampleChannel('gamma', 'Gamma'),
    ];
    const entries = buildGameHubBrowserDeckEntries(channels, 'All');
    const shuffled = shuffleGameHubBrowserDeckEntries(entries);

    expect(shuffled.map((entry) => entry.channel.id).sort()).toEqual(
      entries.map((entry) => entry.channel.id).sort(),
    );
  });
});