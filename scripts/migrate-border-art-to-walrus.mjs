#!/usr/bin/env node
/**
 * Migrate legacy Render border art URLs in the catalog projection to Walrus Quilt.
 *
 * Reads data/projections/chat-overlay-rewards.json, loads bytes from disk or HTTP,
 * republishes via the backend quilt publisher, and writes Walrus patch refs.
 *
 * Usage:
 *   npx --prefix backend tsx scripts/migrate-border-art-to-walrus.mjs
 *   npx --prefix backend tsx scripts/migrate-border-art-to-walrus.mjs --dry-run
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

process.env.NAMI_WALRUS_NETWORK = process.env.NAMI_WALRUS_NETWORK ?? 'testnet';
process.env.NAMI_WALRUS_AGGREGATOR_URL =
  process.env.NAMI_WALRUS_AGGREGATOR_URL ?? 'https://aggregator.walrus-testnet.walrus.space';
process.env.NAMI_WALRUS_PUBLISHER_URL =
  process.env.NAMI_WALRUS_PUBLISHER_URL ?? 'https://publisher.walrus-testnet.walrus.space';
process.env.NAMI_WALRUS_STORAGE_EPOCHS = process.env.NAMI_WALRUS_STORAGE_EPOCHS ?? '1';
process.env.NAMI_DATA_DIR = process.env.NAMI_DATA_DIR ?? path.join(rootDir, 'data');
process.env.NAMI_REQUIRE_WALLET_AUTH = process.env.NAMI_REQUIRE_WALLET_AUTH ?? 'false';
process.env.NAMI_NETWORK = process.env.NAMI_NETWORK ?? 'testnet';
process.env.NAMI_PACKAGE_ID =
  process.env.NAMI_PACKAGE_ID ?? '0x74f2e6f200d7a814390b89e2e8a1c7d09fb49968a4362c8ab56e100e9573665f';
process.env.NAMI_OFFICIAL_OWNER =
  process.env.NAMI_OFFICIAL_OWNER ??
  '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca';

const dryRun = process.argv.includes('--dry-run');

const {
  getChatOverlayRewardsCatalog,
  migrateChatOverlayRewardsToWalrus,
} = await import('../backend/src/services/chat-overlay-rewards.service.ts');

const owner = process.env.NAMI_OFFICIAL_OWNER;

console.log('Border art Walrus migration');
console.log('===========================');
console.log('Owner:', owner);
console.log('Data dir:', process.env.NAMI_DATA_DIR);
console.log('Mode:', dryRun ? 'dry-run' : 'migrate');
console.log('');

const before = await getChatOverlayRewardsCatalog();
const legacySlots = before.rewards.flatMap((reward) => {
  const slots = [];

  if (reward.staticArtUrl && !reward.staticArtRef) {
    slots.push(reward.id + ':static');
  }

  if (reward.animatedArtUrl && !reward.animatedArtRef) {
    slots.push(reward.id + ':animated');
  }

  return slots;
});

console.log('Legacy slots without Walrus refs:', legacySlots.length);

if (legacySlots.length > 0) {
  for (const slot of legacySlots) {
    console.log('  -', slot);
  }
}

if (dryRun) {
  console.log('');
  console.log('Dry run complete. Re-run without --dry-run to publish to Walrus.');
  process.exit(0);
}

const { catalog, report } = await migrateChatOverlayRewardsToWalrus(owner);

console.log('');
console.log('Migrated slots:', report.migratedCount);

for (const slot of report.slots) {
  const mark = slot.status === 'migrated' ? '[ok]' : slot.status === 'skipped' ? '[--]' : '[!!]';
  console.log(mark, slot.rewardId + ':' + slot.artKind, slot.status, slot.detail ?? '');
}

const withRefs = catalog.rewards.filter(
  (reward) => reward.staticArtRef || reward.animatedArtRef
).length;

console.log('');
console.log('Catalog rewards with Walrus refs:', withRefs + '/' + catalog.rewards.length);
console.log('Migration complete.');