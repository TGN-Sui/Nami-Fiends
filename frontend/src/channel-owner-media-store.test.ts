// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resetChannelMediaDiskForTests,
  resetChannelMediaPersistenceForTests,
} from './channel-media-persistence.js';
import {
  CHANNEL_MEDIA_REF_PREFIX,
  externalizePromotionCoverUrl,
  PARTNER_CAROUSEL_COVER_PREFIX,
  readChannelTrailerOverride,
  resolveChannelMediaRef,
  saveChannelTrailerOverride,
} from './channel-owner-media-store.js';

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

describe('channel-owner-media-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      URL: globalThis.URL,
    });
    resetChannelMediaDiskForTests();
    resetChannelMediaPersistenceForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetChannelMediaDiskForTests();
    resetChannelMediaPersistenceForTests();
  });

  it('stores trailers as blobs instead of localStorage data URLs', async () => {
    const channelId = 'owner-game-suuuisplash-mqpgrj9o';
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'splash.mp4', { type: 'video/mp4' });

    await saveChannelTrailerOverride(channelId, file);

    const trailerUrl = readChannelTrailerOverride(channelId);

    expect(trailerUrl).toMatch(/^blob:/);
    expect(window.localStorage.getItem('nami.channel.trailer.' + channelId)).toBeNull();
  });

  it('restores trailer media after memory cache reset', async () => {
    const channelId = 'owner-game-suuuisplash-mqpgrj9o';
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'splash.mp4', { type: 'video/mp4' });

    await saveChannelTrailerOverride(channelId, file);
    resetChannelMediaPersistenceForTests();

    const { bootstrapChannelMediaPersistence } = await import('./channel-media-persistence.js');
    await bootstrapChannelMediaPersistence();

    const restored = readChannelTrailerOverride(channelId);
    expect(typeof restored).toBe('string');
    expect(restored).toMatch(/^blob:/);
  });

  it('resolves channel media references for partner banner covers', async () => {
    const channelId = 'owner-game-suuuisplash-mqpgrj9o';
    const dataUrl = 'data:image/png;base64,aaabbbccc';

    const ref = await externalizePromotionCoverUrl(
      channelId,
      dataUrl,
      PARTNER_CAROUSEL_COVER_PREFIX,
    );

    expect(ref.startsWith(CHANNEL_MEDIA_REF_PREFIX)).toBe(true);
    expect(resolveChannelMediaRef(ref)).toBe(dataUrl);
  });
});