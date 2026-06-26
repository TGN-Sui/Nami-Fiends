#!/usr/bin/env node
/**
 * Build and deploy Nami frontend to Walrus Sites (Phase 9.1).
 *
 * Prerequisites: site-builder + Walrus CLI configured (see docs/walrus-sites-deploy.md).
 *
 * Usage:
 *   node scripts/deploy-walrus-sites.mjs --dry-run
 *   node scripts/deploy-walrus-sites.mjs --epochs 5 --context testnet
 *   node scripts/deploy-walrus-sites.mjs --config ~/.config/walrus/sites-config.yaml
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist');
const wsSource = path.join(rootDir, 'frontend', 'ws-resources.json');
const projectionPath = path.join(rootDir, 'backend', 'data', 'projections', 'walrus-site.json');

function readArg(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

const dryRun = hasFlag('--dry-run');
const epochs = readArg('--epochs', '5');
const context = readArg('--context', 'testnet');
const configPath = readArg('--config', '');
const siteBuilder = readArg('--site-builder', 'site-builder');

function runNodeScript(scriptName) {
  const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts', scriptName)], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });

  return result.status ?? 1;
}

function writeProjection(payload) {
  fs.mkdirSync(path.dirname(projectionPath), { recursive: true });
  fs.writeFileSync(projectionPath, JSON.stringify(payload, null, 2) + '\n');
  console.log('Wrote projection:', path.relative(rootDir, projectionPath));
}

function syncObjectIdFromDist() {
  const wsDist = path.join(distDir, 'ws-resources.json');

  if (!fs.existsSync(wsDist)) {
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(wsDist, 'utf8'));
  const objectId = typeof parsed.object_id === 'string' ? parsed.object_id : null;

  if (!objectId) {
    return null;
  }

  fs.writeFileSync(wsSource, JSON.stringify(parsed, null, 2) + '\n');
  return objectId;
}

console.log('');
console.log('Nami Walrus Sites deploy (Phase 9.1)');
console.log('====================================');

const prepareExit = runNodeScript('prepare-walrus-sites-dist.mjs');

if (prepareExit !== 0) {
  process.exit(prepareExit);
}

if (dryRun) {
  console.log('');
  console.log('Dry run complete — dist ready, site-builder not invoked.');
  console.log('Deploy command preview:');
  console.log(
    siteBuilder +
      ' --context=' +
      context +
      (configPath ? ' --config ' + configPath : '') +
      ' deploy --epochs ' +
      epochs +
      ' ' +
      path.relative(rootDir, distDir)
  );
  process.exit(0);
}

const deployArgs = ['--context=' + context];

if (configPath) {
  deployArgs.push('--config', configPath);
}

deployArgs.push('deploy', '--epochs', epochs, distDir);

console.log('');
console.log('Running site-builder deploy…');
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
  console.error('site-builder deploy failed. Is site-builder installed and configured?');
  console.error('See docs/walrus-sites-deploy.md');
  process.exit(deployResult.status ?? 1);
}

const output = (deployResult.stdout ?? '') + (deployResult.stderr ?? '');
const objectIdFromOutput =
  output.match(/site object ID:\s*(0x[a-fA-F0-9]+)/i)?.[1] ??
  output.match(/Site object ID:\s*(0x[a-fA-F0-9]+)/i)?.[1] ??
  null;
const objectId = syncObjectIdFromDist() ?? objectIdFromOutput;

writeProjection({
  site_object_id: objectId,
  network: context,
  storage_epochs: Number(epochs) || epochs,
  last_deploy_ms: Date.now(),
  portal_note:
    context === 'mainnet'
      ? 'Browse via wal.app after SuiNS is linked to the site object.'
      : 'Testnet requires a self-hosted portal — wal.app is mainnet-only.',
  dist_path: path.relative(rootDir, distDir),
});

console.log('');
if (objectId) {
  console.log('Site object ID:', objectId);
  console.log('Set NAMI_WALRUS_SITE_OBJECT_ID on Render for Launch Ops visibility.');
} else {
  console.log('Deploy finished — check site-builder output for the site object ID.');
}

console.log('Epoch renewal: re-run deploy before epochs expire (see docs/walrus-sites-deploy.md).');