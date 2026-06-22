#!/usr/bin/env node
/**
 * Probe indexer ops endpoints (/health, /ready, /stats).
 *
 * Usage:
 *   node scripts/verify-indexer.mjs --url http://localhost:8787
 *   NAMI_INDEXER_URL=https://api.example node scripts/verify-indexer.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

  async function probeRoute(route, options = {}) {
    const { requireOk = true, label = route } = options;

    try {
      const response = await fetch(`${origin}${route}`);
      const text = await response.text();
      let body = null;

      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }

      if (requireOk && !response.ok) {
        fail(label, `HTTP ${response.status}`);
        return null;
      }

      pass(label, `HTTP ${response.status}`);
      return { response, body };
    } catch (error) {
      fail(label, error instanceof Error ? error.message : 'fetch failed');
      return null;
    }
  }

  const health = await probeRoute('/health');

  if (health?.body && health.body.ok === true) {
    pass('/health ok:true');
  } else if (health?.body) {
    fail('/health ok:true', JSON.stringify(health.body));
  }

  const ready = await probeRoute('/ready', { requireOk: false });

  if (ready?.body?.ready === true) {
    pass('/ready ready:true');
  } else if (ready?.response?.status === 503) {
    fail('/ready ready:true', 'Indexer has not completed a successful poll yet');
  } else if (ready?.body) {
    fail('/ready ready:true', JSON.stringify(ready.body));
  }

  const stats = await probeRoute('/stats');

  if (stats?.body?.packageId) {
    pass('/stats packageId present', stats.body.packageId);

    if (expectedPackageId && stats.body.packageId === expectedPackageId) {
      pass('/stats packageId matches latest.json');
    } else if (expectedPackageId) {
      fail(
        '/stats packageId matches latest.json',
        `got ${stats.body.packageId}, expected ${expectedPackageId}`
      );
    }
  } else if (stats?.body) {
    fail('/stats packageId present');
  }

  if (stats?.body?.eventLog?.totalEvents !== undefined) {
    pass('/stats event log', `${stats.body.eventLog.totalEvents} event(s)`);
  }

  if (Array.isArray(stats?.body?.projections?.services)) {
    pass(
      '/stats projection services',
      stats.body.projections.services.join(', ')
    );
  }
}

console.log('');
console.log('Nami indexer verification');
console.log('=========================');

for (const check of checks) {
  const mark = check.ok ? '[ok]' : '[!!]';
  console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
}

console.log('');
console.log(failed === 0 ? 'All checks passed.' : failed + ' check(s) need attention.');

process.exit(failed === 0 ? 0 : 1);