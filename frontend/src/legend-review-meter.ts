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

export type LegendReviewLabelOverrides = readonly [
  string,
  string,
  string,
  string,
  string,
];

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

function buildLegendReviewTiers(labelOverrides?: LegendReviewLabelOverrides): LegendReviewTier[] {
  return LEGEND_REVIEW_TIERS.map((tier, index) => ({
    ...tier,
    label: labelOverrides?.[index]?.trim() || tier.label,
  }));
}

export function legendReviewTierForRating(
  rating: number,
  labelOverrides?: LegendReviewLabelOverrides
): LegendReviewTier {
  const rounded = Math.round(clampRating(rating));

  return (
    buildLegendReviewTiers(labelOverrides).find((tier) => tier.rating === rounded) ??
    buildLegendReviewTiers(labelOverrides)[0]!
  );
}

export function resolveLegendReviewMeter(
  rating: number,
  labelOverrides?: LegendReviewLabelOverrides
): LegendReviewMeterDisplay {
  const clamped = clampRating(rating);
  const tier = legendReviewTierForRating(clamped, labelOverrides);
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

export function legendReviewPickerOptions(
  labelOverrides?: LegendReviewLabelOverrides
): readonly LegendReviewTier[] {
  return buildLegendReviewTiers(labelOverrides);
}