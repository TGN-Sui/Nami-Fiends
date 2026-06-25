import { beforeEach, describe, expect, it, vi } from 'vitest';

import { legendReviewTierForRating } from './legend-review-meter.js';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();

  vi.stubGlobal('window', {
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => undefined,
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    },
  });
});

describe('owner-legend-review-labels-store', () => {
  it('persists custom tier labels for the legend review meter', async () => {
    const { saveOwnerLegendReviewLabels, ownerLegendReviewLabelList } = await import(
      './owner-legend-review-labels-store.js'
    );

    saveOwnerLegendReviewLabels({
      tier1: 'Pass',
      tier2: 'Maybe',
      tier3: 'Good',
      tier4: 'Great',
      tier5: 'Mythic',
    });

    const labels = ownerLegendReviewLabelList();
    expect(labels).toEqual(['Pass', 'Maybe', 'Good', 'Great', 'Mythic']);
    expect(legendReviewTierForRating(5, labels).label).toBe('Mythic');
  });
});