#!/usr/bin/env node
/**
 * Generate Render + Vercel env files from deployments/testnet/latest.json.
 *
 * Usage:
 *   node scripts/sync-deploy-env.mjs \
 *     --render-url https://nami-backend.onrender.com \
 *     --vercel-url https://your-app.vercel.app \
 *     [--apply-local]
 *
 * Writes:
 *   deployments/testnet/render.env   — paste into Render dashboard (bulk env)
 *   deployments/testnet/vercel.env   — paste into Vercel project env
 *
 * With --apply-local, also refreshes backend/.env and frontend/.env.local
 * so verify-public-deploy.mjs can probe the same public URLs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const deployDir = path.join(rootDir, 'deployments', 'testnet');
const summaryPath = path.join(deployDir, 'latest.json');
const DEFAULT_TESTNET_TREASURY =
  '0x6bff7988b87ffce3af4eaee7853f77b6d0d9ebb0e70a2a5924e5bdc7f68c75b4';

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? '' : '';
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');

    if (separator <= 0) {
      continue;
    }

    values[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
  }

  return values;
}

function isPlaceholderOwner(value) {
  return (
    !value ||
    value.includes('YOUR_') ||
    value === '0xYOUR_OFFICIAL_OWNER' ||
    value === '0xYOUR_WALLET_ADDRESS_HERE'
  );
}

function isPlaceholderTreasury(value) {
  return !value || value.includes('YOUR_') || value === '0xYOUR_TREASURY_WALLET';
}

function resolveTreasury(cliValue) {
  if (cliValue && !isPlaceholderTreasury(cliValue)) {
    return cliValue;
  }

  for (const filePath of [
    path.join(rootDir, 'backend', '.env'),
    path.join(rootDir, 'backend', '.env.testnet.example'),
  ]) {
    const env = parseEnvFile(filePath);
    const candidate = env.NAMI_PAYMENT_TREASURY_ADDRESS;

    if (candidate && !isPlaceholderTreasury(candidate)) {
      return candidate;
    }
  }

  return DEFAULT_TESTNET_TREASURY;
}

function resolveOfficialOwner(cliValue) {
  if (cliValue && !isPlaceholderOwner(cliValue)) {
    return cliValue;
  }

  for (const filePath of [
    path.join(rootDir, 'backend', '.env'),
    path.join(rootDir, 'backend', '.env.testnet.example'),
    path.join(rootDir, 'frontend', '.env.local'),
    path.join(rootDir, 'frontend', '.env.testnet.example'),
  ]) {
    const env = parseEnvFile(filePath);

    for (const candidate of [env.NAMI_OFFICIAL_OWNER, env.VITE_NAMI_OFFICIAL_OWNER]) {
      if (candidate && !isPlaceholderOwner(candidate)) {
        return candidate;
      }
    }
  }

  return '0xYOUR_OFFICIAL_OWNER';
}

function resolveOfficialOwnerEmail(cliValue) {
  if (cliValue && cliValue.includes('@')) {
    return cliValue;
  }

  for (const filePath of [
    path.join(rootDir, 'backend', '.env'),
    path.join(rootDir, 'backend', '.env.testnet.example'),
    path.join(rootDir, 'frontend', '.env.local'),
    path.join(rootDir, 'frontend', '.env.testnet.example'),
  ]) {
    const env = parseEnvFile(filePath);

    for (const candidate of [env.NAMI_OFFICIAL_OWNER_EMAIL, env.VITE_NAMI_OFFICIAL_OWNER_EMAIL]) {
      if (candidate && candidate.includes('@')) {
        return candidate;
      }
    }
  }

  return '';
}

function normalizeServiceUrl(value, label) {
  const trimmed = (value || '').trim();

  if (!trimmed) {
    return '';
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    console.error(`Invalid ${label}:`, value);
    process.exit(1);
  }
}

function normalizeZkLoginOrigin(value) {
  const trimmed = (value || '').trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.endsWith('/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}/`;
  } catch {
    return `${trimmed}/`;
  }
}

function formatEnvBlock(lines) {
  return `${lines.filter((line) => line !== undefined).join('\n')}\n`;
}

if (!fs.existsSync(summaryPath)) {
  console.error('Missing deployment summary:', summaryPath);
  console.error('Run scripts/publish-testnet.sh or update latest.json first.');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

if (!summary.packageId?.startsWith('0x')) {
  console.error('latest.json is missing a valid packageId');
  process.exit(1);
}

const packageId = summary.packageId;
const adminCapId = summary.adminCapId ?? '';
const nodenameRegistryId = summary.nodenameRegistryId ?? '';
const publishDigest = summary.publishDigest ?? '';

const renderUrl = normalizeServiceUrl(readArg('--render-url'), '--render-url');
const vercelUrl = normalizeServiceUrl(readArg('--vercel-url'), '--vercel-url');
const zkloginOrigin = normalizeZkLoginOrigin(readArg('--vercel-url') || vercelUrl);

if (!renderUrl || !vercelUrl) {
  console.error('Both --render-url and --vercel-url are required.');
  console.error('');
  console.error('Example:');
  console.error(
    '  node scripts/sync-deploy-env.mjs \\',
  );
  console.error('    --render-url https://nami-backend.onrender.com \\');
  console.error('    --vercel-url https://nami-testnet.vercel.app \\');
  console.error('    --apply-local');
  process.exit(1);
}

const officialOwner = resolveOfficialOwner(readArg('--official-owner'));
const officialOwnerEmail = resolveOfficialOwnerEmail(readArg('--official-owner-email'));
const treasuryAddress = resolveTreasury(readArg('--treasury'));
const zkloginClientId =
  readArg('--zklogin-client-id') ||
  process.env.ZKLOGIN_CLIENT_ID ||
  '885352607900-cnbkebbo23ejlbabgvooshre535204qs.apps.googleusercontent.com';

const renderEnv = formatEnvBlock([
  '# Generated by scripts/sync-deploy-env.mjs — Render (nami-backend)',
  '# Dashboard: Environment → Add from .env / paste key=value pairs',
  '# Secrets below are blank — set in Render dashboard only.',
  '',
  'NODE_VERSION=20',
  'NAMI_NETWORK=testnet',
  `NAMI_PACKAGE_ID=${packageId}`,
  `NAMI_ADMIN_CAP_ID=${adminCapId}`,
  `NAMI_NODENAME_REGISTRY_ID=${nodenameRegistryId}`,
  `NAMI_PUBLISH_DIGEST=${publishDigest}`,
  '',
  'NAMI_TEST_LAUNCH=true',
  'NAMI_HTTP_ENABLED=true',
  'NAMI_REQUIRE_WALLET_AUTH=true',
  `NAMI_OFFICIAL_OWNER=${officialOwner}`,
  `NAMI_OFFICIAL_OWNER_EMAIL=${officialOwnerEmail}`,
  'NAMI_OFFICIAL_NODENAME=fiendtgnceo',
  'NAMI_OFFICIAL_ARCHETYPE=1',
  'NAMI_OFFICIAL_AVATAR_REF=seed:official-owner',
  '',
  `NAMI_PUBLIC_API_URL=${renderUrl}`,
  `NAMI_PAYMENT_SUCCESS_URL=${zkloginOrigin}?payment=success`,
  `NAMI_PAYMENT_CANCEL_URL=${zkloginOrigin}?payment=cancel`,
  'NAMI_PAYMENT_ALLOW_MOCK=false',
  `NAMI_PAYMENT_TREASURY_ADDRESS=${treasuryAddress}`,
  '',
  'NAMI_POLL_INTERVAL_MS=5000',
  'NAMI_PAGE_LIMIT=50',
  'NAMI_MAX_PAGES_PER_MODULE=5',
  'NAMI_DATA_DIR=/var/data',
  'NAMI_CURSOR_PATH=/var/data/cursors.json',
  'NAMI_EVENT_LOG_PATH=/var/data/events.jsonl',
  '',
  'NAMI_OFFICIALS_SYNC_SECRET=',
  'NAMI_ALERT_WEBHOOK_URL=',
  'STRIPE_SECRET_KEY=',
  'STRIPE_PUBLISHABLE_KEY=',
  'STRIPE_WEBHOOK_SECRET=',
  'PAYPAL_CLIENT_ID=',
  'PAYPAL_CLIENT_SECRET=',
  'NAMI_PAYPAL_MODE=sandbox',
  '',
  '# Border art — Walrus Quilt (BA-14.1)',
  'NAMI_WALRUS_NETWORK=testnet',
  'NAMI_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space',
  'NAMI_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space',
  'NAMI_WALRUS_STORAGE_EPOCHS=5',
]);

const vercelEnv = formatEnvBlock([
  '# Generated by scripts/sync-deploy-env.mjs — Vercel (frontend/)',
  '# Project Settings → Environment Variables',
  '',
  'VITE_NAMI_NETWORK=testnet',
  `VITE_NAMI_PACKAGE_ID=${packageId}`,
  `VITE_NAMI_ADMIN_CAP_ID=${adminCapId}`,
  `VITE_NAMI_NODENAME_REGISTRY_ID=${nodenameRegistryId}`,
  `VITE_NAMI_PUBLISH_DIGEST=${publishDigest}`,
  `VITE_NAMI_INDEXER_URL=${renderUrl}`,
  `VITE_NAMI_OFFICIAL_OWNER=${officialOwner}`,
  `VITE_NAMI_OFFICIAL_OWNER_EMAIL=${officialOwnerEmail}`,
  'VITE_NAMI_OFFICIAL_NODENAME=fiendtgnceo',
  '',
  'VITE_NAMI_TEST_LAUNCH=true',
  'VITE_NAMI_LOUNGE_LAYOUT_MOCKS=true',
  'VITE_NAMI_DEV_FIXTURES=false',
  'VITE_NAMI_REQUIRE_WALLET_AUTH=true',
  '',
  `VITE_ZKLOGIN_CLIENT_ID=${zkloginClientId}`,
  `VITE_ZKLOGIN_REDIRECT_URL=${zkloginOrigin}`,
  'VITE_ZKLOGIN_SALT_URL=https://salt.api.mystenlabs.com/get_salt',
]);

const deployUrls = {
  network: 'testnet',
  renderUrl,
  vercelUrl,
  zkloginRedirectUrl: zkloginOrigin,
  packageId,
  nodenameRegistryId,
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(deployDir, { recursive: true });
fs.writeFileSync(path.join(deployDir, 'render.env'), renderEnv);
fs.writeFileSync(path.join(deployDir, 'vercel.env'), vercelEnv);
fs.writeFileSync(path.join(deployDir, 'deploy-urls.json'), `${JSON.stringify(deployUrls, null, 2)}\n`);

if (hasFlag('--apply-local')) {
  const backendEnv = formatEnvBlock([
    '# Generated by scripts/sync-deploy-env.mjs — official testnet receiving server',
    'NAMI_NETWORK=testnet',
    `NAMI_PACKAGE_ID=${packageId}`,
    `NAMI_ADMIN_CAP_ID=${adminCapId}`,
    `NAMI_NODENAME_REGISTRY_ID=${nodenameRegistryId}`,
    `NAMI_PUBLISH_DIGEST=${publishDigest}`,
    '',
    'NAMI_TEST_LAUNCH=true',
    `NAMI_OFFICIAL_OWNER=${officialOwner}`,
    `NAMI_OFFICIAL_OWNER_EMAIL=${officialOwnerEmail}`,
    'NAMI_OFFICIAL_NODENAME=fiendtgnceo',
    'NAMI_OFFICIAL_ARCHETYPE=1',
    'NAMI_OFFICIAL_AVATAR_REF=seed:official-owner',
    'NAMI_OFFICIALS_SYNC_SECRET=',
    '',
    'NAMI_POLL_INTERVAL_MS=5000',
    'NAMI_PAGE_LIMIT=50',
    'NAMI_MAX_PAGES_PER_MODULE=5',
    'NAMI_CURSOR_PATH=data/cursors.json',
    'NAMI_EVENT_LOG_PATH=data/events.jsonl',
    'NAMI_HTTP_PORT=8787',
    '',
    `NAMI_PUBLIC_API_URL=${renderUrl}`,
    'NAMI_PAYMENT_ALLOW_MOCK=false',
    'NAMI_REQUIRE_WALLET_AUTH=true',
    `NAMI_PAYMENT_SUCCESS_URL=${zkloginOrigin}?payment=success`,
    `NAMI_PAYMENT_CANCEL_URL=${zkloginOrigin}?payment=cancel`,
    `NAMI_PAYMENT_TREASURY_ADDRESS=${treasuryAddress}`,
    '',
    'STRIPE_SECRET_KEY=',
    'STRIPE_PUBLISHABLE_KEY=',
    'STRIPE_WEBHOOK_SECRET=',
    'PAYPAL_CLIENT_ID=',
    'PAYPAL_CLIENT_SECRET=',
    'NAMI_PAYPAL_MODE=sandbox',
    '',
    'NAMI_WALRUS_NETWORK=testnet',
    'NAMI_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space',
    'NAMI_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space',
    'NAMI_WALRUS_STORAGE_EPOCHS=5',
  ]);

  const frontendEnv = formatEnvBlock([
    '# Generated by scripts/sync-deploy-env.mjs — official testnet frontend build',
    'VITE_NAMI_NETWORK=testnet',
    `VITE_NAMI_PACKAGE_ID=${packageId}`,
    `VITE_NAMI_ADMIN_CAP_ID=${adminCapId}`,
    `VITE_NAMI_NODENAME_REGISTRY_ID=${nodenameRegistryId}`,
    `VITE_NAMI_PUBLISH_DIGEST=${publishDigest}`,
    `VITE_NAMI_INDEXER_URL=${renderUrl}`,
    `VITE_NAMI_OFFICIAL_OWNER=${officialOwner}`,
    `VITE_NAMI_OFFICIAL_OWNER_EMAIL=${officialOwnerEmail}`,
    'VITE_NAMI_OFFICIAL_NODENAME=fiendtgnceo',
    '',
    'VITE_NAMI_TEST_LAUNCH=true',
  'VITE_NAMI_LOUNGE_LAYOUT_MOCKS=true',
    'VITE_NAMI_DEV_FIXTURES=false',
    'VITE_NAMI_REQUIRE_WALLET_AUTH=true',
    '',
    `VITE_ZKLOGIN_CLIENT_ID=${zkloginClientId}`,
    `VITE_ZKLOGIN_REDIRECT_URL=${zkloginOrigin}`,
    'VITE_ZKLOGIN_SALT_URL=https://salt.api.mystenlabs.com/get_salt',
  ]);

  fs.writeFileSync(path.join(rootDir, 'backend', '.env'), backendEnv);
  fs.writeFileSync(path.join(rootDir, 'frontend', '.env.local'), frontendEnv);
}

console.log('Synced deploy environment files:');
console.log('  deployments/testnet/render.env');
console.log('  deployments/testnet/vercel.env');
console.log('  deployments/testnet/deploy-urls.json');

if (hasFlag('--apply-local')) {
  console.log('  backend/.env');
  console.log('  frontend/.env.local');
}

console.log('');
console.log('Package ID:      ', packageId);
console.log('Registry ID:     ', nodenameRegistryId || '(missing — republish)');
console.log('Render URL:      ', renderUrl);
console.log('Vercel URL:      ', vercelUrl);
console.log('zkLogin redirect: ', zkloginOrigin);
console.log('');
console.log('Next steps:');
console.log('  1. Paste render.env into Render → nami-backend → Environment');
console.log('  2. Paste vercel.env into Vercel → frontend project → Environment Variables');
console.log('  3. Add zkLogin redirect URI in Google OAuth:', zkloginOrigin);
console.log('  4. Redeploy both services, then: node scripts/verify-public-deploy.mjs');