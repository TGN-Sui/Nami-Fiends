import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { members } from './uiMockData.js';

const boostPowerByChannel: Record<string, number> = {
  'rising-channel': 8,
  'open-channel': 18,
};

vi.mock('./channel-boost-store.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./channel-boost-store.js')>();

  return {
    ...actual,
    getChannelBoostPower: (channelId: string) => {
      if (channelId in boostPowerByChannel) {
        return boostPowerByChannel[channelId]!;
      }

      if (channelId.startsWith('open-channel')) {
        return 18;
      }

      return 0;
    },
  };
});

let ownedChannelId = 'rising-channel';

vi.mock('./channel-owner-access.js', () => ({
  ownsGameChannel: () => true,
  resolveOwnedGameChannel: () => ({
    id: ownedChannelId,
    name: ownedChannelId,
  }),
}));

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

import {
  closeFeaturedAuctionWeekForTests,
  FEATURED_AUCTION_OPEN_SLOTS,
  isRisingPoolEligibleChannel,
  hydrateFeaturedAuctionStore,
  readFeaturedAuctionHubChannelIds,
  readFeaturedAuctionStatus,
  resetFeaturedPlacementAuctionForTests,
  submitFeaturedAuctionBid,
} from './featured-placement-auction-store.js';

const verifiedMember = {
  ...members[0]!,
  id: 'auction-test-owner',
  tier: 'Pro' as const,
  signal: 'Green' as const,
};

describe('featured-placement-auction-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    ownedChannelId = 'rising-channel';
    resetFeaturedPlacementAuctionForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetFeaturedPlacementAuctionForTests();
  });

  it('routes low-boost channels to rising pool and high-boost channels to open pool', () => {
    expect(isRisingPoolEligibleChannel('rising-channel')).toBe(true);
    expect(isRisingPoolEligibleChannel('open-channel')).toBe(false);

    const risingResult = submitFeaturedAuctionBid({
      channelId: 'rising-channel',
      channelName: 'Rising Game',
      pool: 'rising',
      bidAmount: 25,
      member: verifiedMember,
    });
    ownedChannelId = 'open-channel';
    const openResult = submitFeaturedAuctionBid({
      channelId: 'open-channel',
      channelName: 'Open Game',
      pool: 'open',
      bidAmount: 40,
      member: verifiedMember,
    });
    const wrongPoolRising = submitFeaturedAuctionBid({
      channelId: 'open-channel',
      channelName: 'Open Game',
      pool: 'rising',
      bidAmount: 40,
      member: verifiedMember,
    });
    ownedChannelId = 'rising-channel';
    const wrongPoolOpen = submitFeaturedAuctionBid({
      channelId: 'rising-channel',
      channelName: 'Rising Game',
      pool: 'open',
      bidAmount: 25,
      member: verifiedMember,
    });

    expect(risingResult.ok).toBe(true);
    expect(openResult.ok).toBe(true);
    expect(wrongPoolRising).toEqual({ ok: false, reason: 'wrong-pool' });
    expect(wrongPoolOpen).toEqual({ ok: false, reason: 'wrong-pool' });
  });

  it('keeps hub projection empty while bidding is open and hidden for rising until close', () => {
    submitFeaturedAuctionBid({
      channelId: 'rising-channel',
      channelName: 'Rising Game',
      pool: 'rising',
      bidAmount: 25,
      member: verifiedMember,
    });

    const openStatus = readFeaturedAuctionStatus();

    expect(openStatus.isOpen).toBe(true);
    expect(openStatus.risingHidden).toBe(true);
    expect(readFeaturedAuctionHubChannelIds()).toEqual([]);
  });

  it('resolves rising and open winners after close and projects them into hub', () => {
    submitFeaturedAuctionBid({
      channelId: 'rising-channel',
      channelName: 'Rising Game',
      pool: 'rising',
      bidAmount: 25,
      member: verifiedMember,
    });

    for (let index = 0; index < FEATURED_AUCTION_OPEN_SLOTS + 1; index += 1) {
      ownedChannelId = 'open-channel-' + index;
      submitFeaturedAuctionBid({
        channelId: ownedChannelId,
        channelName: 'Open Game ' + index,
        pool: 'open',
        bidAmount: 50 - index,
        member: verifiedMember,
      });
    }

    const winners = closeFeaturedAuctionWeekForTests();
    const closedStatus = readFeaturedAuctionStatus();

    expect(closedStatus.isOpen).toBe(false);
    expect(closedStatus.risingHidden).toBe(false);
    expect(winners[0]?.pool).toBe('rising');
    expect(winners.filter((winner) => winner.pool === 'open')).toHaveLength(FEATURED_AUCTION_OPEN_SLOTS);
    expect(readFeaturedAuctionHubChannelIds()).toEqual(winners.map((winner) => winner.channelId));
  });

  it('does not persist auction state while reading status for render', () => {
    const localStorage = window.localStorage as Storage & { setItem: ReturnType<typeof vi.fn> };
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    readFeaturedAuctionStatus();
    readFeaturedAuctionHubChannelIds();

    expect(setItemSpy).not.toHaveBeenCalled();

    hydrateFeaturedAuctionStore();

    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it('replaces prior bids from the same channel within the active week', () => {
    submitFeaturedAuctionBid({
      channelId: 'rising-channel',
      channelName: 'Rising Game',
      pool: 'rising',
      bidAmount: 10,
      member: verifiedMember,
    });
    submitFeaturedAuctionBid({
      channelId: 'rising-channel',
      channelName: 'Rising Game',
      pool: 'rising',
      bidAmount: 30,
      member: verifiedMember,
    });

    const status = readFeaturedAuctionStatus();

    expect(status.bids).toHaveLength(1);
    expect(status.bids[0]?.bidAmount).toBe(30);
  });
});