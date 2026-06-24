import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readChannelOwnerPromotionsState,
  resetChannelOwnerPromotionsStateForTests,
  resolvePartnerCarouselCoverUrl,
  savePartnerCarouselTicket,
  saveSuperBannerDraft,
} from './channel-owner-promotions-store.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('channel-owner-promotions-store', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetChannelOwnerPromotionsStateForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetChannelOwnerPromotionsStateForTests();
  });

  it('returns a stable cached snapshot per channel for useSyncExternalStore', () => {
    const firstRead = readChannelOwnerPromotionsState('channel-a');
    const secondRead = readChannelOwnerPromotionsState('channel-a');

    expect(secondRead).toBe(firstRead);
  });

  it('keeps super banner and partner carousel drafts isolated per channel', () => {
    saveSuperBannerDraft('channel-a', {
      coverUrl: 'channel-media://nami.channel.super-banner-cover.channel-a',
      headline: 'Alpha headline',
      body: 'Alpha body',
    });
    savePartnerCarouselTicket('channel-a', {
      title: 'Alpha partner',
      description: 'Alpha description',
      coverUrl: 'channel-media://nami.channel.partner-carousel-cover.channel-a',
    });

    saveSuperBannerDraft('channel-b', {
      coverUrl: 'channel-media://nami.channel.super-banner-cover.channel-b',
      headline: 'Beta headline',
      body: 'Beta body',
    });
    savePartnerCarouselTicket('channel-b', {
      title: 'Beta partner',
      description: 'Beta description',
      coverUrl: 'channel-media://nami.channel.partner-carousel-cover.channel-b',
    });

    const channelA = readChannelOwnerPromotionsState('channel-a');
    const channelB = readChannelOwnerPromotionsState('channel-b');

    expect(channelA.superBanner.draft.headline).toBe('Alpha headline');
    expect(channelB.superBanner.draft.headline).toBe('Beta headline');
    expect(channelA.partnerCarousel.ticket?.title).toBe('Alpha partner');
    expect(channelB.partnerCarousel.ticket?.title).toBe('Beta partner');
    expect(channelA.superBanner.draft.coverUrl).toContain('channel-a');
    expect(channelB.superBanner.draft.coverUrl).toContain('channel-b');
    expect(channelA.partnerCarousel.ticket?.coverUrl).toContain('channel-a');
    expect(channelB.partnerCarousel.ticket?.coverUrl).toContain('channel-b');
  });

  it('does not reuse another channel partner cover ref when resolving preview urls', () => {
    savePartnerCarouselTicket('channel-a', {
      title: 'Alpha partner',
      coverUrl: 'channel-media://nami.channel.partner-carousel-cover.channel-a',
    });
    savePartnerCarouselTicket('channel-b', {
      title: 'Beta partner',
      coverUrl: 'channel-media://nami.channel.partner-carousel-cover.channel-b',
    });

    const channelATicket = readChannelOwnerPromotionsState('channel-a').partnerCarousel.ticket;
    const channelBTicket = readChannelOwnerPromotionsState('channel-b').partnerCarousel.ticket;

    expect(resolvePartnerCarouselCoverUrl('channel-a', channelBTicket)).toBe('');
    expect(resolvePartnerCarouselCoverUrl('channel-b', channelATicket)).toBe('');
  });
});