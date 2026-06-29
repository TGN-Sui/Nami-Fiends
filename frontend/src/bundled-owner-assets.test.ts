import { describe, expect, it } from 'vitest';

import {
  readBundledOwnerAssetUrl,
  TESTER_VISIBLE_OWNER_ASSET_SLOT_IDS,
} from './bundled-owner-assets.js';

describe('bundled-owner-assets', () => {
  it('ships bundled artwork for the official logo and sidebar nav slots', () => {
    expect(readBundledOwnerAssetUrl('sidebar-official-logo')).toBe(
      '/owner-assets/nami-official-logo.svg'
    );
    expect(readBundledOwnerAssetUrl('sidebar-nav-arcade')).toBe('/owner-assets/nav-arcade.svg');
    expect(readBundledOwnerAssetUrl('badge-default')).toBeNull();
    expect(TESTER_VISIBLE_OWNER_ASSET_SLOT_IDS).toContain('sidebar-nav-gamehub');
    expect(TESTER_VISIBLE_OWNER_ASSET_SLOT_IDS).toContain('sidebar-nav-radio');
  });
});