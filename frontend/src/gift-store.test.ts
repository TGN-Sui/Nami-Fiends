import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetGiftCatalogStoreForTests, setGiftCatalogSnapshot } from './gift-catalog-store.js';
import { OFFICIAL_GIFT_CATALOG } from './gift-catalog.js';
import { giftCatalogEntry } from './gift-catalog.js';
import {
  advanceGiftOverlayFloats,
  buildLocalGiftFulfillment,
  enqueueGiftOverlayBurst,
  getGiftOverlayFloatsSnapshotForTests,
  getGiftOverlayPendingHitCountForTests,
  recentGiftsForMember,
  recordLocalGiftFulfillment,
  resetGiftStoreForTests,
  triggerMockStreamGift,
} from './gift-store.js';
import { GIFT_OVERLAY_RISE_MS, giftOverlayStackKey } from './gift-overlay-motion.js';
import type { GiftFulfillment } from './gift-payments-api.js';

function sampleFulfillment(overrides: Partial<GiftFulfillment> = {}): GiftFulfillment {
  const gift = giftCatalogEntry('goon-heart')!;

  return {
    id: 'gift-test-1',
    intentId: 'intent-test-1',
    giftId: gift.id,
    giftLabel: gift.label,
    giftTier: gift.tier,
    giftEmoji: gift.emoji,
    animationClass: gift.animationClass,
    senderOwner: '0x' + 'a'.repeat(64),
    senderMemberId: 'sender-1',
    senderMemberName: 'Sender',
    targetType: 'member',
    targetMemberId: 'member-2',
    targetMemberName: 'Receiver',
    streamKey: null,
    streamTitle: null,
    channelOwnerMemberId: null,
    amountUsd: gift.priceUsd,
    goonAmount: gift.goonAmount,
    rail: 'goon_wallet',
    revenueSplit: {
      creatorPercent: 70,
      channelOwnerPercent: 0,
      platformPercent: 30,
      creatorAmountUsd: 2.1,
      channelOwnerAmountUsd: 0,
      platformAmountUsd: 0.9,
      channelOwnerRolledToPlatform: true,
    },
    txDigest: null,
    createdAtMs: Date.now(),
    ...overrides,
  };
}

