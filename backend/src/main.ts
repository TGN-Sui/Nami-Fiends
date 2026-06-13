import { assertRuntimeConfig, config } from './config.js';
import { createSuiClient } from './sui.js';
import { NamiEventIndexer } from './indexer.js';

async function main(): Promise<void> {
  assertRuntimeConfig();

  const client = createSuiClient();
  const indexer = new NamiEventIndexer(client);

  await indexer.load();

  console.log('[nami-indexer] starting');
  console.log(`[nami-indexer] network: ${config.network}`);
  console.log(`[nami-indexer] package: ${config.packageId}`);
  console.log(`[nami-indexer] poll interval: ${config.pollIntervalMs}ms`);

  const poll = async (): Promise<void> => {
    try {
      const count = await indexer.pollOnce();

      if (count === 0) {
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
    console.log('\n[nami-indexer] stopped');
    process.exit(0);
  });
}

void main().catch((error) => {
  console.error('[nami-indexer] failed to start');
  console.error(error);
  process.exit(1);
});