#!/usr/bin/env node
/**
 * Verify testnet launch prerequisites (env files + optional live server probes).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const checks = [];
let failed = 0;

function pass(label, detail = '') {
  checks.push({ ok: true, label, detail });
}

function fail(label, detail = '') {
  checks.push({ ok: false, label, detail });
  failed += 1;
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

const summaryPath = path.join(rootDir, 'deployments', 'testnet', 'latest.json');

if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  pass('deployments/testnet/latest.json present', summary.packageId ?? '');
} else {
  fail('deployments/testnet/latest.json present');
}

const frontendEnv =
  parseEnvFile(path.join(rootDir, 'frontend', '.env.local')) ??
  parseEnvFile(path.join(rootDir, 'frontend', '.env'));

if (!frontendEnv) {
  fail('frontend env file (.env.local or .env)');
} else {
  pass('frontend env file');

  if (frontendEnv.VITE_NAMI_TEST_LAUNCH === 'true') {
    pass('VITE_NAMI_TEST_LAUNCH=true');
  } else {
    fail('VITE_NAMI_TEST_LAUNCH=true', 'Set true for official testnet');
  }

  if (frontendEnv.VITE_NAMI_DEV_FIXTURES === 'false' || frontendEnv.VITE_NAMI_TEST_LAUNCH === 'true') {
    pass('fixture catalogs disabled for test launch');
  } else {
    fail('fixture catalogs disabled', 'Set VITE_NAMI_DEV_FIXTURES=false');
  }

  if (!isPlaceholder(frontendEnv.VITE_NAMI_PACKAGE_ID)) {
    pass('VITE_NAMI_PACKAGE_ID configured');
  } else {
    fail('VITE_NAMI_PACKAGE_ID configured');
  }

  if (!isPlaceholder(frontendEnv.VITE_NAMI_INDEXER_URL)) {
    pass('VITE_NAMI_INDEXER_URL configured', frontendEnv.VITE_NAMI_INDEXER_URL);
  } else {
    fail('VITE_NAMI_INDEXER_URL configured');
  }

  if (!frontendEnv.VITE_NAMI_DEMO_OWNER) {
    pass('VITE_NAMI_DEMO_OWNER unset');
  } else {
    fail('VITE_NAMI_DEMO_OWNER unset', 'Remove demo owner on testnet');
  }

  if (!isPlaceholder(frontendEnv.VITE_ZKLOGIN_CLIENT_ID)) {
    pass('VITE_ZKLOGIN_CLIENT_ID configured');
  } else {
    fail('VITE_ZKLOGIN_CLIENT_ID configured', 'Register Google OAuth client');
  }

  if (!isPlaceholder(frontendEnv.VITE_ZKLOGIN_REDIRECT_URL)) {
    pass('VITE_ZKLOGIN_REDIRECT_URL configured', frontendEnv.VITE_ZKLOGIN_REDIRECT_URL);
  } else {
    fail('VITE_ZKLOGIN_REDIRECT_URL configured');
  }
}

const backendEnv = parseEnvFile(path.join(rootDir, 'backend', '.env'));

if (!backendEnv) {
  fail('backend/.env present');
} else {
  pass('backend/.env present');

  if (backendEnv.NAMI_TEST_LAUNCH === 'true') {
    pass('NAMI_TEST_LAUNCH=true');
  } else {
    fail('NAMI_TEST_LAUNCH=true');
  }

  if (backendEnv.NAMI_PAYMENT_ALLOW_MOCK === 'false') {
    pass('NAMI_PAYMENT_ALLOW_MOCK=false');
  } else {
    fail('NAMI_PAYMENT_ALLOW_MOCK=false');
  }

  if (!isPlaceholder(backendEnv.NAMI_PACKAGE_ID)) {
    pass('NAMI_PACKAGE_ID configured');
  } else {
    fail('NAMI_PACKAGE_ID configured');
  }

  if (!isPlaceholder(backendEnv.NAMI_OFFICIAL_OWNER)) {
    pass('NAMI_OFFICIAL_OWNER configured');
  } else {
    fail('NAMI_OFFICIAL_OWNER configured', 'Set AdminCap holder wallet');
  }
}

const indexerUrl = frontendEnv?.VITE_NAMI_INDEXER_URL;

if (indexerUrl && !isPlaceholder(indexerUrl)) {
  try {
    const origin = indexerUrl.replace(/\/$/, '');

    const health = await fetch(origin + '/health');

    if (health.ok) {
      pass('receiving server /health', String(health.status));
    } else {
      fail('receiving server /health', 'HTTP ' + health.status);
    }

    const ready = await fetch(origin + '/ready');

    if (ready.ok) {
      pass('receiving server /ready', String(ready.status));
    } else if (ready.status === 503) {
      fail('receiving server /ready', 'Indexer not ready — wait for first successful poll');
    } else {
      fail('receiving server /ready', 'HTTP ' + ready.status);
    }

    const officials = await fetch(origin + '/api/officials/submissions');

    if (officials.ok) {
      pass('officials submissions API', String(officials.status));
    } else {
      fail('officials submissions API', 'HTTP ' + officials.status);
    }
  } catch (error) {
    fail('receiving server reachable', error instanceof Error ? error.message : 'fetch failed');
  }
}

console.log('');
console.log('Nami testnet readiness');
console.log('======================');

for (const check of checks) {
  const mark = check.ok ? '[ok]' : '[!!]';
  console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
}

console.log('');
console.log(failed === 0 ? 'All checks passed.' : failed + ' check(s) need attention.');

process.exit(failed === 0 ? 0 : 1);