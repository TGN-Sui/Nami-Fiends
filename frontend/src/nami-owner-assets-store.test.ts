import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  ownerAssetBadgeSlotId,
  ownerAssetNavSlotId,
  readOwnerAsset,
  resetOwnerAssetsForTests,
  saveOwnerAssets,
  validateOwnerAssetFile,
} from './nami-owner-assets-store.js';
const OFFICIAL_OWNER = '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca';
const SAMPLE_IMAGE = 'data:image/png;base64,AAAA';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

beforeEach(() => {
  const localStorage = createLocalStorageMock();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  });

  resetOwnerAssetsForTests();
});

afterEach(() => {
  window.localStorage.clear();
  resetOwnerAssetsForTests();
});

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

describe('saveOwnerAssets', () => {
  it('persists artwork for the official owner', async () => {
    await expect(
      saveOwnerAssets({ 'hub-sidebar-logo': SAMPLE_IMAGE }, OFFICIAL_OWNER)
    ).resolves.toBeNull();
    expect(readOwnerAsset('hub-sidebar-logo')).toBe(SAMPLE_IMAGE);
  });

  it('rejects saves from non-official owners', async () => {
    await expect(
      saveOwnerAssets({ 'hub-sidebar-logo': SAMPLE_IMAGE }, '0x1234')
    ).resolves.toBe('unauthorized');
    expect(readOwnerAsset('hub-sidebar-logo')).toBeNull();
  });
});