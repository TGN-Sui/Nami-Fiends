import { useSyncExternalStore } from 'react';

import { resolveGiftCatalogEntry } from './gift-catalog-store.js';
import {
  GIFT_OVERLAY_RISE_MS,
  giftOverlayStackKey,
  pickGiftOverlaySpawnBottomPercent,
  pickGiftOverlaySpawnXPercent,
  type GiftOverlayPhase,
} from './gift-overlay-motion.js';
import {
  fetchRecentGifts,
  isGiftApiAvailable,
  type GiftFulfillment,
} from './gift-payments-api.js';

export type GiftOverlayFloat = {
  id: string;
  stackKey: string;
  streamKey: string | null;
  targetMemberId: string;
  giftId: string;
  giftTier: 'common' | 'rare' | 'legendary';
  giftEmoji: string;
  giftIconUrl: string | null;
  senderMemberId: string;
  senderMemberName: string;
  targetMemberName: string;
  goonAmount: number;
  hitCount: number;
  spawnXPercent: number;
  spawnBottomPercent: number;
  phase: GiftOverlayPhase;
  phaseStartedAtMs: number;
  createdAtMs: number;
};

/** @deprecated Use GiftOverlayFloat — kept for older tests during migration. */
export type GiftOverlayBurst = GiftOverlayFloat;

type GiftOverlayPendingBatch = {
  hitCount: number;
  fulfillment: GiftFulfillment;
};

const MAX_OVERLAY_FLOATS = 16;
const listeners = new Set<() => void>();
let cachedShowcase: GiftFulfillment[] = [];
let cachedOverlayFloats: GiftOverlayFloat[] = [];
let cachedOverlayPending = new Map<string, GiftOverlayPendingBatch>();
let syncRevision = 0;

