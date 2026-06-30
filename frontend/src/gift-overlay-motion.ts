export const GIFT_OVERLAY_RISE_MS = 3_200;

export const GIFT_OVERLAY_SPAWN_BOTTOM_MIN_PERCENT = -2;
export const GIFT_OVERLAY_SPAWN_BOTTOM_MAX_PERCENT = 5;
export const GIFT_OVERLAY_RISE_DISTANCE_PERCENT = 34;

/** @deprecated Hold/exit phases removed — kept for older imports during migration. */
export const GIFT_OVERLAY_HOLD_AFTER_LAST_MS = 0;
/** @deprecated Hold/exit phases removed — kept for older imports during migration. */
export const GIFT_OVERLAY_EXIT_MS = 0;
/** @deprecated Use per-float spawn bottom — kept for older imports during migration. */
export const GIFT_OVERLAY_BASE_BOTTOM_PERCENT = GIFT_OVERLAY_SPAWN_BOTTOM_MIN_PERCENT;

export type GiftOverlayPhase = 'rise';

export function formatGiftOverlayHitCount(hitCount: number): string | null {
  if (hitCount <= 1) {
    return null;
  }

  return 'x' + String(hitCount);
}

export function giftOverlayStackKey(senderMemberId: string, giftId: string): string {
  return senderMemberId + ':' + giftId;
}

export function pickGiftOverlaySpawnXPercent(occupied: number[]): number {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = 14 + Math.random() * 72;

    if (!occupied.some((value) => Math.abs(value - candidate) < 16)) {
      return candidate;
    }
  }

  return 14 + Math.random() * 72;
}

export function pickGiftOverlaySpawnBottomPercent(): number {
  const span = GIFT_OVERLAY_SPAWN_BOTTOM_MAX_PERCENT - GIFT_OVERLAY_SPAWN_BOTTOM_MIN_PERCENT;

  return GIFT_OVERLAY_SPAWN_BOTTOM_MIN_PERCENT + Math.random() * span;
}

export function riseBottomPercent(elapsedMs: number, spawnBottomPercent: number): number {
  const progress = Math.max(0, Math.min(1, elapsedMs / GIFT_OVERLAY_RISE_MS));

  return spawnBottomPercent + progress * GIFT_OVERLAY_RISE_DISTANCE_PERCENT;
}

export function riseOpacity(elapsedMs: number): number {
  const progress = Math.max(0, Math.min(1, elapsedMs / GIFT_OVERLAY_RISE_MS));

  return 1 - progress;
}

export type GiftOverlayMotionFrame = {
  bottomPercent: number;
  opacity: number;
};

export function computeGiftOverlayMotionFrame(input: {
  spawnBottomPercent: number;
  phaseStartedAtMs: number;
  nowMs: number;
}): GiftOverlayMotionFrame {
  const elapsed = Math.max(0, input.nowMs - input.phaseStartedAtMs);

  return {
    bottomPercent: riseBottomPercent(elapsed, input.spawnBottomPercent),
    opacity: riseOpacity(elapsed),
  };
}