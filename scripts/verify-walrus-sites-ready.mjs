#!/usr/bin/env node
/**
 * Verify Walrus Sites deploy prerequisites (Phase 9.1.4).
 *
 * Usage:
 *   node scripts/verify-walrus-sites-ready.mjs
 *   node scripts/verify-walrus-sites-ready.mjs --build
 *   node scripts/verify-walrus-sites-ready.mjs --indexer-url https://nami-backend-rv0o.onrender.com
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  computeWalrusSitesRenewalDue,
  defaultWalrusSitesConfigPath,
  exampleWalrusSitesConfigPath,
  readWalrusSiteProjection,
} from './walrus-sites-config-path.mjs';

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

function commandExists(command) {
  const pathValue = process.env.PATH ?? process.env.Path ?? '';

  if (!pathValue) {
    return false;
  }

  const extensions =
    process.platform === 'win32'
      ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';').map((ext) => ext.toLowerCase())
      : [''];

  for (const dir of pathValue.split(path.delimiter)) {
    if (!dir) {
      continue;
    }

    for (const ext of extensions) {
      const candidate = path.join(dir, command + ext);

      if (fs.existsSync(candidate)) {
        return true;
      }
    }
  }

  return false;
}

function resolveIndexerUrl() {
  const cli = readArg('--indexer-url').trim().replace(/\/$/, '');

  if (cli) {
    return cli;
  }

  for (const filePath of [
    path.join(rootDir, 'deployments', 'testnet', 'deploy-urls.json'),
    path.join(rootDir, 'frontend', '.env.local'),
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

const wsResourcesPath = path.join(rootDir, 'frontend', 'ws-resources.json');

if (fs.existsSync(wsResourcesPath)) {
  pass('frontend/ws-resources.json present');
} else {
  fail('frontend/ws-resources.json present');
}

if (fs.existsSync(exampleWalrusSitesConfigPath())) {
  pass('config/walrus-sites-config.example.yaml present');
} else {
  fail('config/walrus-sites-config.example.yaml present');
}

const userConfigPath = defaultWalrusSitesConfigPath();

if (fs.existsSync(userConfigPath)) {
  pass('sites-config.yaml installed', userConfigPath);
} else {
  warn(
    'sites-config.yaml installed',
    'Run node scripts/setup-walrus-sites-config.mjs — expected ' + userConfigPath,
  );
}

if (commandExists('site-builder')) {
  pass('site-builder CLI in PATH');
} else {
  warn('site-builder CLI in PATH', 'Install from docs.wal.app/docs/sites/getting-started/installing-the-site-builder');
}

if (commandExists('walrus')) {
  pass('walrus CLI in PATH');
} else {
  warn('walrus CLI in PATH', 'Required for site-builder uploads — docs.wal.app/docs/getting-started');
}

if (commandExists('sui')) {
  pass('sui CLI in PATH');
} else {
  warn('sui CLI in PATH', 'Wallet must be configured for testnet deploys');
}

const projection = readWalrusSiteProjection(rootDir);
const deployManifestPath = path.join(rootDir, 'deployments', 'testnet', 'walrus-sites-deploy.json');
let deployManifest = null;

if (fs.existsSync(deployManifestPath)) {
  try {
    deployManifest = JSON.parse(fs.readFileSync(deployManifestPath, 'utf8'));
  } catch {
    deployManifest = null;
  }
}

const renewalProjection = {
  ...(projection ?? {}),
  site_object_id: projection?.site_object_id ?? deployManifest?.site_object_id ?? null,
  storage_epochs: projection?.storage_epochs ?? deployManifest?.storage_epochs ?? null,
  last_deploy_ms: projection?.last_deploy_ms ?? deployManifest?.last_deploy_ms ?? null,
  last_renew_ms: projection?.last_renew_ms ?? deployManifest?.last_renew_ms ?? null,
};

if (renewalProjection?.site_object_id) {
  pass('local walrus-site projection', renewalProjection.site_object_id);

  const renewal = computeWalrusSitesRenewalDue(renewalProjection);

  if (renewal.expires_at_ms) {
    const expiryLabel = new Date(renewal.expires_at_ms).toISOString();

    if (renewal.renewal_due) {
      warn(
        'walrus-site epoch renewal',
        'Storage epochs expiring — run node scripts/renew-walrus-sites.mjs --run (expires ' +
          expiryLabel +
          ')',
      );
    } else {
      pass(
        'walrus-site epoch renewal',
        '~' + renewal.epochs_remaining_approx + ' epoch(s) remaining (expires ' + expiryLabel + ')',
      );
    }
  } else if (!renewalProjection.last_deploy_ms && !renewalProjection.last_renew_ms) {
    warn(
      'walrus-site epoch renewal',
      'Projection missing last_deploy_ms — cannot estimate renewal window',
    );
  }
} else {
  warn('local walrus-site projection', 'No deploy yet — run deploy-walrus-sites.mjs after site-builder setup');
}

if (process.argv.includes('--build')) {
  const dryRun = spawnSync(
    process.execPath,
    [path.join(rootDir, 'scripts', 'deploy-walrus-sites.mjs'), '--dry-run'],
    {
      cwd: rootDir,
      stdio: 'ignore',
    },
  );

  if ((dryRun.status ?? 1) === 0) {
    pass('frontend/dist dry-run build');
  } else {
    fail('frontend/dist dry-run build', 'deploy-walrus-sites.mjs --dry-run failed');
  }
} else {
  warn('frontend/dist dry-run build', 'Re-run with --build to compile SDK + frontend dist');
}

async function probeLiveWalrusSites(indexerUrl) {
  try {
    const response = await fetch(indexerUrl + '/api/ops/launch-summary');

    if (!response.ok) {
      fail('live launch-summary walrus_sites', 'HTTP ' + response.status);
      return;
    }

    const summary = await response.json();
    const walrusSites = summary?.walrus_sites;

    if (walrusSites?.configured && walrusSites?.site_object_id) {
      pass('Render walrus_sites configured', walrusSites.site_object_id);
      return;
    }

    warn(
      'Render walrus_sites configured',
      'Set NAMI_WALRUS_SITE_OBJECT_ID after first site-builder deploy',
    );
  } catch (error) {
    warn(
      'live launch-summary walrus_sites',
      error instanceof Error ? error.message : 'fetch failed',
    );
  }
}

async function main() {
  const indexerUrl = resolveIndexerUrl();

  if (indexerUrl) {
    await probeLiveWalrusSites(indexerUrl);
  } else {
    warn(
      'live launch-summary walrus_sites',
      'Pass --indexer-url or add deployments/testnet/deploy-urls.json',
    );
  }

  console.log('');
  console.log('Walrus Sites readiness (Phase 9.1.4)');
  console.log('====================================');

  for (const check of checks) {
    const mark = check.ok === true ? '[ok]' : check.ok === 'warn' ? '[!!]' : '[XX]';
    console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
  }

  console.log('');

  if (failed === 0) {
    console.log(
      warned === 0
        ? 'All checks passed.'
        : 'Core checks passed. ' + warned + ' optional step(s) remain before live deploy.',
    );
  } else {
    console.log(failed + ' check(s) need attention.');
  }

  return failed === 0 ? 0 : 1;
}

const exitCode = await main();
process.exitCode = exitCode;