describe('gift-store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-29T12:00:00.000Z'));
    resetGiftStoreForTests();
    resetGiftCatalogStoreForTests();
    setGiftCatalogSnapshot(OFFICIAL_GIFT_CATALOG);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records showcase gifts for a member profile', () => {
    recordLocalGiftFulfillment(sampleFulfillment());

    expect(recentGiftsForMember('member-2')).toHaveLength(1);
    expect(recentGiftsForMember('member-2')[0]?.giftLabel).toBe('Goon Heart');
  });

  it('queues overlay floats with sender, amount, and spawn metadata', () => {
    const legendary = giftCatalogEntry('goon-legend')!;

    enqueueGiftOverlayBurst(
      sampleFulfillment({
        giftId: legendary.id,
        giftLabel: legendary.label,
        giftTier: legendary.tier,
        giftEmoji: legendary.emoji,
        animationClass: legendary.animationClass,
        senderMemberId: 'sender-9',
        goonAmount: legendary.goonAmount,
      })
    );

    expect(getGiftOverlayFloatsSnapshotForTests()).toHaveLength(1);
    expect(getGiftOverlayFloatsSnapshotForTests()[0]?.giftTier).toBe('legendary');
    expect(getGiftOverlayFloatsSnapshotForTests()[0]?.goonAmount).toBe(legendary.goonAmount);
    expect(getGiftOverlayFloatsSnapshotForTests()[0]?.phase).toBe('rise');
    expect(typeof getGiftOverlayFloatsSnapshotForTests()[0]?.spawnBottomPercent).toBe('number');
  });

  it('queues repeated gifts while the current animation is still running', () => {
    const gift = giftCatalogEntry('goon-pop')!;

    enqueueGiftOverlayBurst(
      sampleFulfillment({
        id: 'gift-stack-1',
        giftId: gift.id,
        giftLabel: gift.label,
        giftTier: gift.tier,
        giftEmoji: gift.emoji,
        senderMemberId: 'sender-1',
        senderMemberName: 'Kai',
        goonAmount: gift.goonAmount,
      })
    );

    enqueueGiftOverlayBurst(
      sampleFulfillment({
        id: 'gift-stack-2',
        giftId: gift.id,
        giftLabel: gift.label,
        giftTier: gift.tier,
        giftEmoji: gift.emoji,
        senderMemberId: 'sender-1',
        senderMemberName: 'Kai',
        goonAmount: gift.goonAmount,
      })
    );

    const active = getGiftOverlayFloatsSnapshotForTests()[0];

    expect(getGiftOverlayFloatsSnapshotForTests()).toHaveLength(1);
    expect(active?.phase).toBe('rise');
    expect(active?.hitCount).toBe(1);
    expect(getGiftOverlayPendingHitCountForTests(giftOverlayStackKey('sender-1', gift.id))).toBe(1);
  });

  it('starts a new multiplier animation after the previous one finishes', () => {
    const gift = giftCatalogEntry('goon-pop')!;
    const startedAt = Date.now();
    const stackKey = giftOverlayStackKey('sender-1', gift.id);

    enqueueGiftOverlayBurst(
      sampleFulfillment({
        id: 'gift-stack-1',
        giftId: gift.id,
        senderMemberId: 'sender-1',
      })
    );

    enqueueGiftOverlayBurst(
      sampleFulfillment({
        id: 'gift-stack-2',
        giftId: gift.id,
        senderMemberId: 'sender-1',
      })
    );

    enqueueGiftOverlayBurst(
      sampleFulfillment({
        id: 'gift-stack-3',
        giftId: gift.id,
        senderMemberId: 'sender-1',
      })
    );

    advanceGiftOverlayFloats(startedAt + GIFT_OVERLAY_RISE_MS + 1);

    expect(getGiftOverlayPendingHitCountForTests(stackKey)).toBe(0);
    expect(getGiftOverlayFloatsSnapshotForTests()).toHaveLength(1);
    expect(getGiftOverlayFloatsSnapshotForTests()[0]?.hitCount).toBe(2);
    expect(getGiftOverlayFloatsSnapshotForTests()[0]?.phase).toBe('rise');
  });

  it('removes floats after the rise-and-fade window completes', () => {
    const gift = giftCatalogEntry('goon-heart')!;
    const startedAt = Date.now();

    enqueueGiftOverlayBurst(
      sampleFulfillment({
        giftId: gift.id,
        senderMemberId: 'sender-2',
        goonAmount: gift.goonAmount,
      })
    );

    advanceGiftOverlayFloats(startedAt + GIFT_OVERLAY_RISE_MS / 2);
    expect(getGiftOverlayFloatsSnapshotForTests()).toHaveLength(1);
    expect(getGiftOverlayFloatsSnapshotForTests()[0]?.phase).toBe('rise');

    advanceGiftOverlayFloats(startedAt + GIFT_OVERLAY_RISE_MS + 1);
    expect(getGiftOverlayFloatsSnapshotForTests()).toHaveLength(0);
  });

  it('builds local fulfillments from the catalog', () => {
    const fulfillment = buildLocalGiftFulfillment({
      giftId: 'goon-fire',
      senderOwner: '0x' + 'b'.repeat(64),
      senderMemberId: 'sender-1',
      senderMemberName: 'Sender',
      targetType: 'stream',
      targetMemberId: 'streamer-1',
      targetMemberName: 'Streamer',
      streamKey: 'twitch:0:twitch',
      streamTitle: 'Live broadcast',
    });

    expect(fulfillment?.giftLabel).toBe('Goon Fire');
    expect(fulfillment?.targetType).toBe('stream');
    expect(fulfillment?.streamKey).toBe('twitch:0:twitch');
  });

  it('fires mock stream gifts for owner local preview', () => {
    const ok = triggerMockStreamGift({
      giftId: 'goon-pop',
      streamKey: 'owner-gift-preview',
      targetMemberId: 'member-1',
      targetMemberName: 'Streamer',
    });

    expect(ok).toBe(true);
    expect(getGiftOverlayFloatsSnapshotForTests()).toHaveLength(1);
    expect(getGiftOverlayFloatsSnapshotForTests()[0]?.giftId).toBe('goon-pop');
  });
});