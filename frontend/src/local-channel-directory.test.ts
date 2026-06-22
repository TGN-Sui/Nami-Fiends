import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';

vi.mock('./nami-capabilities.js', () => ({
  isOfficialOwner: (owner: string | null) => owner?.toLowerCase() === OFFICIAL_OWNER,
}));

import {
  createOwnerProvisionedChannel,
  resetOwnerProvisionedChannelsStoreForTests,
} from './owner-provisioned-channels-store.js';
import { isChannelHiddenFromPublic } from './game-submission-ticket-store.js';
import { listLocalDiscoveryChannels } from './local-channel-directory.js';

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

describe('listLocalDiscoveryChannels', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetOwnerProvisionedChannelsStoreForTests();
    window.localStorage.removeItem('nami.game-submission-tickets');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('includes unclaimed owner-provisioned channels in hub discovery', () => {
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

    const channels = listLocalDiscoveryChannels();

    expect(channels).toHaveLength(1);
    expect(channels[0]?.name).toBe('SUUUISPLASH');
    expect(channels[0]?.handle).toBe('suuuisplash');
    expect(isChannelHiddenFromPublic(channels[0]!.id)).toBe(false);
  });
});