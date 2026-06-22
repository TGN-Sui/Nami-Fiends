import { describe, expect, it } from 'vitest';

import { createNamiIndexerClient } from './indexer-client.js';
import {
  subscribeToChannelProjections,
  type IndexerPollSnapshot,
} from './indexer-subscriptions.js';
import type { ChannelProjection } from './projections.js';

const indexerUrl = process.env.NAMI_INDEXER_URL?.replace(/\/$/, '') ?? '';

const describeIntegration = indexerUrl ? describe : describe.skip;

describeIntegration('indexer integration (live)', () => {
  const indexer = createNamiIndexerClient({ baseUrl: indexerUrl });

  it('responds on /health and /ready', async () => {
    const health = await indexer.getHealth();
    expect(health.ok).toBe(true);

    const ready = await indexer.getReady();
    expect(ready.ready).toBe(true);
  });

  it('returns stats aligned with pinned testnet package when configured', async () => {
    const stats = await indexer.getStats();
    const expectedPackageId = process.env.NAMI_PACKAGE_ID;

    expect(stats.packageId).toBeTruthy();

    if (expectedPackageId) {
      expect(stats.packageId).toBe(expectedPackageId);
    }
  });

  it('loads projection list endpoints', async () => {
    const [guilds, channels, appeals] = await Promise.all([
      indexer.getGuilds(),
      indexer.getChannels(),
      indexer.getAppeals(),
    ]);

    expect(Array.isArray(guilds)).toBe(true);
    expect(Array.isArray(channels)).toBe(true);
    expect(Array.isArray(appeals)).toBe(true);
  });

  it('subscribe helper fetches at least one snapshot', async () => {
    const snapshot = await new Promise<IndexerPollSnapshot<ChannelProjection[]>>((resolve) => {
      const unsubscribe = subscribeToChannelProjections(indexer, (poll) => {
        unsubscribe();
        resolve(poll);
      }, { pollIntervalMs: 60_000 });
    });

    expect(Array.isArray(snapshot.data)).toBe(true);
    expect(snapshot.polledAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});