function emit(): void {
  syncRevision += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getShowcaseSnapshot(): GiftFulfillment[] {
  return cachedShowcase;
}

function getOverlaySnapshot(): GiftOverlayFloat[] {
  return cachedOverlayFloats;
}

function hasActiveOverlayFloat(stackKey: string): boolean {
  return cachedOverlayFloats.some((row) => row.stackKey === stackKey);
}

function queueGiftOverlayBurst(fulfillment: GiftFulfillment): void {
  const stackKey = giftOverlayStackKey(fulfillment.senderMemberId, fulfillment.giftId);
  const pending = cachedOverlayPending.get(stackKey);

  if (pending) {
    pending.hitCount += 1;
    pending.fulfillment = fulfillment;
    return;
  }

  cachedOverlayPending.set(stackKey, {
    hitCount: 1,
    fulfillment,
  });
}

function spawnGiftOverlayFloat(
  fulfillment: GiftFulfillment,
  nowMs: number,
  hitCount: number
): void {
  const stackKey = giftOverlayStackKey(fulfillment.senderMemberId, fulfillment.giftId);
  const spawnXPercent = pickGiftOverlaySpawnXPercent(
    cachedOverlayFloats.map((row) => row.spawnXPercent)
  );
  const spawnBottomPercent = pickGiftOverlaySpawnBottomPercent();

  cachedOverlayFloats = [
    {
      id: fulfillment.id + ':' + String(nowMs),
      stackKey,
      streamKey: fulfillment.streamKey,
      targetMemberId: fulfillment.targetMemberId,
      giftId: fulfillment.giftId,
      giftTier: fulfillment.giftTier,
      giftEmoji: fulfillment.giftEmoji,
      giftIconUrl: fulfillment.giftIconUrl ?? null,
      senderMemberId: fulfillment.senderMemberId,
      senderMemberName: fulfillment.senderMemberName,
      targetMemberName: fulfillment.targetMemberName,
      goonAmount: fulfillment.goonAmount,
      hitCount,
      spawnXPercent,
      spawnBottomPercent,
      phase: 'rise',
      phaseStartedAtMs: nowMs,
      createdAtMs: nowMs,
    },
    ...cachedOverlayFloats,
  ].slice(0, MAX_OVERLAY_FLOATS);
}

function flushPendingOverlayFloat(stackKey: string, nowMs: number): boolean {
  const pending = cachedOverlayPending.get(stackKey);

  if (!pending || hasActiveOverlayFloat(stackKey)) {
    return false;
  }

  cachedOverlayPending.delete(stackKey);
  spawnGiftOverlayFloat(pending.fulfillment, nowMs, pending.hitCount);
  return true;
}

function resolveOverlayFloatAtTime(
  float: GiftOverlayFloat,
  nowMs: number
): GiftOverlayFloat | null {
  const riseElapsed = nowMs - float.phaseStartedAtMs;

  if (riseElapsed < GIFT_OVERLAY_RISE_MS) {
    return float;
  }

  return null;
}

function ingestGiftOverlayBurst(fulfillment: GiftFulfillment, nowMs: number): void {
  const stackKey = giftOverlayStackKey(fulfillment.senderMemberId, fulfillment.giftId);

  if (hasActiveOverlayFloat(stackKey)) {
    queueGiftOverlayBurst(fulfillment);
    return;
  }

  spawnGiftOverlayFloat(fulfillment, nowMs, 1);
}

export function advanceGiftOverlayFloats(nowMs: number = Date.now()): void {
  let changed = false;
  const removedStackKeys: string[] = [];
  const nextFloats: GiftOverlayFloat[] = [];

  for (const float of cachedOverlayFloats) {
    const resolved = resolveOverlayFloatAtTime(float, nowMs);

    if (resolved === null) {
      changed = true;
      removedStackKeys.push(float.stackKey);
      continue;
    }

    if (resolved !== float) {
      changed = true;
    }

    nextFloats.push(resolved);
  }

  cachedOverlayFloats = nextFloats;

  for (const stackKey of removedStackKeys) {
    if (flushPendingOverlayFloat(stackKey, nowMs)) {
      changed = true;
    }
  }

  if (changed) {
    emit();
  }
}

export function useGiftShowcase(): GiftFulfillment[] {
  return useSyncExternalStore(subscribe, getShowcaseSnapshot, getShowcaseSnapshot);
}

export function useGiftOverlayFloats(streamKey?: string | null): GiftOverlayFloat[] {
  return useSyncExternalStore(subscribe, getOverlaySnapshot, getOverlaySnapshot).filter((row) => {
    if (!streamKey) {
      return true;
    }

    return row.streamKey === streamKey;
  });
}

/** @deprecated Use useGiftOverlayFloats */
export function useGiftOverlayBursts(streamKey?: string | null): GiftOverlayFloat[] {
  return useGiftOverlayFloats(streamKey);
}

export function enqueueGiftOverlayBurst(fulfillment: GiftFulfillment): void {
  ingestGiftOverlayBurst(fulfillment, Date.now());
  emit();
}

export function recordLocalGiftFulfillment(fulfillment: GiftFulfillment): void {
  cachedShowcase = [fulfillment, ...cachedShowcase.filter((row) => row.id !== fulfillment.id)].slice(
    0,
    40
  );
  enqueueGiftOverlayBurst(fulfillment);
}

export function recentGiftsForMember(memberId: string): GiftFulfillment[] {
  return cachedShowcase.filter((row) => row.targetMemberId === memberId);
}

export function recentGiftsForStream(streamKey: string): GiftFulfillment[] {
  return cachedShowcase.filter(
    (row) => row.targetType === 'stream' && row.streamKey === streamKey
  );
}

export async function syncGiftShowcase(input: {
  memberId?: string;
  streamKey?: string;
  limit?: number;
}): Promise<void> {
  if (!isGiftApiAvailable()) {
    return;
  }

  try {
    const gifts = await fetchRecentGifts(input);
    const existingIds = new Set(gifts.map((gift) => gift.id));

    cachedShowcase = [
      ...gifts,
      ...cachedShowcase.filter((gift) => !existingIds.has(gift.id)),
    ].slice(0, 40);

    emit();
  } catch {
    // Showcase sync is best-effort when the indexer is offline.
  }
}

export function buildLocalGiftFulfillment(input: {
  giftId: string;
  senderOwner: string;
  senderMemberId: string;
  senderMemberName: string;
  targetType: 'member' | 'stream';
  targetMemberId: string;
  targetMemberName: string;
  streamKey?: string | null;
  streamTitle?: string | null;
  txDigest?: string | null;
}): GiftFulfillment | null {
  const gift = resolveGiftCatalogEntry(input.giftId);

  if (!gift) {
    return null;
  }

  const now = Date.now();

  return {
    id: 'local-gift-' + now,
    intentId: 'local-intent-' + now,
    giftId: gift.id,
    giftLabel: gift.label,
    giftTier: gift.tier,
    giftEmoji: gift.emoji,
    giftIconUrl: gift.iconUrl ?? null,
    animationClass: gift.animationClass,
    senderOwner: input.senderOwner,
    senderMemberId: input.senderMemberId,
    senderMemberName: input.senderMemberName,
    targetType: input.targetType,
    targetMemberId: input.targetMemberId,
    targetMemberName: input.targetMemberName,
    streamKey: input.streamKey ?? null,
    streamTitle: input.streamTitle ?? null,
    channelOwnerMemberId: null,
    amountUsd: gift.priceUsd,
    goonAmount: gift.goonAmount,
    rail: 'goon_wallet',
    revenueSplit: {
      creatorPercent: 70,
      channelOwnerPercent: 0,
      platformPercent: 30,
      creatorAmountUsd: gift.priceUsd * 0.7,
      channelOwnerAmountUsd: 0,
      platformAmountUsd: gift.priceUsd * 0.3,
      channelOwnerRolledToPlatform: true,
    },
    txDigest: input.txDigest ?? null,
    createdAtMs: now,
  };
}

export function triggerMockStreamGift(input: {
  giftId: string;
  streamKey: string;
  targetMemberId: string;
  targetMemberName: string;
  senderMemberId?: string;
  senderMemberName?: string;
}): boolean {
  const gift = resolveGiftCatalogEntry(input.giftId);

  if (!gift) {
    return false;
  }

  const now = Date.now();
  const fulfillment: GiftFulfillment = {
    id: 'mock-stream-gift-' + now,
    intentId: 'mock-stream-intent-' + now,
    giftId: gift.id,
    giftLabel: gift.label,
    giftTier: gift.tier,
    giftEmoji: gift.emoji,
    giftIconUrl: gift.iconUrl ?? null,
    animationClass: gift.animationClass,
    senderOwner: 'mock-owner',
    senderMemberId: input.senderMemberId ?? 'mock-sender',
    senderMemberName: input.senderMemberName ?? 'Mock Viewer',
    targetType: 'stream',
    targetMemberId: input.targetMemberId,
    targetMemberName: input.targetMemberName,
    streamKey: input.streamKey,
    streamTitle: 'Mock live preview',
    channelOwnerMemberId: null,
    amountUsd: gift.priceUsd,
    goonAmount: gift.goonAmount,
    rail: 'goon_wallet',
    revenueSplit: {
      creatorPercent: 70,
      channelOwnerPercent: 0,
      platformPercent: 30,
      creatorAmountUsd: gift.priceUsd * 0.7,
      channelOwnerAmountUsd: 0,
      platformAmountUsd: gift.priceUsd * 0.3,
      channelOwnerRolledToPlatform: true,
    },
    txDigest: null,
    createdAtMs: now,
  };

  recordLocalGiftFulfillment(fulfillment);
  return true;
}

export function resetGiftStoreForTests(): void {
  cachedShowcase = [];
  cachedOverlayFloats = [];
  cachedOverlayPending = new Map();
  syncRevision = 0;
  emit();
}

export function getGiftOverlayPendingHitCountForTests(stackKey: string): number {
  return cachedOverlayPending.get(stackKey)?.hitCount ?? 0;
}

export function giftStoreRevision(): number {
  return syncRevision;
}

export function getGiftOverlayFloatsSnapshotForTests(): GiftOverlayFloat[] {
  return getOverlaySnapshot();
}

/** @deprecated Use getGiftOverlayFloatsSnapshotForTests */
export function getGiftOverlayBurstsSnapshotForTests(): GiftOverlayFloat[] {
  return getGiftOverlayFloatsSnapshotForTests();
}