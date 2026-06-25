import { describe, expect, it } from 'vitest';

import { resolvePassportPlayerScore } from './player-star-display.js';
import { members } from './uiMockData.js';

describe('resolvePassportPlayerScore', () => {
  it('uses the live score when provided', () => {
    expect(resolvePassportPlayerScore(members[0]!, 72)).toBe(72);
  });

  it('falls back to a progression-based score when live score is missing', () => {
    const score = resolvePassportPlayerScore(members[0]!, null);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});