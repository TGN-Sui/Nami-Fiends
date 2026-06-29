#!/usr/bin/env node
/**
 * Print post-deploy cutover steps after Walrus Sites deploy (Phase 9.1.4).
 *
 * Usage:
 *   node scripts/apply-walrus-sites-cutover.mjs
 *   node scripts/apply-walrus-sites-cutover.mjs --portal-url https://your-testnet-portal.example/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readWalrusSiteProjection } from './walrus-sites-config-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? '' : '';
}

function normalizePortalUrl(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.endsWith('/') ? trimmed : trimmed + '/';
}

const projection = readWalrusSiteProjection(rootDir);
const deployManifestPath = path.join(rootDir, 'deployments', 'testnet', 'walrus-sites-deploy.json');
let manifest = null;

if (fs.existsSync(deployManifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(deployManifestPath, 'utf8'));
  } catch {
    manifest = null;
  }
}

const siteObjectId =
  (typeof manifest?.site_object_id === 'string' ? manifest.site_object_id : '') ||
  (typeof projection?.site_object_id === 'string' ? projection.site_object_id : '');

const portalUrl = normalizePortalUrl(
  readArg('--portal-url') ||
    (typeof manifest?.portal_url === 'string' ? manifest.portal_url : '') ||
    '',
);

const network =
  (typeof manifest?.network === 'string' ? manifest.network : '') ||
  (typeof projection?.network === 'string' ? projection.network : 'testnet');

const epochs =
  manifest?.storage_epochs ??
  projection?.storage_epochs ??
  '5';

console.log('');
console.log('Walrus Sites cutover checklist (Phase 9.1.4)');
console.log('==============================================');

if (!siteObjectId) {
  console.log('');
  console.log('No site object ID found yet.');
  console.log('Run: node scripts/deploy-walrus-sites.mjs --epochs 5 --context testnet');
  process.exit(1);
}

console.log('');
console.log('Site object ID:', siteObjectId);
console.log('Network:', network);
console.log('Storage epochs:', epochs);

console.log('');
console.log('1) Render receiving server env');
console.log('   NAMI_WALRUS_SITE_OBJECT_ID=' + siteObjectId);
console.log('   NAMI_WALRUS_SITE_NETWORK=' + network);
console.log('   NAMI_WALRUS_SITE_EPOCHS=' + epochs);

console.log('');
console.log('2) Testnet portal');
console.log('   wal.app is mainnet-only — host a self-hosted portal for testnet browsing.');
console.log('   See docs/walrus-sites-deploy.md and docs.wal.app/docs/sites/portals/deploy-locally');

if (portalUrl) {
  console.log('   Portal URL (for OAuth + rebuild):', portalUrl);
} else {
  console.log('   After portal is live, re-run with --portal-url https://your-portal/');
}

console.log('');
console.log('3) Google OAuth (official owner account)');
console.log('   Add JavaScript origin + redirect URI for the Walrus portal origin.');
console.log('   Redirect must match VITE_ZKLOGIN_REDIRECT_URL exactly (trailing slash).');

if (portalUrl) {
  console.log('   VITE_ZKLOGIN_REDIRECT_URL=' + portalUrl);
  console.log('');
  console.log('   Rebuild SPA with portal origin:');
  console.log(
    '   node scripts/sync-testnet-env.mjs --indexer-url <render-url> --zklogin-origin ' + portalUrl,
  );
  console.log('   node scripts/deploy-walrus-sites.mjs --epochs ' + epochs + ' --context ' + network);
}

const deployUrlsPath = path.join(rootDir, 'deployments', 'testnet', 'deploy-urls.json');
const examplePath = path.join(rootDir, 'deployments', 'testnet', 'deploy-urls.example.json');
let deployUrls = null;

if (fs.existsSync(deployUrlsPath)) {
  deployUrls = JSON.parse(fs.readFileSync(deployUrlsPath, 'utf8'));
} else if (fs.existsSync(examplePath)) {
  deployUrls = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
}

if (deployUrls) {
  deployUrls.walrusSiteObjectId = siteObjectId;
  deployUrls.walrusSiteNetwork = network;
  deployUrls.walrusSiteEpochs = epochs;

  if (portalUrl) {
    deployUrls.walrusPortalUrl = portalUrl.replace(/\/$/, '');
    deployUrls.zkloginRedirectUrl = portalUrl;
  }

  fs.mkdirSync(path.dirname(deployUrlsPath), { recursive: true });
  fs.writeFileSync(deployUrlsPath, JSON.stringify(deployUrls, null, 2) + '\n');
  console.log('');
  console.log('Updated', path.relative(rootDir, deployUrlsPath));
}

console.log('');
console.log('4) Verify');
console.log('   node scripts/verify-walrus-sites-ready.mjs --indexer-url <render-url>');
console.log('   node scripts/verify-testnet-ready.mjs');