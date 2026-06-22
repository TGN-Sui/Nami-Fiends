import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  saveChannelOwnerProfileEdits,
  saveChannelOwnerTagline,
  withChannelOwnerProfile,
} from './channel-owner-profile-store.js';
import type { NamiChannel } from './uiMockData.js';

const channel: NamiChannel = {
  id: 'channel-genre-test',
  name: 'Genre Test Game',
  handle: '@genretest',
  tagline: 'Test tagline',
  genre: 'Indie',
  platforms: ['PC'],
  officialBadges: [],
  memberCount: 0,
  boostPower: 0,
  isVerified: true,
  isLive: false,
  coverUrl: '',
  logoUrl: '',
};

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

describe('channel-owner-profile-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('applies saved genre tags to the channel profile', () => {
    saveChannelOwnerProfileEdits(channel.id, {
      platforms: ['PC', 'Mobile'],
      genres: ['Shooter', 'Indie'],
    });

    const updated = withChannelOwnerProfile(channel);

    expect(updated.genre).toBe('Shooter / Indie');
    expect(updated.platforms).toEqual(['PC', 'Mobile']);
  });

  it('applies saved game descriptions to the channel profile', () => {
    saveChannelOwnerTagline(channel.id, channel, 'A tactical roguelike with weekly raids.');

    const updated = withChannelOwnerProfile(channel);

    expect(updated.tagline).toBe('A tactical roguelike with weekly raids.');
  });
});