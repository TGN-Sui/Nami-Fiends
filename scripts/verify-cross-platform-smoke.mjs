#!/usr/bin/env node
/**
 * Smoke checks for cross-platform passport blockers after testnet republish.
 * Usage: node scripts/verify-cross-platform-smoke.mjs [--indexer-url URL]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createNamiClient, lookupNodenameInRegistry, normalizeNodename } from '@nami/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? '' : '';
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

const summaryPath = path.join(rootDir, 'deployments', 'testnet', 'latest.json');

if (!fs.existsSync(summaryPath)) {
  fail('deployments/testnet/latest.json exists');
} else {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  pass('latest.json present', summary.packageId ?? '');

  if (summary.packageId?.startsWith('0x')) {
    pass('packageId configured', summary.packageId);
  } else {
    fail('packageId configured');
  }

  if (summary.nodenameRegistryId?.startsWith('0x')) {
    pass('nodenameRegistryId configured', summary.nodenameRegistryId);
  } else {
    fail('nodenameRegistryId configured', 'Republish required after onboarding module');
  }

  const publishFile = summary.sourceFile
    ? path.join(rootDir, 'deployments', 'testnet', summary.sourceFile)
    : null;

  if (publishFile && fs.existsSync(publishFile)) {
    const publish = JSON.parse(fs.readFileSync(publishFile, 'utf8').replace(/^\uFEFF/, ''));
    const published = (publish.objectChanges ?? []).find((change) => change.type === 'published');

    if (published?.modules?.includes('onboarding')) {
      pass('onboarding module published', published.packageId);
    } else {
      fail('onboarding module published');
    }
  } else {
    pass('publish artifact check skipped', summary.sourceFile ?? 'no sourceFile');
  }
}

const backendEnvPath = path.join(rootDir, 'backend', '.env');
const frontendEnvPath = path.join(rootDir, 'frontend', '.env.local');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const env = {};

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const index = trimmed.indexOf('=');

    if (index > 0) {
      env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
    }
  }

  return env;
}

const backendEnv = parseEnv(backendEnvPath);
const frontendEnv = parseEnv(frontendEnvPath);

if (backendEnv?.NAMI_PACKAGE_ID?.startsWith('0x')) {
  pass('backend NAMI_PACKAGE_ID synced');
} else {
  fail('backend NAMI_PACKAGE_ID synced');
}

if (backendEnv?.NAMI_NODENAME_REGISTRY_ID?.startsWith('0x')) {
  pass('backend NAMI_NODENAME_REGISTRY_ID synced', backendEnv.NAMI_NODENAME_REGISTRY_ID);
} else {
  fail('backend NAMI_NODENAME_REGISTRY_ID synced');
}

if (frontendEnv?.VITE_NAMI_NODENAME_REGISTRY_ID?.startsWith('0x')) {
  pass('frontend VITE_NAMI_NODENAME_REGISTRY_ID synced');
} else {
  fail('frontend VITE_NAMI_NODENAME_REGISTRY_ID synced');
}

const indexerUrl = readArg('--indexer-url') || backendEnv?.NAMI_PUBLIC_API_URL || 'http://127.0.0.1:8787';

try {
  const health = await fetch(indexerUrl.replace(/\/$/, '') + '/health');

  if (health.ok) {
    pass('indexer /health', String(health.status));
  } else {
    fail('indexer /health', String(health.status));
  }
} catch (error) {
  fail('indexer /health', error instanceof Error ? error.message : 'unreachable');
}

try {
  const nodenames = await fetch(indexerUrl.replace(/\/$/, '') + '/api/nami/nodenames?limit=5');

  if (nodenames.ok) {
    const payload = await nodenames.json();
    pass('GET /api/nami/nodenames', `${payload.count ?? 0} indexed`);
  } else {
    fail('GET /api/nami/nodenames', String(nodenames.status));
  }
} catch (error) {
  fail('GET /api/nami/nodenames', error instanceof Error ? error.message : 'unreachable');
}

const summary = fs.existsSync(summaryPath)
  ? JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  : null;

if (summary?.packageId && summary?.nodenameRegistryId) {
  try {
    const chain = createNamiClient({
      packageId: summary.packageId,
      network: 'testnet',
    });

    const registryObject = await chain.getObject(summary.nodenameRegistryId);

    if (registryObject.data?.objectId) {
      pass('NodenameRegistry on-chain', registryObject.data.objectId);
    } else {
      fail('NodenameRegistry on-chain');
    }

    const probe = await lookupNodenameInRegistry(
      chain,
      summary.nodenameRegistryId,
      'fiendsmoke00'
    );

    if (probe && probe.registered === false) {
      pass('registry devInspect reachable', normalizeNodename('fiendsmoke00') ?? '');
    } else {
      fail('registry devInspect reachable');
    }
  } catch (error) {
    fail('chain registry probe', error instanceof Error ? error.message : 'failed');
  }
}

console.log('');

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.label}${check.detail ? ` — ${check.detail}` : ''}`);
}

console.log('');

if (failed > 0) {
  console.error(`${failed} smoke check(s) failed.`);
  process.exit(1);
}

console.log('All cross-platform smoke checks passed.');