import { describe, expect, it } from 'vitest';

import {
  arcadeCountdownWarningScale,
  ARCADE_COUNTDOWN_WARNING_MS,
  isArcadeCountdownWarning,
} from './arcade-countdown-ui.js';

describe('arcade-countdown-ui', () => {
  it('ramps warning scale as time runs out', () => {
    expect(arcadeCountdownWarningScale(ARCADE_COUNTDOWN_WARNING_MS + 1)).toBe(1);
    expect(arcadeCountdownWarningScale(5_000)).toBeCloseTo(1.32, 2);
    expect(arcadeCountdownWarningScale(1_000)).toBeCloseTo(1.51, 2);
  });

  it('flags the final ten seconds as warning state', () => {
    expect(isArcadeCountdownWarning(11_000)).toBe(false);
    expect(isArcadeCountdownWarning(10_000)).toBe(true);
    expect(isArcadeCountdownWarning(0)).toBe(false);
  });
});