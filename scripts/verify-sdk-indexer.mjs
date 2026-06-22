#!/usr/bin/env node
/**
 * Verify @nami/sdk can reach indexer ops + projection endpoints.
 *
 * Usage:
 *   node scripts/verify-sdk-indexer.mjs --url http://localhost:8787
 *   NAMI_INDEXER_URL=http://localhost:8787 node scripts/verify-sdk-indexer.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
let baseUrl = process.env.NAMI_INDEXER_URL ?? '';

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === '--url' && args[index + 1]) {
    baseUrl = args[index + 1];
    index += 1;
    continue;
  }

  if (arg.startsWith('--url=')) {
    baseUrl = arg.slice('--url='.length);
  }
}

const checks = [];
let failed = 0;

function pass(label, detail = '') {
  checks.push({ ok: true, label, detail });
}

function fail(label, detail = '') {
  checks.push({ ok: false, label, detail });
  failed += 1;
}

function normalizeBaseUrl(url) {
  return url.replace(/\/$/, '');
}

const sdkDist = path.join(rootDir, 'SDK', 'dist', 'index.js');

if (fs.existsSync(sdkDist)) {
  pass('@nami/sdk dist build present');
} else {
  fail('@nami/sdk dist build present', 'Run npm --prefix SDK run build');
}

let expectedPackageId = '';

const latestPath = path.join(rootDir, 'deployments', 'testnet', 'latest.json');

if (fs.existsSync(latestPath)) {
  const latest = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  expectedPackageId = latest.packageId ?? '';
  pass('deployments/testnet/latest.json', expectedPackageId);
} else {
  fail('deployments/testnet/latest.json present');
}

if (!baseUrl) {
  fail('--url or NAMI_INDEXER_URL required', 'Skip live probes or pass --url http://localhost:8787');
} else {
  pass('indexer base URL', baseUrl);

  const origin = normalizeBaseUrl(baseUrl);

  async function probe(route, label = route) {
    try {
      const response = await fetch(`${origin}${route}`);

      if (!response.ok) {
        fail(label, `HTTP ${response.status}`);
        return null;
      }

      pass(label, `HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      fail(label, error instanceof Error ? error.message : 'fetch failed');
      return null;
    }
  }

  const health = await probe('/health');

  if (health?.ok === true) {
    pass('/health ok:true');
  } else if (health) {
    fail('/health ok:true', JSON.stringify(health));
  }

  const ready = await probe('/ready');

  if (ready?.ready === true) {
    pass('/ready ready:true');
  } else if (ready) {
    fail('/ready ready:true', JSON.stringify(ready));
  }

  const stats = await probe('/stats');

  if (stats?.packageId) {
    pass('/stats packageId', stats.packageId);

    if (expectedPackageId && stats.packageId === expectedPackageId) {
      pass('/stats matches pinned package');
    } else if (expectedPackageId) {
      fail('/stats matches pinned package', `got ${stats.packageId}`);
    }
  }

  for (const route of [
    '/api/guilds',
    '/api/channels',
    '/api/appeals',
    '/api/discovery/channels?limit=5',
  ]) {
    await probe(route);
  }

  if (fs.existsSync(sdkDist)) {
    try {
      const { createNamiIndexerClient } = await import(pathToFileURL(sdkDist).href);

      const client = createNamiIndexerClient({ baseUrl: origin });
      const discovery = await client.getDiscoveryChannels(5);

      if (Array.isArray(discovery.channels)) {
        pass('SDK getDiscoveryChannels()', `${discovery.channels.length} row(s)`);
      } else {
        fail('SDK getDiscoveryChannels()');
      }
    } catch (error) {
      fail('SDK createNamiIndexerClient import', error instanceof Error ? error.message : 'import failed');
    }
  }
}

console.log('');
console.log('Nami SDK indexer verification');
console.log('=============================');

for (const check of checks) {
  const mark = check.ok ? '[ok]' : '[!!]';
  console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
}

console.log('');
console.log(failed === 0 ? 'All checks passed.' : failed + ' check(s) need attention.');

process.exit(failed === 0 ? 0 : 1);