import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SELF_MEMBER_ID } from './member-access.js';
import {
  readEmbeddedFeedLinks,
  saveEmbeddedFeedLinks,
  updateEmbeddedFeedLink,
} from './embedded-feed-preferences.js';
import { readEmbeddedFeedEnabled, saveEmbeddedFeedEnabled } from './surface-preferences.js';

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

function createWindowMock(): Window & typeof globalThis {
  const localStorage = createLocalStorageMock();

  return {
    localStorage,
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    location: { hostname: 'localhost' },
  } as Window & typeof globalThis;
}

describe('embedded-feed-preferences member isolation', () => {
  beforeEach(() => {
    vi.stubGlobal('window', createWindowMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps member feed links isolated per member', () => {
    updateEmbeddedFeedLink('member', 0, { handle: 'my-twitch', title: 'My Stream' }, SELF_MEMBER_ID);
    updateEmbeddedFeedLink('member', 0, { handle: 'other-twitch', title: 'Other Stream' }, 'm9');

    const selfLinks = readEmbeddedFeedLinks('member', SELF_MEMBER_ID);
    const otherLinks = readEmbeddedFeedLinks('member', 'm9');

    expect(selfLinks[0]?.handle).toBe('my-twitch');
    expect(selfLinks[0]?.title).toBe('My Stream');
    expect(otherLinks[0]?.handle).toBe('other-twitch');
    expect(otherLinks[0]?.title).toBe('Other Stream');
  });

  it('does not leak saved links across member profiles', () => {
    saveEmbeddedFeedLinks(
      'member',
      [
        {
          platform: 'twitch',
          title: 'Robbos Live',
          handle: 'robbos',
          previewUrl: 'https://www.twitch.tv/robbos',
          live: true,
        },
      ],
      SELF_MEMBER_ID
    );

    const otherMemberLinks = readEmbeddedFeedLinks('member', 'm2');

    expect(otherMemberLinks[0]?.handle).not.toBe('robbos');
    expect(otherMemberLinks[0]?.handle).toBe('twitch');
  });

  it('migrates legacy global member links to the self member only', () => {
    window.localStorage.setItem(
      'nami.embedded-feed.links.member',
      JSON.stringify([{ platform: 'twitch', title: 'Legacy', handle: 'legacy-channel' }])
    );

    const selfLinks = readEmbeddedFeedLinks('member', SELF_MEMBER_ID);
    const otherLinks = readEmbeddedFeedLinks('member', 'm2');

    expect(selfLinks[0]?.handle).toBe('legacy-channel');
    expect(otherLinks[0]?.handle).toBe('twitch');
    expect(window.localStorage.getItem('nami.embedded-feed.links.member')).toBeNull();
    expect(window.localStorage.getItem('nami.embedded-feed.links.member.' + SELF_MEMBER_ID)).not.toBeNull();
  });

  it('keeps member feed enabled state isolated per member', () => {
    saveEmbeddedFeedEnabled('member', true, SELF_MEMBER_ID);
    saveEmbeddedFeedEnabled('member', false, 'm9');

    expect(readEmbeddedFeedEnabled('member', SELF_MEMBER_ID)).toBe(true);
    expect(readEmbeddedFeedEnabled('member', 'm9')).toBe(false);
  });

  it('migrates legacy global member feed enabled flag to the self member', () => {
    window.localStorage.setItem('nami.embedded-feed.member', 'true');

    expect(readEmbeddedFeedEnabled('member', SELF_MEMBER_ID)).toBe(true);
    expect(readEmbeddedFeedEnabled('member', 'm9')).toBe(false);
    expect(window.localStorage.getItem('nami.embedded-feed.member')).toBeNull();
  });
});