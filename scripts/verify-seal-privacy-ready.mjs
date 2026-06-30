#!/usr/bin/env node
/**
 * Verify Seal privacy lane readiness (Phase 9.2).
 *
 * Usage:
 *   node scripts/verify-seal-privacy-ready.mjs
 *   node scripts/verify-seal-privacy-ready.mjs --indexer-url https://nami-backend-rv0o.onrender.com
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

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
    path.join(rootDir, 'deployments', 'testnet', 'deploy-urls.json'),
    path.join(rootDir, 'frontend', '.env.local'),
    path.join(rootDir, 'backend', '.env'),
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

  return '';
}

function readLocalSealKeyConfigured() {
  const keyFilePath = path.join(rootDir, 'deployments', 'testnet', 'seal-evidence-key.txt');

  if (fs.existsSync(keyFilePath)) {
    for (const line of fs.readFileSync(keyFilePath, 'utf8').split('\n')) {
      if (!line.startsWith('NAMI_SEAL_EVIDENCE_KEY=')) {
        continue;
      }

      const value = line.slice('NAMI_SEAL_EVIDENCE_KEY='.length).trim();

      if (/^[0-9a-fA-F]{64}$/.test(value)) {
        return true;
      }
    }
  }

  for (const filePath of [path.join(rootDir, 'backend', '.env'), path.join(rootDir, 'backend', '.env.local')]) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
      if (!line.startsWith('NAMI_SEAL_EVIDENCE_KEY=')) {
        continue;
      }

      const value = line.slice('NAMI_SEAL_EVIDENCE_KEY='.length).trim();

      if (value.length > 0) {
        return true;
      }
    }
  }

  return false;
}

function readWalrusPublisherConfigured() {
  for (const filePath of [path.join(rootDir, 'backend', '.env'), path.join(rootDir, 'render.yaml')]) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    if (/NAMI_WALRUS_PUBLISHER_URL=\s*https?:\/\//.test(content)) {
      return true;
    }

    if (/NAMI_WALRUS_NETWORK=\s*testnet/.test(content)) {
      return true;
    }
  }

  return false;
}

if (fs.existsSync(path.join(rootDir, 'backend', 'src', 'services', 'seal-privacy.service.ts'))) {
  pass('seal-privacy.service present');
} else {
  fail('seal-privacy.service present');
}

if (fs.existsSync(path.join(rootDir, 'backend', 'src', 'services', 'seal-walrus-storage.service.ts'))) {
  pass('seal-walrus-storage.service present');
} else {
  fail('seal-walrus-storage.service present');
}

if (readLocalSealKeyConfigured()) {
  pass('local NAMI_SEAL_EVIDENCE_KEY present');
} else {
  warn('local NAMI_SEAL_EVIDENCE_KEY present', 'Run node scripts/enable-seal-privacy.mjs');
}

if (readWalrusPublisherConfigured()) {
  pass('Walrus publisher configured for ciphertext offload');
} else {
  warn(
    'Walrus publisher configured for ciphertext offload',
    'Set NAMI_WALRUS_PUBLISHER_URL (or NAMI_WALRUS_NETWORK=testnet) on Render for walrus-ciphertext stage',
  );
}

async function probeLiveSealPrivacy(indexerUrl) {
  try {
    const response = await fetch(indexerUrl + '/api/ops/launch-summary');

    if (!response.ok) {
      fail('live launch-summary seal_privacy', 'HTTP ' + response.status);
      return;
    }

    const summary = await response.json();
    const seal = summary?.seal_privacy;

    if (!seal) {
      fail('live launch-summary seal_privacy', 'missing seal_privacy block');
      return;
    }

    if (seal.enabled) {
      pass('Render seal_privacy enabled');
    } else {
      warn('Render seal_privacy enabled', 'Set NAMI_SEAL_PRIVACY_ENABLED=true on Render');
    }

    if (seal.key_configured) {
      pass('Render seal evidence key configured');
    } else {
      warn('Render seal evidence key configured', 'Set NAMI_SEAL_EVIDENCE_KEY on Render');
    }

    if (seal.walrus_publisher_configured) {
      pass('Render Walrus publisher configured', String(seal.walrus_ciphertext_count ?? 0) + ' walrus blob(s)');
    } else {
      warn(
        'Render Walrus publisher configured',
        'Optional — enables walrus-ciphertext migration stage',
      );
    }

    if (seal.migration_stage) {
      pass('seal migration stage', seal.migration_stage);
    }
  } catch (error) {
    warn(
      'live launch-summary seal_privacy',
      error instanceof Error ? error.message : 'fetch failed',
    );
  }
}

async function main() {
  const indexerUrl = resolveIndexerUrl();

  if (indexerUrl) {
    await probeLiveSealPrivacy(indexerUrl);
  } else {
    warn(
      'live launch-summary seal_privacy',
      'Pass --indexer-url or add deployments/testnet/deploy-urls.json',
    );
  }

  console.log('');
  console.log('Seal privacy readiness (Phase 9.2)');
  console.log('==================================');

  for (const check of checks) {
    const mark = check.ok === true ? '[ok]' : check.ok === 'warn' ? '[!!]' : '[XX]';
    console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
  }

  console.log('');

  if (failed === 0) {
    console.log(
      warned === 0
        ? 'All checks passed.'
        : 'Core checks passed. ' + warned + ' optional step(s) remain before live enablement.',
    );
  } else {
    console.log(failed + ' check(s) need attention.');
  }

  return failed === 0 ? 0 : 1;
}

const exitCode = await main();
process.exitCode = exitCode;