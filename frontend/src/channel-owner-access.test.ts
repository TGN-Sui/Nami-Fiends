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

import {
  canOfficialOwnerEditProvisionedChannel,
  ownsGameChannel,
  resolveOwnedGameChannel,
} from './channel-owner-access.js';
import {
  createOwnerProvisionedChannel,
  resetOwnerProvisionedChannelsStoreForTests,
  saveActiveOwnerProvisionedChannelId,
} from './owner-provisioned-channels-store.js';

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

describe('channel-owner-access owner-provisioned channels', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetOwnerProvisionedChannelsStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lets the official owner edit unclaimed provisioned channels', () => {
    const created = createOwnerProvisionedChannel(
      {
        gameTitle: 'Starfall Tactics',
        handle: 'starfall',
        genre: 'Strategy',
        platforms: ['PC'],
      },
      OFFICIAL_OWNER
    );

    const channelId = created.channel!.channelId;

    expect(canOfficialOwnerEditProvisionedChannel(channelId)).toBe(true);
    expect(ownsGameChannel(channelId)).toBe(true);
  });

  it('resolves the active owner-provisioned channel for editing', () => {
    const created = createOwnerProvisionedChannel(
      {
        gameTitle: 'Echo Drift',
        handle: 'echodrift',
        genre: 'Racing',
        platforms: ['PC'],
      },
      OFFICIAL_OWNER
    );

    const channelId = created.channel!.channelId;
    saveActiveOwnerProvisionedChannelId(channelId);

    const resolved = resolveOwnedGameChannel();

    expect(resolved?.id).toBe(channelId);
    expect(resolved?.name).toBe('Echo Drift');
    expect(resolved?.officialBadges).toContain('Owner-Provisioned');
  });
});