import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';

vi.mock('./nami-capabilities.js', () => ({
  isOfficialOwner: (owner: string | null) => owner?.toLowerCase() === OFFICIAL_OWNER,
}));

vi.mock('./officials-submissions-sync.js', () => ({
  syncOwnerProvisionedChannelsToServer: vi.fn(),
}));

vi.mock('./owner-provisioned-channel-snapshot-hydrate.js', () => ({
  applyOwnerProvisionedSnapshots: vi.fn(),
}));

import {
  createOwnerProvisionedChannel,
  listClaimableOwnerProvisionedChannels,
  markOwnerProvisionedChannelClaimPending,
  markOwnerProvisionedChannelClaimed,
  markOwnerProvisionedChannelClaimRejected,
  replaceOwnerProvisionedChannelsFromServer,
  resetOwnerProvisionedChannelsStoreForTests,
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

describe('owner-provisioned-channels-store', () => {
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

  it('rejects channel creation from non-official owners', () => {
    const result = createOwnerProvisionedChannel(
      {
        gameTitle: 'Starfall Tactics',
        handle: 'starfall',
        genre: 'Strategy',
        platforms: ['PC'],
      },
      '0xnotowner0000000000000000000000000002'
    );

    expect(result.ok).toBe(false);
    expect(listClaimableOwnerProvisionedChannels()).toHaveLength(0);
  });

  it('creates claimable channels for the official owner', () => {
    const result = createOwnerProvisionedChannel(
      {
        gameTitle: 'Starfall Tactics',
        handle: 'starfall',
        genre: 'Strategy',
        platforms: ['PC', 'Mobile'],
        tagline: 'Reserved ahead of launch',
      },
      OFFICIAL_OWNER
    );

    expect(result.ok).toBe(true);
    expect(listClaimableOwnerProvisionedChannels()).toHaveLength(1);
    expect(listClaimableOwnerProvisionedChannels()[0]?.handle).toBe('starfall');
  });

  it('tracks claim pending, approved, and rejected transitions', () => {
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

    expect(markOwnerProvisionedChannelClaimPending(channelId, 'claim-ticket-1')?.status).toBe(
      'claim-pending'
    );
    expect(listClaimableOwnerProvisionedChannels()).toHaveLength(0);

    expect(markOwnerProvisionedChannelClaimRejected(channelId)?.status).toBe('unclaimed');
    expect(listClaimableOwnerProvisionedChannels()).toHaveLength(1);

    expect(markOwnerProvisionedChannelClaimPending(channelId, 'claim-ticket-2')?.status).toBe(
      'claim-pending'
    );
    expect(markOwnerProvisionedChannelClaimed(channelId, 'claim-ticket-2')?.status).toBe('claimed');
  });

  it('excludes transfer-pending channels from the public claim list', () => {
    const created = createOwnerProvisionedChannel(
      {
        gameTitle: 'Private Invite',
        handle: 'privateinvite',
        genre: 'Indie',
        platforms: ['PC'],
      },
      OFFICIAL_OWNER
    );

    const channel = created.channel!;

    replaceOwnerProvisionedChannelsFromServer([
      {
        ...channel,
        status: 'transfer-pending',
        pendingTransferId: 'transfer-1',
      },
    ]);

    expect(listClaimableOwnerProvisionedChannels()).toHaveLength(0);
  });
});