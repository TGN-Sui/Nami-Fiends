import { describe, expect, it } from 'vitest';

import { resolvePlayerStarDisplay } from './player-star-display.js';

describe('player-star-display', () => {
  it('maps 0–20 to one star', () => {
    expect(resolvePlayerStarDisplay(0).filledStars).toBe(1);
    expect(resolvePlayerStarDisplay(20).filledStars).toBe(1);
    expect(resolvePlayerStarDisplay(0).isFoil).toBe(false);
  });

  it('steps up every 20 points through five stars', () => {
    expect(resolvePlayerStarDisplay(21).filledStars).toBe(2);
    expect(resolvePlayerStarDisplay(41).filledStars).toBe(3);
    expect(resolvePlayerStarDisplay(61).filledStars).toBe(4);
    expect(resolvePlayerStarDisplay(81).filledStars).toBe(5);
    expect(resolvePlayerStarDisplay(99).filledStars).toBe(5);
    expect(resolvePlayerStarDisplay(99).isFoil).toBe(false);
  });

  it('renders foil at max score', () => {
    const display = resolvePlayerStarDisplay(100);

    expect(display.isFoil).toBe(true);
    expect(display.filledStars).toBe(5);
    expect(display.label).toContain('Foil');
  });

  it('clamps invalid values', () => {
    expect(resolvePlayerStarDisplay(-5).score).toBe(0);
    expect(resolvePlayerStarDisplay(140).score).toBe(100);
    expect(resolvePlayerStarDisplay(Number.NaN).score).toBe(0);
  });
});