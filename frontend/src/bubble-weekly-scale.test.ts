import { describe, expect, it } from 'vitest';

import {
  gameBubbleScaleFromBoostPower,
  genreBubbleScaleFromWeeklyChatters,
} from './bubble-weekly-scale.js';

describe('bubble-weekly-scale', () => {
  it('grows game bubble scale in small steps as boost power accumulates', () => {
    expect(gameBubbleScaleFromBoostPower(0)).toBe(1);
    expect(gameBubbleScaleFromBoostPower(1)).toBeCloseTo(1.008, 4);
    expect(gameBubbleScaleFromBoostPower(6)).toBeCloseTo(1.048, 4);
  });

  it('caps game bubble growth for the week', () => {
    expect(gameBubbleScaleFromBoostPower(10_000)).toBeCloseTo(1.35, 4);
  });

  it('grows genre bubble scale from weekly active chatters', () => {
    expect(genreBubbleScaleFromWeeklyChatters(0)).toBe(1);
    expect(genreBubbleScaleFromWeeklyChatters(5)).toBeCloseTo(1.06, 4);
    expect(genreBubbleScaleFromWeeklyChatters(10_000)).toBeCloseTo(1.4, 4);
  });
});