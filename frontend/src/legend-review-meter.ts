export const LEGEND_REVIEW_MAX_RATING = 5;

export type LegendReviewTier = {
  rating: number;
  label: string;
  fillPercent: number;
};

export const LEGEND_REVIEW_TIERS: readonly LegendReviewTier[] = [
  { rating: 1, label: 'Skip', fillPercent: 20 },
  { rating: 2, label: 'Mixed', fillPercent: 40 },
  { rating: 3, label: 'Solid', fillPercent: 60 },
  { rating: 4, label: 'Standout', fillPercent: 80 },
  { rating: 5, label: 'Legend', fillPercent: 100 },
] as const;

export type LegendReviewMeterDisplay = {
  rating: number;
  label: string;
  fillPercent: number;
  isLegend: boolean;
  ariaLabel: string;
};

function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) {
    return 1;
  }

  return Math.max(1, Math.min(LEGEND_REVIEW_MAX_RATING, rating));
}

export function legendReviewTierForRating(rating: number): LegendReviewTier {
  const rounded = Math.round(clampRating(rating));

  return LEGEND_REVIEW_TIERS.find((tier) => tier.rating === rounded) ?? LEGEND_REVIEW_TIERS[0]!;
}

export function resolveLegendReviewMeter(rating: number): LegendReviewMeterDisplay {
  const clamped = clampRating(rating);
  const tier = legendReviewTierForRating(clamped);
  const fillPercent = Math.round((clamped / LEGEND_REVIEW_MAX_RATING) * 100);
  const isLegend = Math.round(clamped) === LEGEND_REVIEW_MAX_RATING;

  return {
    rating: clamped,
    label: tier.label,
    fillPercent,
    isLegend,
    ariaLabel: tier.label + ' recommendation (' + clamped.toFixed(1) + ' of ' + LEGEND_REVIEW_MAX_RATING + ')',
  };
}

export function legendReviewPickerOptions(): readonly LegendReviewTier[] {
  return LEGEND_REVIEW_TIERS;
}