import { describe, expect, it } from 'vitest';

import {
  giftCatalogEntry,
  giftTierLabel,
  giftsForTier,
  OFFICIAL_GIFT_CATALOG,
} from './gift-catalog.js';

describe('gift-catalog', () => {
  it('lists eight gifts across three tiers', () => {
    expect(OFFICIAL_GIFT_CATALOG).toHaveLength(8);
    expect(giftsForTier('common')).toHaveLength(3);
    expect(giftsForTier('rare')).toHaveLength(3);
    expect(giftsForTier('legendary')).toHaveLength(2);
  });

  it('resolves catalog entries and tier labels', () => {
    const gift = giftCatalogEntry('goon-mega');

    expect(gift?.tier).toBe('legendary');
    expect(gift?.goonAmount).toBe(500);
    expect(giftTierLabel('rare')).toBe('Rare');
  });

  it('assigns animation classes per gift tier family', () => {
    const classes = OFFICIAL_GIFT_CATALOG.map((entry) => entry.animationClass);

    expect(classes).toContain('gift-burst-common');
    expect(classes).toContain('gift-sparkle-legendary');
    expect(classes.every((value) => value.startsWith('gift-'))).toBe(true);
  });
});