import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_OFFICIAL_GIFT_CATALOG,
  mergeGiftCatalog,
} from './gift-catalog.service.js';

describe('gift-catalog.service', () => {
  it('merges owner overrides onto default catalog entries', () => {
    const merged = mergeGiftCatalog([
      {
        id: 'goon-pop',
        label: 'Custom Pop',
        tier: 'common',
        emoji: '🎈',
        iconUrl: 'https://cdn.example/gift-pop.png',
        priceUsd: 2,
        goonAmount: 20,
        animationClass: 'gift-burst-common',
        enabled: true,
      },
    ]);

    const pop = merged.find((entry) => entry.id === 'goon-pop');

    assert.ok(pop);
    assert.equal(pop?.label, 'Custom Pop');
    assert.equal(pop?.goonAmount, 20);
    assert.equal(pop?.priceUsd, 2);
    assert.equal(pop?.iconUrl, 'https://cdn.example/gift-pop.png');
    assert.equal(merged.length, 8);
  });

  it('keeps defaults when no overrides exist', () => {
    const merged = mergeGiftCatalog([]);

    assert.equal(merged.length, DEFAULT_OFFICIAL_GIFT_CATALOG.length);
    assert.equal(merged[0]?.id, 'goon-pop');
  });
});