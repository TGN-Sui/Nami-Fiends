#!/usr/bin/env node
/**
 * Extract packageId + AdminCap from a sui publish JSON into deployments/testnet/latest.json
 * Usage: node scripts/extract-testnet-latest.mjs deployments/testnet/publish-YYYYMMDD-HHMMSS.json
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publishPath = process.argv[2];

if (!publishPath) {
  console.error('Usage: node scripts/extract-testnet-latest.mjs <publish-json-path>');
  process.exit(1);
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(
  process.execPath,
  [path.join(rootDir, 'scripts', 'extract-deployment.mjs'), 'testnet', publishPath],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 1);