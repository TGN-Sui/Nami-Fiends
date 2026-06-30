import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  computeGiftRevenueSplit,
  findGiftCatalogEntry,
  getGiftCatalog,
  OFFICIAL_GIFT_CATALOG,
} from './gift-payments.service.js';

describe('gift-payments.service', () => {
  it('exposes eight tiered gifts across common, rare, and legendary', async () => {
    const catalog = await getGiftCatalog();

    assert.equal(catalog.length, 8);
    assert.deepEqual(
      [...new Set(catalog.map((entry) => entry.tier))].sort(),
      ['common', 'legendary', 'rare']
    );
    assert.equal(catalog.filter((entry) => entry.tier === 'common').length, 3);
    assert.equal(catalog.filter((entry) => entry.tier === 'rare').length, 3);
    assert.equal(catalog.filter((entry) => entry.tier === 'legendary').length, 2);
  });

  it('looks up catalog entries by id', async () => {
    const entry = await findGiftCatalogEntry('goon-fire');

    assert.ok(entry);
    assert.equal(entry?.label, 'Goon Fire');
    assert.equal(entry?.priceUsd, 5);
    assert.equal(entry?.goonAmount, 50);
  });

  it('computes default 70/20/10 revenue split when a channel owner is present', () => {
    const split = computeGiftRevenueSplit(10, true);

    assert.equal(split.creatorPercent, 70);
    assert.equal(split.channelOwnerPercent, 20);
    assert.equal(split.platformPercent, 10);
    assert.equal(split.creatorAmountUsd, 7);
    assert.equal(split.channelOwnerAmountUsd, 2);
    assert.equal(split.platformAmountUsd, 1);
    assert.equal(split.channelOwnerRolledToPlatform, false);
  });

  it('rolls channel-owner share into platform for profile-only gifts', () => {
    const split = computeGiftRevenueSplit(10, false);

    assert.equal(split.creatorPercent, 70);
    assert.equal(split.channelOwnerPercent, 0);
    assert.equal(split.platformPercent, 30);
    assert.equal(split.creatorAmountUsd, 7);
    assert.equal(split.channelOwnerAmountUsd, 0);
    assert.equal(split.platformAmountUsd, 3);
    assert.equal(split.channelOwnerRolledToPlatform, true);
  });

  it('keeps animation classes unique per tier family', () => {
    const classes = OFFICIAL_GIFT_CATALOG.map((entry) => entry.animationClass);

    assert.ok(classes.every((value) => value.startsWith('gift-')));
    assert.ok(classes.includes('gift-burst-legendary'));
    assert.ok(classes.includes('gift-sparkle-common'));
  });
});