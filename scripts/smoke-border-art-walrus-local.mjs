#!/usr/bin/env node
/**
 * Local integration smoke: catalog sync publishes a tiny PNG to Walrus Quilt.
 * Requires Mysten testnet publisher reachability (no Render or zkLogin needed).
 *
 * Usage:
 *   npx --prefix backend tsx scripts/smoke-border-art-walrus-local.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

process.env.NAMI_WALRUS_NETWORK = 'testnet';
process.env.NAMI_WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';
process.env.NAMI_WALRUS_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space';
process.env.NAMI_WALRUS_STORAGE_EPOCHS = '1';
process.env.NAMI_DATA_DIR = path.join(rootDir, 'data');
process.env.NAMI_REQUIRE_WALLET_AUTH = 'false';
process.env.NAMI_BORDER_ART_RELAX_DIMENSIONS = 'true';
process.env.NAMI_NETWORK = 'testnet';
process.env.NAMI_PACKAGE_ID = '0x74f2e6f200d7a814390b89e2e8a1c7d09fb49968a4362c8ab56e100e9573665f';
process.env.NAMI_OFFICIAL_OWNER =
  process.env.NAMI_OFFICIAL_OWNER ?? '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca';

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const { buildDefaultChatOverlayRewards, syncChatOverlayRewardsCatalog } = await import(
  '../backend/src/services/chat-overlay-rewards.service.ts'
);

const owner = process.env.NAMI_OFFICIAL_OWNER;
const rewards = buildDefaultChatOverlayRewards();
const target = rewards.find((reward) => reward.id === 'overlay-signal-glow');

if (!target) {
  console.error('[XX] default overlay-signal-glow missing');
  process.exit(1);
}

target.staticArtUrl = TINY_PNG_DATA_URL;

console.log('Local border art Walrus sync smoke');
console.log('==================================');
console.log('Owner:', owner);
console.log('');

const catalog = await syncChatOverlayRewardsCatalog({
  owner,
  rewards,
});

const synced = catalog.rewards.find((reward) => reward.id === 'overlay-signal-glow');

if (!synced?.staticArtRef?.patchId) {
  console.error('[XX] staticArtRef missing after sync');
  console.error(JSON.stringify(synced, null, 2));
  process.exit(1);
}

if (!synced.staticArtUrl?.includes('by-quilt-patch-id')) {
  console.error('[XX] staticArtUrl is not an aggregator patch URL:', synced.staticArtUrl);
  process.exit(1);
}

const readResponse = await fetch(synced.staticArtUrl);

if (!readResponse.ok) {
  console.error('[XX] aggregator read failed:', readResponse.status);
  process.exit(1);
}

const bytes = Buffer.from(await readResponse.arrayBuffer());

console.log('[ok] catalog sync wrote Walrus ref', synced.staticArtRef.patchId);
console.log('[ok] aggregator URL', synced.staticArtUrl);
console.log('[ok] aggregator read', bytes.byteLength, 'bytes');
console.log('');
console.log('Local server Walrus publish path verified.');