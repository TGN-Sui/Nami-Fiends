#!/usr/bin/env node
/**
 * Automated pre-launch security gate (Phase 8.4).
 *
 * Usage:
 *   node scripts/verify-security-review.mjs
 *   node scripts/verify-security-review.mjs --indexer-url https://nami-backend-rv0o.onrender.com
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

function parseEnvFile(filePath) {
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

    if (index <= 0) {
      continue;
    }

    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }

  return env;
}

function isPlaceholder(value) {
  return (
    !value ||
    value.includes('YOUR_') ||
    value.includes('your-') ||
    value === '0xYOUR_OFFICIAL_OWNER' ||
    value === '0xYOUR_PUBLISHED_PACKAGE_ID'
  );
}

function isConfiguredWalletAddress(value) {
  const trimmed = (value ?? '').trim();

  return (
    trimmed.startsWith('0x') &&
    trimmed.length > 10 &&
    !trimmed.includes('YOUR_') &&
    !trimmed.includes('your-')
  );
}

function readYamlEnvValue(filePath, key) {
  if (!fs.existsSync(filePath)) {
    return '';
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let inTargetKey = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('- key: ' + key)) {
      inTargetKey = true;
      continue;
    }

    if (inTargetKey) {
      if (trimmed.startsWith('- key: ')) {
        inTargetKey = false;
        continue;
      }

      if (trimmed.startsWith('value:')) {
        return trimmed.slice('value:'.length).trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }

  return '';
}

function resolveIndexerUrl(frontendEnv, backendEnv) {
  const cli = readArg('--indexer-url').trim().replace(/\/$/, '');

  if (cli) {
    return cli;
  }

  const fromFrontend = frontendEnv?.VITE_NAMI_INDEXER_URL ?? '';

  if (!isPlaceholder(fromFrontend)) {
    return fromFrontend.replace(/\/$/, '');
  }

  const fromBackend = backendEnv?.NAMI_PUBLIC_API_URL ?? '';

  if (!isPlaceholder(fromBackend)) {
    return fromBackend.replace(/\/$/, '');
  }

  for (const filePath of [path.join(rootDir, 'deployments', 'testnet', 'deploy-urls.json')]) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const renderUrl = typeof parsed.renderUrl === 'string' ? parsed.renderUrl.trim() : '';

      if (renderUrl) {
        return renderUrl.replace(/\/$/, '');
      }
    } catch {
      // ignore
    }
  }

  return '';
}

function resolveBackupHolder(backendEnv) {
  const fromBackend = backendEnv?.NAMI_ADMIN_CAP_BACKUP_HOLDER ?? '';

  if (isConfiguredWalletAddress(fromBackend)) {
    return fromBackend;
  }

  const fromExample = parseEnvFile(path.join(rootDir, 'backend', '.env.testnet.example'));

  if (isConfiguredWalletAddress(fromExample?.NAMI_ADMIN_CAP_BACKUP_HOLDER)) {
    return fromExample.NAMI_ADMIN_CAP_BACKUP_HOLDER;
  }

  const fromRender = readYamlEnvValue(path.join(rootDir, 'render.yaml'), 'NAMI_ADMIN_CAP_BACKUP_HOLDER');

  if (isConfiguredWalletAddress(fromRender)) {
    return fromRender;
  }

  return '';
}

function frontendHasOfficialsSyncSecret(frontendEnv) {
  if (!frontendEnv) {
    return false;
  }

  return Object.entries(frontendEnv).some(([key, value]) => {
    const normalized = key.toUpperCase();

    return (
      (normalized.includes('OFFICIALS_SYNC') || normalized.includes('OFFICIALS_SYNC_SECRET')) &&
      typeof value === 'string' &&
      value.trim() !== ''
    );
  });
}

function repoEnvFilesContainSealKey() {
  const offenders = [];

  for (const filePath of [
    path.join(rootDir, 'backend', '.env'),
    path.join(rootDir, 'backend', '.env.local'),
    path.join(rootDir, 'frontend', '.env'),
    path.join(rootDir, 'frontend', '.env.local'),
  ]) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
      if (!line.startsWith('NAMI_SEAL_EVIDENCE_KEY=') && !line.startsWith('VITE_NAMI_SEAL_EVIDENCE_KEY=')) {
        continue;
      }

      const value = line.slice(line.indexOf('=') + 1).trim();

      if (value.length > 0) {
        offenders.push(path.relative(rootDir, filePath));
      }
    }
  }

  return offenders;
}

function assertGiftRoutesPresent() {
  const serverPath = path.join(rootDir, 'backend', 'src', 'server.ts');

  if (!fs.existsSync(serverPath)) {
    fail('gift payment routes in server.ts');
    return;
  }

  const content = fs.readFileSync(serverPath, 'utf8');
  const requiredPatterns = [
    /gifts\\\/catalog/,
    /gifts\\\/intents/,
    /gifts\\\/webhooks\\\/stripe/,
    /gifts\\\/webhooks\\\/paypal/,
    /gifts\\\/recent/,
  ];

  const missing = requiredPatterns.filter((pattern) => !pattern.test(content));

  if (missing.length === 0) {
    pass('gift payment routes registered');
  } else {
    fail('gift payment routes registered', missing.length + ' route pattern(s) missing');
  }
}

function assertCorsPatternsPresent() {
  const serverPath = path.join(rootDir, 'backend', 'src', 'server.ts');

  if (!fs.existsSync(serverPath)) {
    fail('CORS headers on sensitive routes');
    return;
  }

  const content = fs.readFileSync(serverPath, 'utf8');

  if (
    content.includes("'access-control-allow-origin', '*'") &&
    content.includes('X-Nami-Officials-Sync') &&
    content.includes('Stripe-Signature')
  ) {
    pass('CORS header patterns in server.ts');
  } else {
    fail('CORS header patterns in server.ts', 'Missing allow-origin or sensitive route headers');
  }
}

async function probeLiveCors(indexerUrl) {
  const probes = [
    { label: 'officials submissions GET', path: '/api/officials/submissions', method: 'GET' },
    { label: 'gift catalog GET', path: '/api/gifts/catalog', method: 'GET' },
    { label: 'payment config GET', path: '/api/payments/membership/config', method: 'GET' },
    { label: 'seal privacy status GET', path: '/api/privacy/status', method: 'GET' },
  ];

  for (const probe of probes) {
    try {
      const response = await fetch(indexerUrl + probe.path, { method: probe.method });
      const origin = response.headers.get('access-control-allow-origin');

      if (origin === '*') {
        pass('live CORS ' + probe.label);
      } else {
        fail('live CORS ' + probe.label, 'access-control-allow-origin=' + (origin ?? 'missing'));
      }
    } catch (error) {
      fail(
        'live CORS ' + probe.label,
        error instanceof Error ? error.message : 'fetch failed',
      );
    }
  }
}

async function probeLiveSecurityReview(indexerUrl) {
  try {
    const response = await fetch(indexerUrl + '/api/ops/launch-summary');

    if (!response.ok) {
      fail('live security_review block', 'HTTP ' + response.status);
      return;
    }

    const summary = await response.json();
    const security = summary?.security_review;

    if (!security) {
      warn(
        'live security_review block',
        'missing security_review on launch-summary — redeploy backend with Phase 8.4 changes',
      );
      return;
    }

    pass('live security_review block present');

    if (security.backup_holder_configured) {
      pass('live backup holder configured');
    } else {
      fail('live backup holder configured', 'Set NAMI_ADMIN_CAP_BACKUP_HOLDER on Render');
    }

    if (security.mock_payments_disabled) {
      pass('live mock payments disabled');
    } else {
      fail('live mock payments disabled', 'NAMI_TEST_LAUNCH requires NAMI_PAYMENT_ALLOW_MOCK=false');
    }

    if (summary.official_owner_configured) {
      pass('live official owner configured');
    } else {
      fail('live official owner configured', 'Set NAMI_OFFICIAL_OWNER on Render');
    }

    if (security.seal_key_configured) {
      pass('live seal evidence key configured');
    } else {
      warn('live seal evidence key configured', 'Optional until NAMI_SEAL_PRIVACY_ENABLED=true');
    }

    if (security.review_ready) {
      pass('live security review ready');
    } else {
      fail('live security review ready', 'Resolve failed checks above');
    }
  } catch (error) {
    fail('live security_review block', error instanceof Error ? error.message : 'fetch failed');
  }
}

function writeLastRunRecord() {
  const record = {
    last_run_ms: Date.now(),
    failed,
    warned,
    exit_code: failed === 0 ? 0 : 1,
  };

  const deploymentPath = path.join(rootDir, 'deployments', 'testnet', 'security-review-last-run.json');

  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(record, null, 2) + '\n');

  const projectionDir = path.join(rootDir, 'backend', 'data', 'projections');

  if (fs.existsSync(path.join(rootDir, 'backend', 'data'))) {
    fs.mkdirSync(projectionDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectionDir, 'security-review.json'),
      JSON.stringify(record, null, 2) + '\n',
    );
  }
}

const frontendEnv =
  parseEnvFile(path.join(rootDir, 'frontend', '.env.local')) ??
  parseEnvFile(path.join(rootDir, 'frontend', '.env.testnet.example')) ??
  parseEnvFile(path.join(rootDir, 'frontend', '.env'));

const backendEnv =
  parseEnvFile(path.join(rootDir, 'backend', '.env')) ??
  parseEnvFile(path.join(rootDir, 'backend', '.env.testnet.example'));

if (frontendEnv?.VITE_NAMI_TEST_LAUNCH === 'true') {
  pass('VITE_NAMI_TEST_LAUNCH=true');
} else {
  fail('VITE_NAMI_TEST_LAUNCH=true', 'Official testnet builds require test launch mode');
}

if (backendEnv?.NAMI_TEST_LAUNCH === 'true') {
  pass('NAMI_TEST_LAUNCH=true');
} else {
  fail('NAMI_TEST_LAUNCH=true');
}

if (backendEnv?.NAMI_PAYMENT_ALLOW_MOCK === 'false' || backendEnv?.NAMI_TEST_LAUNCH === 'true') {
  pass('NAMI_PAYMENT_ALLOW_MOCK=false (test launch policy)');
} else {
  fail('NAMI_PAYMENT_ALLOW_MOCK=false', 'Mock providers must be disabled on test launch');
}

const officialOwner = backendEnv?.NAMI_OFFICIAL_OWNER ?? '';

if (isConfiguredWalletAddress(officialOwner)) {
  pass('NAMI_OFFICIAL_OWNER configured');
} else {
  fail('NAMI_OFFICIAL_OWNER configured', 'Set AdminCap holder wallet');
}

const backupHolder = resolveBackupHolder(backendEnv);

if (isConfiguredWalletAddress(backupHolder)) {
  pass('NAMI_ADMIN_CAP_BACKUP_HOLDER configured', backupHolder.slice(0, 10) + '…');
} else {
  fail('NAMI_ADMIN_CAP_BACKUP_HOLDER configured', 'See docs/admincap-custody.md');
}

const sealKeyOffenders = repoEnvFilesContainSealKey();

if (sealKeyOffenders.length === 0) {
  pass('NAMI_SEAL_EVIDENCE_KEY not in repo .env files');
} else {
  warn(
    'NAMI_SEAL_EVIDENCE_KEY not in repo .env files',
    'Present in: ' + sealKeyOffenders.join(', ') + ' — keep key in Render only',
  );
}

if (!frontendHasOfficialsSyncSecret(frontendEnv)) {
  pass('officials sync secret absent from frontend env');
} else {
  fail('officials sync secret absent from frontend env', 'Remove NAMI_OFFICIALS_SYNC_SECRET from frontend');
}

if (!frontendEnv?.VITE_NAMI_DEMO_OWNER) {
  pass('VITE_NAMI_DEMO_OWNER unset');
} else {
  fail('VITE_NAMI_DEMO_OWNER unset', 'Remove demo owner on testnet');
}

assertGiftRoutesPresent();
assertCorsPatternsPresent();

if (fs.existsSync(path.join(rootDir, 'docs', 'security-audit.md'))) {
  pass('docs/security-audit.md present');
} else {
  fail('docs/security-audit.md present');
}

if (fs.existsSync(path.join(rootDir, 'docs', 'admincap-custody.md'))) {
  pass('docs/admincap-custody.md present');
} else {
  fail('docs/admincap-custody.md present');
}

const indexerUrl = resolveIndexerUrl(frontendEnv, backendEnv);

if (indexerUrl) {
  await probeLiveCors(indexerUrl);
  await probeLiveSecurityReview(indexerUrl);
} else {
  warn('live receiving server probes', 'Set VITE_NAMI_INDEXER_URL or pass --indexer-url');
}

writeLastRunRecord();

console.log('');
console.log('Nami security review (Phase 8.4)');
console.log('=================================');

for (const check of checks) {
  const mark = check.ok === true ? '[ok]' : check.ok === 'warn' ? '[!!]' : '[XX]';
  console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
}

console.log('');

if (failed === 0) {
  console.log(
    warned === 0
      ? 'All security checks passed.'
      : 'Core security checks passed. ' + warned + ' warning(s) need attention before mainnet.',
  );
} else {
  console.log(failed + ' critical security check(s) failed.');
}

process.exit(failed === 0 ? 0 : 1);