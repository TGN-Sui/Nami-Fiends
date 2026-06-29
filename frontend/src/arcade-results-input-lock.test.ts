import { describe, expect, it } from 'vitest';

import { ARCADE_RESULTS_INPUT_LOCK_MS } from './arcade-results-input-lock.js';

describe('arcade-results-input-lock', () => {
  it('uses a one-second cooldown so end-of-run clicks do not skip results', () => {
    expect(ARCADE_RESULTS_INPUT_LOCK_MS).toBeGreaterThanOrEqual(1_000);
    expect(ARCADE_RESULTS_INPUT_LOCK_MS).toBeLessThanOrEqual(1_500);
  });
});