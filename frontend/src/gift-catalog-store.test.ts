import { describe, expect, it } from 'vitest';

import { OFFICIAL_GIFT_CATALOG } from './gift-catalog.js';
import {
  readGiftCatalogSnapshot,
  resetGiftCatalogStoreForTests,
  resolveGiftCatalogEntry,
  setGiftCatalogSnapshot,
} from './gift-catalog-store.js';

describe('gift-catalog-store', () => {
  it('resolves entries from the hydrated snapshot', () => {
    resetGiftCatalogStoreForTests();

    setGiftCatalogSnapshot([
      {
        ...OFFICIAL_GIFT_CATALOG[0]!,
        label: 'Owner Pop',
        goonAmount: 99,
        iconUrl: 'https://cdn.example/pop.png',
      },
    ]);

    const entry = resolveGiftCatalogEntry('goon-pop');

    expect(entry?.label).toBe('Owner Pop');
    expect(entry?.goonAmount).toBe(99);
    expect(entry?.iconUrl).toBe('https://cdn.example/pop.png');
    expect(readGiftCatalogSnapshot()).toHaveLength(1);
  });
});