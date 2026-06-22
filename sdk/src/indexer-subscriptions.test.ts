import { afterEach, describe, expect, it, vi } from 'vitest';

import { NamiIndexerClient } from './indexer-client.js';
import type { GuildProjection } from './projections.js';
import {
  NAMI_INDEXER_SUBSCRIPTION_KEYS,
  subscribeToIndexerProjection,
  subscribeToGuildProjections,
  type IndexerPollSnapshot,
} from './indexer-subscriptions.js';

describe('indexer-subscriptions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes all standard projection subscription keys', () => {
    expect(NAMI_INDEXER_SUBSCRIPTION_KEYS).toEqual([
      'guilds',
      'squads',
      'profiles',
      'channels',
      'channelAccess',
      'moderation',
      'appeals',
      'jury',
      'recovery',
      'discoveryChannels',
      'discoveryGuilds',
    ]);
  });

  it('polls guild projections immediately', async () => {
    const indexer = new NamiIndexerClient({ baseUrl: 'http://localhost:8787' });
    const getGuilds = vi.spyOn(indexer, 'getGuilds').mockResolvedValue([
      {
        id: '0xguild',
        owner: '0xowner',
        owner_passport_id: '0xpassport',
        max_members: 100,
        is_public: true,
        member_count: 2,
        members: ['0xowner', '0xmember'],
      },
    ]);

    const snapshot = await new Promise<IndexerPollSnapshot<GuildProjection[]>>((resolve) => {
      subscribeToGuildProjections(indexer, resolve);
    });

    expect(getGuilds).toHaveBeenCalledTimes(1);
    expect(snapshot.data).toHaveLength(1);
    expect(snapshot.polledAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('routes unified subscription keys to the correct fetcher', async () => {
    const indexer = new NamiIndexerClient({ baseUrl: 'http://localhost:8787' });
    const getAppeals = vi.spyOn(indexer, 'getAppeals').mockResolvedValue([]);

    await new Promise<void>((resolve) => {
      subscribeToIndexerProjection(indexer, 'appeals', () => resolve());
    });

    expect(getAppeals).toHaveBeenCalledTimes(1);
  });
});