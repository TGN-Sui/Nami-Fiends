#!/usr/bin/env node
/**
 * Walrus Sites epoch renewal ops helper (Phase 9.1).
 *
 * Reads walrus-site projection + deploy metadata, prints renewal command, and
 * optionally runs site-builder deploy (epoch extension) then updates last_renew_ms.
 *
 * Usage:
 *   node scripts/renew-walrus-sites.mjs
 *   node scripts/renew-walrus-sites.mjs --run
 *   node scripts/renew-walrus-sites.mjs --run --epochs 5 --context testnet
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  defaultWalrusSitesConfigPath,
  readWalrusSiteProjection,
  resolveWalrusSitesConfigPath,
} from './walrus-sites-config-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist');
const projectionPath = path.join(rootDir, 'backend', 'data', 'projections', 'walrus-site.json');
const deployManifestPath = path.join(rootDir, 'deployments', 'testnet', 'walrus-sites-deploy.json');

const EPOCH_DURATION_MS = 24 * 60 * 60 * 1000;
const RENEWAL_BUFFER_EPOCHS = 1;

function readArg(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function readDeployManifest() {
  if (!fs.existsSync(deployManifestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(deployManifestPath, 'utf8'));
  } catch {
    return null;
  }
}

function resolveStorageEpochs(projection, manifest, cliEpochs) {
  if (cliEpochs) {
    return cliEpochs;
  }

  const fromProjection = projection?.storage_epochs;
  const fromManifest = manifest?.storage_epochs;

  if (fromProjection !== undefined && fromProjection !== null && fromProjection !== '') {
    return String(fromProjection);
  }

  if (fromManifest !== undefined && fromManifest !== null && fromManifest !== '') {
    return String(fromManifest);
  }

  return '5';
}

function computeRenewalStatus(projection) {
  const anchorMs = Math.max(
    Number(projection?.last_renew_ms ?? 0),
    Number(projection?.last_deploy_ms ?? 0),
  );

  if (!anchorMs) {
    return {
      renewal_due: false,
      expires_at_ms: null,
      epochs_remaining_approx: null,
    };
  }

  const epochs = Number(projection?.storage_epochs) > 0 ? Number(projection.storage_epochs) : 5;
  const expiresAtMs = anchorMs + epochs * EPOCH_DURATION_MS;
  const bufferMs = RENEWAL_BUFFER_EPOCHS * EPOCH_DURATION_MS;
  const nowMs = Date.now();
  const renewalDue = nowMs >= expiresAtMs - bufferMs;
  const remainingMs = Math.max(0, expiresAtMs - nowMs);
  const epochsRemainingApprox = Math.ceil(remainingMs / EPOCH_DURATION_MS);

  return {
    renewal_due: renewalDue,
    expires_at_ms: expiresAtMs,
    epochs_remaining_approx: epochsRemainingApprox,
  };
}

function writeProjectionUpdate(nextRenewMs) {
  const existing = readWalrusSiteProjection(rootDir) ?? {};
  const payload = {
    ...existing,
    last_renew_ms: nextRenewMs,
  };

  fs.mkdirSync(path.dirname(projectionPath), { recursive: true });
  fs.writeFileSync(projectionPath, JSON.stringify(payload, null, 2) + '\n');
  console.log('Wrote projection last_renew_ms:', path.relative(rootDir, projectionPath));

  if (fs.existsSync(deployManifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(deployManifestPath, 'utf8'));
      manifest.last_renew_ms = nextRenewMs;
      fs.writeFileSync(deployManifestPath, JSON.stringify(manifest, null, 2) + '\n');
      console.log('Updated deploy manifest:', path.relative(rootDir, deployManifestPath));
    } catch {
      // ignore manifest update failures
    }
  }
}

function runNodeScript(scriptName, extraArgs = []) {
  const result = spawnSync(
    process.execPath,
    [path.join(rootDir, 'scripts', scriptName), ...extraArgs],
    {
      cwd: rootDir,
      stdio: 'inherit',
      env: process.env,
    },
  );

  return result.status ?? 1;
}

const shouldRun = hasFlag('--run');
const epochs = resolveStorageEpochs(
  readWalrusSiteProjection(rootDir),
  readDeployManifest(),
  readArg('--epochs'),
);
const context = readArg('--context', 'testnet');
const configPath = resolveWalrusSitesConfigPath(readArg('--config'));
const siteBuilder = readArg('--site-builder', 'site-builder');

const projection = readWalrusSiteProjection(rootDir);
const manifest = readDeployManifest();
const renewalSource = {
  ...(projection ?? {}),
  site_object_id:
    projection?.site_object_id ??
    (typeof manifest?.site_object_id === 'string' ? manifest.site_object_id : null),
  network: projection?.network ?? manifest?.network ?? null,
  storage_epochs: projection?.storage_epochs ?? manifest?.storage_epochs ?? null,
  last_deploy_ms: projection?.last_deploy_ms ?? manifest?.last_deploy_ms ?? null,
  last_renew_ms: projection?.last_renew_ms ?? manifest?.last_renew_ms ?? null,
};
const siteObjectId =
  (typeof renewalSource.site_object_id === 'string' ? renewalSource.site_object_id : '') ||
  (typeof manifest?.site_object_id === 'string' ? manifest.site_object_id : '');
const renewal = computeRenewalStatus(renewalSource);

console.log('');
console.log('Walrus Sites renewal ops (Phase 9.1)');
console.log('=====================================');
console.log('');

if (!siteObjectId) {
  console.log('No site object ID found. Run first deploy:');
  console.log('  node scripts/deploy-walrus-sites.mjs --epochs ' + epochs + ' --context ' + context);
  process.exit(1);
}

console.log('Site object ID:', siteObjectId);
console.log('Network:', projection?.network ?? manifest?.network ?? context);
console.log('Storage epochs:', epochs);

if (renewalSource.last_deploy_ms) {
  console.log('Last deploy:', new Date(renewalSource.last_deploy_ms).toISOString());
}

if (renewalSource.last_renew_ms) {
  console.log('Last renew:', new Date(renewalSource.last_renew_ms).toISOString());
}

if (renewal.expires_at_ms) {
  console.log('Expires approx:', new Date(renewal.expires_at_ms).toISOString());
  console.log('Epochs remaining (approx):', renewal.epochs_remaining_approx);
  console.log('Renewal due:', renewal.renewal_due ? 'yes' : 'no');
} else {
  console.log('Renewal due: unknown (no deploy/renew timestamp in projection)');
}

const deployArgs = ['--context=' + context];

if (configPath) {
  deployArgs.push('--config', configPath);
} else if (fs.existsSync(defaultWalrusSitesConfigPath())) {
  deployArgs.push('--config', defaultWalrusSitesConfigPath());
}

deployArgs.push('deploy', '--epochs', epochs, distDir);

const renewalCommand = siteBuilder + ' ' + deployArgs.join(' ');

console.log('');
console.log('Renewal command (site-builder deploy extends Walrus blob epochs):');
console.log('  node scripts/prepare-walrus-sites-dist.mjs');
console.log('  ' + renewalCommand);
console.log('');
console.log('Or run this helper with --run to prepare dist + deploy + update last_renew_ms.');

if (!shouldRun) {
  process.exit(renewal.renewal_due ? 2 : 0);
}

const prepareExit = runNodeScript('prepare-walrus-sites-dist.mjs');

if (prepareExit !== 0) {
  process.exit(prepareExit);
}

console.log('');
console.log('Running site-builder renewal deploy…');
console.log(siteBuilder, deployArgs.join(' '));

const deployResult = spawnSync(siteBuilder, deployArgs, {
  cwd: rootDir,
  stdio: 'pipe',
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

process.stdout.write(deployResult.stdout ?? '');
process.stderr.write(deployResult.stderr ?? '');

if ((deployResult.status ?? 1) !== 0) {
  console.error('');
  console.error('site-builder deploy failed. See docs/walrus-sites-deploy.md');
  process.exit(deployResult.status ?? 1);
}

writeProjectionUpdate(Date.now());

console.log('');
console.log('Renewal complete. Re-run verify-walrus-sites-ready.mjs to confirm readiness.');