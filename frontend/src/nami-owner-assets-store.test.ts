import { describe, expect, it } from 'vitest';

import {
  ownerAssetBadgeSlotId,
  ownerAssetNavSlotId,
  validateOwnerAssetFile,
} from './nami-owner-assets-store.js';

describe('ownerAssetNavSlotId', () => {
  it('maps nav pages to stable sidebar asset slot ids', () => {
    expect(ownerAssetNavSlotId('messages')).toBe('sidebar-nav-messages');
    expect(ownerAssetNavSlotId('settings')).toBe('sidebar-nav-settings');
  });
});

describe('ownerAssetBadgeSlotId', () => {
  it('maps badge names to stable asset slot ids', () => {
    expect(ownerAssetBadgeSlotId('First Quest')).toBe('badge-first-quest');
    expect(ownerAssetBadgeSlotId('Raid Captain')).toBe('badge-raid-captain');
  });
});

describe('validateOwnerAssetFile', () => {
  it('rejects unsupported mime types', () => {
    const file = {
      type: 'image/svg+xml',
      size: 1200,
    } as File;

    expect(validateOwnerAssetFile(file, 'badge')).toMatch(/PNG, JPG, WebP, or GIF/);
  });
});