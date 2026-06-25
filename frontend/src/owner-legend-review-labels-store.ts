import { useSyncExternalStore } from 'react';

import { LEGEND_REVIEW_TIERS } from './legend-review-meter.js';

const STORAGE_KEY = 'nami.owner.legendReviewLabels';

export type OwnerLegendReviewLabels = {
  tier1: string;
  tier2: string;
  tier3: string;
  tier4: string;
  tier5: string;
  updatedAtMs: number;
};

const DEFAULT_LABELS: OwnerLegendReviewLabels = {
  tier1: LEGEND_REVIEW_TIERS[0]!.label,
  tier2: LEGEND_REVIEW_TIERS[1]!.label,
  tier3: LEGEND_REVIEW_TIERS[2]!.label,
  tier4: LEGEND_REVIEW_TIERS[3]!.label,
  tier5: LEGEND_REVIEW_TIERS[4]!.label,
  updatedAtMs: 0,
};

let cachedLabels: OwnerLegendReviewLabels | null = null;

function normalizeLabel(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? '';

  return trimmed || fallback;
}

function normalizeLabels(value: Partial<OwnerLegendReviewLabels> | null): OwnerLegendReviewLabels {
  if (!value) {
    return { ...DEFAULT_LABELS, updatedAtMs: Date.now() };
  }

  return {
    tier1: normalizeLabel(value.tier1, DEFAULT_LABELS.tier1),
    tier2: normalizeLabel(value.tier2, DEFAULT_LABELS.tier2),
    tier3: normalizeLabel(value.tier3, DEFAULT_LABELS.tier3),
    tier4: normalizeLabel(value.tier4, DEFAULT_LABELS.tier4),
    tier5: normalizeLabel(value.tier5, DEFAULT_LABELS.tier5),
    updatedAtMs: typeof value.updatedAtMs === 'number' ? value.updatedAtMs : Date.now(),
  };
}

function dispatchChange(): void {
  cachedLabels = null;
  window.dispatchEvent(new CustomEvent('nami-owner-legend-review-labels-changed'));
}

export function readOwnerLegendReviewLabels(): OwnerLegendReviewLabels {
  if (cachedLabels) {
    return cachedLabels;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedLabels = normalizeLabels(null);
      return cachedLabels;
    }

    cachedLabels = normalizeLabels(JSON.parse(stored) as Partial<OwnerLegendReviewLabels>);
    return cachedLabels;
  } catch {
    cachedLabels = normalizeLabels(null);
    return cachedLabels;
  }
}

export function saveOwnerLegendReviewLabels(
  patch: Partial<Pick<OwnerLegendReviewLabels, 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5'>>
): OwnerLegendReviewLabels {
  const current = readOwnerLegendReviewLabels();
  const next = normalizeLabels({
    ...current,
    ...patch,
    updatedAtMs: Date.now(),
  });

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cachedLabels = next;
  dispatchChange();

  return next;
}

export function ownerLegendReviewLabelList(
  labels: OwnerLegendReviewLabels = readOwnerLegendReviewLabels()
): [string, string, string, string, string] {
  return [labels.tier1, labels.tier2, labels.tier3, labels.tier4, labels.tier5];
}

function subscribe(listener: () => void): () => void {
  function onChange(): void {
    cachedLabels = null;
    listener();
  }

  window.addEventListener('nami-owner-legend-review-labels-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-owner-legend-review-labels-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useOwnerLegendReviewLabels(): OwnerLegendReviewLabels {
  return useSyncExternalStore(subscribe, readOwnerLegendReviewLabels, readOwnerLegendReviewLabels);
}

export function resetOwnerLegendReviewLabelsForTests(): void {
  cachedLabels = null;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}