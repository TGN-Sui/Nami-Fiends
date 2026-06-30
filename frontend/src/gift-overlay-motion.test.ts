import { describe, expect, it } from 'vitest';

import {
  computeGiftOverlayMotionFrame,
  formatGiftOverlayHitCount,
  giftOverlayStackKey,
  GIFT_OVERLAY_RISE_MS,
  GIFT_OVERLAY_SPAWN_BOTTOM_MAX_PERCENT,
  GIFT_OVERLAY_SPAWN_BOTTOM_MIN_PERCENT,
  pickGiftOverlaySpawnBottomPercent,
  pickGiftOverlaySpawnXPercent,
  riseBottomPercent,
  riseOpacity,
} from './gift-overlay-motion.js';

describe('gift-overlay-motion', () => {
  it('builds stable stack keys per sender and gift', () => {
    expect(giftOverlayStackKey('m2', 'goon-fire')).toBe('m2:goon-fire');
  });

  it('rises linearly from a per-gift spawn anchor', () => {
    const spawnBottomPercent = 3;

    expect(riseBottomPercent(0, spawnBottomPercent)).toBeCloseTo(3, 1);
    expect(riseBottomPercent(GIFT_OVERLAY_RISE_MS / 2, spawnBottomPercent)).toBeGreaterThan(18);
    expect(riseBottomPercent(GIFT_OVERLAY_RISE_MS, spawnBottomPercent)).toBeCloseTo(37, 1);
  });

  it('fades out over the same timeline as the rise', () => {
    expect(riseOpacity(0)).toBe(1);
    expect(riseOpacity(GIFT_OVERLAY_RISE_MS / 2)).toBeCloseTo(0.5, 2);
    expect(riseOpacity(GIFT_OVERLAY_RISE_MS)).toBe(0);
  });

  it('formats stacked gift counts as multipliers', () => {
    expect(formatGiftOverlayHitCount(1)).toBeNull();
    expect(formatGiftOverlayHitCount(2)).toBe('x2');
    expect(formatGiftOverlayHitCount(4)).toBe('x4');
    expect(formatGiftOverlayHitCount(7)).toBe('x7');
  });

  it('keeps rise and fade in sync during the float', () => {
    const frame = computeGiftOverlayMotionFrame({
      spawnBottomPercent: 2,
      phaseStartedAtMs: 1_000,
      nowMs: 1_000 + GIFT_OVERLAY_RISE_MS / 2,
    });

    expect(frame.bottomPercent).toBeGreaterThan(18);
    expect(frame.opacity).toBeCloseTo(0.5, 2);
  });

  it('picks non-overlapping spawn positions when possible', () => {
    const first = pickGiftOverlaySpawnXPercent([]);
    const second = pickGiftOverlaySpawnXPercent([first]);

    expect(Math.abs(first - second)).toBeGreaterThan(10);
  });

  it('picks random bottom spawn anchors along the lower edge', () => {
    const samples = Array.from({ length: 12 }, () => pickGiftOverlaySpawnBottomPercent());

    expect(samples.some((value) => value > GIFT_OVERLAY_SPAWN_BOTTOM_MIN_PERCENT)).toBe(true);
    expect(samples.every((value) => value <= GIFT_OVERLAY_SPAWN_BOTTOM_MAX_PERCENT)).toBe(true);
    expect(samples.every((value) => value >= GIFT_OVERLAY_SPAWN_BOTTOM_MIN_PERCENT)).toBe(true);
  });
});