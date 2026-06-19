import { describe, expect, it } from 'vitest';

import { interpolateSpotlight } from './nami-spotlight-motion.js';

describe('interpolateSpotlight', () => {
  it('starts at the first waypoint', () => {
    const point = interpolateSpotlight(0);

    expect(point.x).toBe(20);
    expect(point.y).toBe(18);
  });

  it('loops back to the first waypoint', () => {
    const point = interpolateSpotlight(1);

    expect(point.x).toBe(20);
    expect(point.y).toBe(18);
  });

  it('visits the second waypoint near the quarter mark', () => {
    const point = interpolateSpotlight(0.25);

    expect(point.x).toBe(76);
    expect(point.y).toBe(22);
  });
});