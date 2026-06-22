import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';

vi.mock('./nami-capabilities.js', () => ({
  isOfficialOwner: (owner: string | null) => owner?.toLowerCase() === OFFICIAL_OWNER,
}));

vi.mock('./member-access.js', () => ({
  readSignedInOwner: () => OFFICIAL_OWNER,
}));

vi.mock('./surface-preferences.js', () => ({
  readViewingAsChannelOwner: () => false,
}));

vi.mock('./game-owner-session-store.js', () => ({
  readGameOwnerSession: () => null,
}));

import { resolveChannelById } from './channel-owner-access.js';
import {
  createOwnerProvisionedChannel,
  resetOwnerProvisionedChannelsStoreForTests,
} from './owner-provisioned-channels-store.js';
import {
  readSubscribedChannelIds,
  readSubscribedChannels,
  saveSubscribedChannelIds,
  subscribeToChannel,
} from './subscriptions-store.js';

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

describe('subscriptions-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetOwnerProvisionedChannelsStoreForTests();
    window.localStorage.removeItem('nami.user.subscriptions');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts with no default subscriptions', () => {
    expect(readSubscribedChannelIds()).toEqual([]);
    expect(readSubscribedChannels()).toEqual([]);
  });

  it('resolves owner-provisioned channel subscriptions for profile display', () => {
    const created = createOwnerProvisionedChannel(
      {
        gameTitle: 'SUUUISPLASH',
        handle: 'suuuisplash',
        genre: 'Platform',
        platforms: ['PC'],
      },
      OFFICIAL_OWNER
    );

    expect(created.ok).toBe(true);

    const channelId = created.channel!.channelId;
    saveSubscribedChannelIds([channelId]);

    const subscribed = readSubscribedChannels();

    expect(subscribed).toHaveLength(1);
    expect(subscribed[0]?.id).toBe(channelId);
    expect(subscribed[0]?.name).toBe('SUUUISPLASH');
    expect(resolveChannelById(channelId)?.name).toBe('SUUUISPLASH');
  });

  it('records subscriptions to owner-provisioned channels', () => {
    const created = createOwnerProvisionedChannel(
      {
        gameTitle: 'Splash Quest',
        handle: 'splashquest',
        genre: 'Adventure',
        platforms: ['PC'],
      },
      OFFICIAL_OWNER
    );

    const channelId = created.channel!.channelId;
    const result = subscribeToChannel(channelId, 'Elite');

    expect(result).toEqual({ ok: true });
    expect(readSubscribedChannelIds()).toEqual([channelId]);
    expect(readSubscribedChannels()[0]?.handle).toBe('splashquest');
  });
});