#!/usr/bin/env node
/**
 * Extract packageId + AdminCap from a sui publish JSON into deployments/testnet/latest.json
 * Usage: node scripts/extract-testnet-latest.mjs deployments/testnet/publish-YYYYMMDD-HHMMSS.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publishPath = process.argv[2];

if (!publishPath) {
  console.error('Usage: node scripts/extract-testnet-latest.mjs <publish-json-path>');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(publishPath, 'utf8'));
const objectChanges = raw.objectChanges ?? raw.transaction?.objectChanges ?? [];

let packageId = '';
let adminCapId = '';

for (const change of objectChanges) {
  if (change.type === 'published' && change.packageId) {
    packageId = change.packageId;
  }

  if (
    change.type === 'created' &&
    typeof change.objectType === 'string' &&
    change.objectType.includes('::admin::AdminCap')
  ) {
    adminCapId = change.objectId;
  }
}

if (!packageId) {
  console.error('Could not find packageId in publish output.');
  process.exit(1);
}

const summary = {
  network: 'testnet',
  packageId,
  adminCapId: adminCapId || null,
  publishedAt: new Date().toISOString(),
  publishDigest: raw.digest ?? raw.transaction?.digest ?? null,
  sourceFile: path.basename(publishPath),
};

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(rootDir, 'deployments', 'testnet', 'latest.json');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n');

console.log('Wrote', outPath);
console.log(JSON.stringify(summary, null, 2));