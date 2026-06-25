import { describe, expect, it } from 'vitest';

import {
  legendReviewTierForRating,
  LEGEND_REVIEW_TIERS,
  resolveLegendReviewMeter,
} from './legend-review-meter.js';

describe('legend-review-meter', () => {
  it('maps ratings to legend tiers instead of star counts', () => {
    expect(legendReviewTierForRating(1).label).toBe('Skip');
    expect(legendReviewTierForRating(3).label).toBe('Solid');
    expect(legendReviewTierForRating(5).label).toBe('Legend');
    expect(LEGEND_REVIEW_TIERS).toHaveLength(5);
  });

  it('renders a horizontal fill percentage for fractional averages', () => {
    const meter = resolveLegendReviewMeter(4.2);

    expect(meter.fillPercent).toBe(84);
    expect(meter.label).toBe('Standout');
    expect(meter.isLegend).toBe(false);
  });

  it('marks max recommendations as legend tier', () => {
    const meter = resolveLegendReviewMeter(5);

    expect(meter.fillPercent).toBe(100);
    expect(meter.isLegend).toBe(true);
    expect(meter.ariaLabel).toContain('Legend');
  });
});