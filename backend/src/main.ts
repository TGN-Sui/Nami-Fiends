import { assertRuntimeConfig, config } from './config.js';
import { createSuiClient } from './sui.js';
import { NamiEventIndexer } from './indexer.js';
import { ProjectionRegistry } from './projection-registry.js';
import { startReadOnlyServer } from './server.js';
import { collectIndexerStats, formatIndexerStats } from './stats.js';

/**
 * Phase 2 entry point — clean, architectural wiring.
 *
 * The indexer remains a thin polling + typing engine.
 * Real domain value lives in pluggable services via ProjectionRegistry.
 *
 * Quality-of-life (option D):
 * - Startup stats from the immutable log + projections
 * - Read-only HTTP surface for projections
 * - Replay CLI: npm --prefix backend run replay
 *
 * To run against the actual testnet deployment:
 *   NAMI_PACKAGE_ID=0xd4ccad8f... NAMI_NETWORK=testnet npm --prefix backend run dev
 */

async function main(): Promise<void> {
  assertRuntimeConfig();

  const client = createSuiClient();
  const indexer = new NamiEventIndexer(client);
  const registry = new ProjectionRegistry();

  await registry.load();

  for (const processor of registry.getProcessors()) {
    indexer.registerProcessor(processor);
  }

  await indexer.load();

  console.log('[nami-indexer] starting (Phase 2 clean architecture)');
  console.log(`[nami-indexer] network: ${config.network}`);
  console.log(`[nami-indexer] package: ${config.packageId}`);
  console.log(`[nami-indexer] poll interval: ${config.pollIntervalMs}ms`);
  console.log(
    `[nami-indexer] registered services: ${registry.getServiceNames().join(', ')}`
  );

  const stats = await collectIndexerStats(registry);
  console.log(formatIndexerStats(stats));

  if (config.httpEnabled) {
    startReadOnlyServer(registry);
  }

  const poll = async (): Promise<void> => {
    try {
      const count = await indexer.pollOnce();

      if (count > 0) {
        await registry.save();
        console.log(`[nami-indexer] indexed ${count} new event(s)`);
      } else {
        console.log('[nami-indexer] no new events');
      }
    } catch (error) {
      console.error('[nami-indexer] poll failed');
      console.error(error);
    }
  };

  await poll();

  const interval = setInterval(() => {
    void poll();
  }, config.pollIntervalMs);

  process.on('SIGINT', async () => {
    clearInterval(interval);
    await indexer.save();
    await registry.save();
    console.log('\n[nami-indexer] stopped (projections persisted)');
    process.exit(0);
  });
}

void main().catch((error) => {
  console.error('[nami-indexer] failed to start');
  console.error(error);
  process.exit(1);
});