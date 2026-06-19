import { describe, expect, it } from 'vitest';

import {
  BOOST_RESET_TIME_ZONE,
  formatBoostCycleResetAt,
  getBoostCycleId,
  getBoostCycleStartMs,
  getNextBoostCycleResetMs,
  zonedLocalTimeToUtcMs,
} from './boost-cycle.js';

describe('boost-cycle', () => {
  it('maps Chicago Friday noon to a stable weekly cycle id', () => {
    const fridayAfterReset = new Date(
      zonedLocalTimeToUtcMs(2026, 6, 19, 15, 30, 0, BOOST_RESET_TIME_ZONE),
    );
    const cycleStart = getBoostCycleStartMs(fridayAfterReset);
    const expectedStart = zonedLocalTimeToUtcMs(2026, 6, 19, 12, 0, 0, BOOST_RESET_TIME_ZONE);

    expect(cycleStart).toBe(expectedStart);
    expect(getBoostCycleId(fridayAfterReset)).toBe(expectedStart);
    expect(getNextBoostCycleResetMs(fridayAfterReset)).toBe(expectedStart + 7 * 86_400_000);
  });

  it('uses the previous Friday before the weekly reset moment', () => {
    const fridayBeforeReset = new Date(
      zonedLocalTimeToUtcMs(2026, 6, 19, 11, 30, 0, BOOST_RESET_TIME_ZONE),
    );
    const cycleStart = getBoostCycleStartMs(fridayBeforeReset);
    const expectedStart = zonedLocalTimeToUtcMs(2026, 6, 12, 12, 0, 0, BOOST_RESET_TIME_ZONE);

    expect(cycleStart).toBe(expectedStart);
  });

  it('formats reset timestamps for an arbitrary viewer timezone', () => {
    const resetMs = zonedLocalTimeToUtcMs(2026, 6, 19, 12, 0, 0, BOOST_RESET_TIME_ZONE);
    const label = formatBoostCycleResetAt(resetMs, 'America/New_York', 'en-US');

    expect(label).toContain('Friday');
    expect(label).toContain('2026');
  });
});