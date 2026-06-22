import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPersistedOwnerSettingsDraft,
  commitOwnerSettings,
  discardOwnerSettingsDraft,
  ensureOwnerSettingsDraft,
  isOwnerSettingsDirty,
  resetOwnerSettingsDraftStoreForTests,
  updateOwnerSettingsDraft,
} from './channel-owner-settings-draft.js';
import { readChannelOwnerProfileEdits } from './channel-owner-profile-store.js';
import { readOwnerBrandPalette } from './channel-owner-brand-palette.js';

import { readChannelBannerContent } from './channel-banner-notifications-store.js';
import { channels } from './uiMockData.js';

const channel = channels[0]!;

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

describe('channel-owner-settings-draft', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetOwnerSettingsDraftStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetOwnerSettingsDraftStoreForTests();
  });

  it('tracks dirty state for text edits', () => {
    ensureOwnerSettingsDraft(channel);
    expect(isOwnerSettingsDirty(channel.id)).toBe(false);

    updateOwnerSettingsDraft(channel.id, {
      superBanner: { headline: 'New headline' },
    });

    expect(isOwnerSettingsDirty(channel.id)).toBe(true);
  });

  it('commits drafts to persisted stores', () => {
    ensureOwnerSettingsDraft(channel);

    updateOwnerSettingsDraft(channel.id, {
      platforms: ['PC', 'Mobile'],
      brandPalette: ['#111111', '#222222', '#333333', '#444444'],
      superBanner: { headline: 'Launch week', body: 'Play now' },
      partnerCarousel: { title: 'Partner title', description: 'Partner copy' },
      bannerEditor: { headline: 'Alert headline', body: 'Alert body' },
    });

    const result = commitOwnerSettings(channel);

    expect(result.ok).toBe(true);
    expect(isOwnerSettingsDirty(channel.id)).toBe(false);
    expect(readChannelOwnerProfileEdits(channel.id)?.platforms).toEqual(['PC', 'Mobile']);
    expect(readOwnerBrandPalette()).toEqual(['#111111', '#222222', '#333333', '#444444']);
    expect(readChannelBannerContent(channel.id, channel).headline).toBe('Alert headline');
    expect(ensureOwnerSettingsDraft(channel).superBanner.headline).toBe('Launch week');
    expect(ensureOwnerSettingsDraft(channel).partnerCarousel.title).toBe('Partner title');
  });

  it('discards unsaved draft changes', () => {
    const persisted = buildPersistedOwnerSettingsDraft(channel);
    ensureOwnerSettingsDraft(channel);

    updateOwnerSettingsDraft(channel.id, {
      partnerCarousel: { title: 'Temporary title' },
    });

    discardOwnerSettingsDraft(channel);

    expect(isOwnerSettingsDirty(channel.id)).toBe(false);
    expect(ensureOwnerSettingsDraft(channel).partnerCarousel.title).toBe(
      persisted.partnerCarousel.title,
    );
  });

  it('requires at least one platform on commit', () => {
    ensureOwnerSettingsDraft(channel);
    updateOwnerSettingsDraft(channel.id, { platforms: [] });

    const result = commitOwnerSettings(channel);

    expect(result.ok).toBe(false);
    expect(isOwnerSettingsDirty(channel.id)).toBe(true);
  });
});