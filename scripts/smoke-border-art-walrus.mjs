#!/usr/bin/env node
/**
 * Smoke-test Walrus border art readiness on the live receiving server and Mysten testnet.
 *
 * Usage:
 *   node scripts/smoke-border-art-walrus.mjs
 *   node scripts/smoke-border-art-walrus.mjs --indexer-url https://nami-backend-rv0o.onrender.com
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const DEFAULT_INDEXER = 'https://nami-backend-rv0o.onrender.com';
const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

/** 1×1 PNG */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const checks = [];
let failed = 0;
let warned = 0;

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? '' : '';
}

function pass(label, detail = '') {
  checks.push({ ok: true, label, detail });
}

function fail(label, detail = '') {
  checks.push({ ok: false, label, detail });
  failed += 1;
}

function warn(label, detail = '') {
  checks.push({ ok: 'warn', label, detail });
  warned += 1;
}

function resolveIndexerUrl() {
  const cli = readArg('--indexer-url').trim().replace(/\/$/, '');

  if (cli) {
    return cli;
  }

  for (const filePath of [
    path.join(rootDir, 'frontend', '.env.local'),
    path.join(rootDir, 'deployments', 'testnet', 'deploy-urls.json'),
  ]) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    if (filePath.endsWith('.json')) {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const renderUrl = typeof parsed.renderUrl === 'string' ? parsed.renderUrl.trim() : '';

        if (renderUrl) {
          return renderUrl.replace(/\/$/, '');
        }
      } catch {
        // ignore
      }

      continue;
    }

    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
      const trimmed = line.trim();

      if (trimmed.startsWith('VITE_NAMI_INDEXER_URL=')) {
        return trimmed.slice('VITE_NAMI_INDEXER_URL='.length).trim().replace(/\/$/, '');
      }
    }
  }

  return DEFAULT_INDEXER;
}

async function probeLaunchSummary(indexerUrl) {
  const response = await fetch(indexerUrl + '/api/ops/launch-summary');

  if (!response.ok) {
    fail('launch-summary reachable', 'HTTP ' + response.status);
    return null;
  }

  pass('launch-summary reachable', String(response.status));
  return response.json();
}

async function probeCatalog(indexerUrl) {
  const response = await fetch(indexerUrl + '/api/platform/chat-overlay-rewards');

  if (!response.ok) {
    fail('border art catalog API', 'HTTP ' + response.status);
    return null;
  }

  const body = await response.json();
  const rewards = Array.isArray(body?.catalog?.rewards) ? body.catalog.rewards : [];

  pass('border art catalog API', rewards.length + ' reward(s)');
  return body.catalog;
}

async function smokeWalrusQuiltRoundTrip() {
  const identifier = 'nami-smoke-' + Date.now();
  const form = new FormData();
  const blob = new Blob([Uint8Array.from(TINY_PNG)], { type: 'image/png' });

  form.append(identifier, blob, identifier + '.png');
  form.append(
    '_metadata',
    JSON.stringify([
      {
        identifier,
        tags: {
          'nami:asset-type': 'border-art-smoke',
          'nami:smoke': 'true',
        },
      },
    ]),
  );

  const publishUrl = WALRUS_PUBLISHER + '/v1/quilts?epochs=1';
  let publishResponse;

  try {
    publishResponse = await fetch(publishUrl, { method: 'PUT', body: form });
  } catch (error) {
    fail('Walrus quilt publish', error instanceof Error ? error.message : 'fetch failed');
    return;
  }

  if (!publishResponse.ok) {
    const text = await publishResponse.text();
    fail('Walrus quilt publish', 'HTTP ' + publishResponse.status + ' — ' + text.slice(0, 200));
    return;
  }

  const publishBody = await publishResponse.json();
  const patchId = publishBody?.storedQuiltBlobs?.[0]?.quiltPatchId;
  const quiltBlobId =
    publishBody?.blobStoreResult?.newlyCreated?.blobObject?.blobId ??
    publishBody?.blobStoreResult?.alreadyCertified?.blobId;

  if (!patchId || !quiltBlobId) {
    fail('Walrus quilt publish response', 'missing patchId or quiltBlobId');
    return;
  }

  pass('Walrus quilt publish', 'blob ' + quiltBlobId);

  const readUrl = WALRUS_AGGREGATOR + '/v1/blobs/by-quilt-patch-id/' + encodeURIComponent(patchId);
  let readResponse;

  try {
    readResponse = await fetch(readUrl);
  } catch (error) {
    fail('Walrus aggregator patch read', error instanceof Error ? error.message : 'fetch failed');
    return;
  }

  if (!readResponse.ok) {
    fail('Walrus aggregator patch read', 'HTTP ' + readResponse.status);
    return;
  }

  const bytes = Buffer.from(await readResponse.arrayBuffer());

  if (bytes.byteLength !== TINY_PNG.byteLength) {
    fail('Walrus aggregator patch bytes', 'expected ' + TINY_PNG.byteLength + ' got ' + bytes.byteLength);
    return;
  }

  pass('Walrus aggregator patch read', bytes.byteLength + ' bytes');
}

async function main() {
  const indexerUrl = resolveIndexerUrl();

  console.log('Border art Walrus smoke');
  console.log('=======================');
  console.log('Indexer:', indexerUrl);
  console.log('');

  try {
    const summary = await probeLaunchSummary(indexerUrl);

    if (summary) {
      const walrus = summary.walrus_border_art;

      if (walrus?.configured) {
        pass('Render Walrus env configured', walrus.network ?? 'custom');
      } else {
        warn(
          'Render Walrus env configured',
          'Set NAMI_WALRUS_NETWORK=testnet on Render and redeploy (see render.yaml)',
        );
      }

      if (typeof summary.walrus_border_art !== 'undefined') {
        pass('launch-summary exposes walrus_border_art', 'BA-14.1 backend deployed');
      } else {
        fail('launch-summary exposes walrus_border_art', 'redeploy backend from main');
      }
    }

    const catalog = await probeCatalog(indexerUrl);

    if (catalog) {
      const withRefs = (catalog.rewards ?? []).filter(
        (reward) => reward?.staticArtRef || reward?.animatedArtRef,
      );

      if (withRefs.length > 0) {
        pass('catalog has Walrus patch refs', String(withRefs.length));
      } else {
        warn('catalog has Walrus patch refs', 'none yet — owner publish after Render Walrus env is set');
      }
    }

    await smokeWalrusQuiltRoundTrip();
  } catch (error) {
    fail('smoke runner', error instanceof Error ? error.message : 'unknown error');
  }

  console.log('');

  for (const check of checks) {
    const mark = check.ok === true ? '[ok]' : check.ok === 'warn' ? '[!!]' : '[XX]';
    console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
  }

  console.log('');

  if (failed === 0) {
    console.log(
      warned === 0
        ? 'All smoke checks passed.'
        : 'Core smoke passed. ' + warned + ' warning(s) — complete Render Walrus env to enable server publish.',
    );
  } else {
    console.log(failed + ' smoke check(s) failed.');
  }

  process.exit(failed === 0 ? 0 : 1);
}

main();