#!/usr/bin/env node
/**
 * Verify public deploy readiness (non-localhost URLs + live receiving server probes).
 * Run after Render/Vercel env is set and before sharing the testnet portal URL.
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
    value.includes('example.com') ||
    value === '0xYOUR_OFFICIAL_OWNER'
  );
}

function isLocalhostUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();

    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return true;
  }
}

const frontendEnv =
  parseEnvFile(path.join(rootDir, 'frontend', '.env.local')) ??
  parseEnvFile(path.join(rootDir, 'frontend', '.env.testnet.example'));

if (!frontendEnv) {
  fail('frontend env file present');
} else {
  pass('frontend env file');

  const indexerUrl = frontendEnv.VITE_NAMI_INDEXER_URL ?? '';

  if (!isPlaceholder(indexerUrl) && !isLocalhostUrl(indexerUrl)) {
    pass('public VITE_NAMI_INDEXER_URL', indexerUrl);
  } else {
    fail(
      'public VITE_NAMI_INDEXER_URL',
      indexerUrl
        ? `Got "${indexerUrl}" — run: node scripts/sync-deploy-env.mjs --render-url https://YOUR-SERVICE.onrender.com --vercel-url https://YOUR-APP.vercel.app --apply-local`
        : 'Missing — set to Render receiving server URL',
    );
  }

  const redirect = frontendEnv.VITE_ZKLOGIN_REDIRECT_URL ?? '';

  if (!isPlaceholder(redirect) && !isLocalhostUrl(redirect)) {
    pass('public zkLogin redirect URI', redirect);

    if (redirect.startsWith('https://')) {
      pass('zkLogin redirect uses HTTPS');
    } else {
      fail('zkLogin redirect uses HTTPS', 'Register https:// origin in Google OAuth');
    }

    if (redirect.endsWith('/')) {
      pass('zkLogin redirect trailing slash');
    } else {
      fail('zkLogin redirect trailing slash');
    }
  } else {
    fail(
      'public zkLogin redirect URI',
      redirect
        ? `Got "${redirect}" — must be your live Vercel origin with trailing slash`
        : 'Missing — must match deployed frontend origin',
    );
  }

  if (frontendEnv.VITE_NAMI_TEST_LAUNCH === 'true') {
    pass('VITE_NAMI_TEST_LAUNCH=true');
  } else {
    fail('VITE_NAMI_TEST_LAUNCH=true');
  }

  if (!frontendEnv.VITE_NAMI_DEMO_OWNER) {
    pass('VITE_NAMI_DEMO_OWNER unset');
  } else {
    fail('VITE_NAMI_DEMO_OWNER unset');
  }
}

const backendEnv = parseEnvFile(path.join(rootDir, 'backend', '.env'));

if (!backendEnv) {
  fail('backend/.env present');
} else {
  pass('backend/.env present');

  const successUrl = backendEnv.NAMI_PAYMENT_SUCCESS_URL ?? '';
  const cancelUrl = backendEnv.NAMI_PAYMENT_CANCEL_URL ?? '';

  if (!isPlaceholder(successUrl) && !isLocalhostUrl(successUrl)) {
    pass('NAMI_PAYMENT_SUCCESS_URL public', successUrl);
  } else {
    fail(
      'NAMI_PAYMENT_SUCCESS_URL public',
      successUrl ? `Got "${successUrl}"` : 'Missing',
    );
  }

  if (!isPlaceholder(cancelUrl) && !isLocalhostUrl(cancelUrl)) {
    pass('NAMI_PAYMENT_CANCEL_URL public', cancelUrl);
  } else {
    fail(
      'NAMI_PAYMENT_CANCEL_URL public',
      cancelUrl ? `Got "${cancelUrl}"` : 'Missing',
    );
  }

  if (backendEnv.NAMI_PAYMENT_ALLOW_MOCK === 'false') {
    pass('NAMI_PAYMENT_ALLOW_MOCK=false');
  } else {
    fail('NAMI_PAYMENT_ALLOW_MOCK=false');
  }
}

const indexerUrl = frontendEnv?.VITE_NAMI_INDEXER_URL;

if (indexerUrl && !isPlaceholder(indexerUrl) && !isLocalhostUrl(indexerUrl)) {
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

      const cors = officials.headers.get('access-control-allow-origin');

      if (cors === '*' || cors) {
        pass('officials CORS header', cors ?? '(present)');
      } else {
        fail('officials CORS header', 'Browser clients need Access-Control-Allow-Origin');
      }
    } else {
      fail('officials submissions API', 'HTTP ' + officials.status);
    }
  } catch (error) {
    fail('receiving server reachable', error instanceof Error ? error.message : 'fetch failed');
  }
}

console.log('');
console.log('Nami public deploy readiness');
console.log('============================');

for (const check of checks) {
  const mark = check.ok ? '[ok]' : '[!!]';
  console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
}

console.log('');
console.log(failed === 0 ? 'All checks passed.' : failed + ' check(s) need attention.');

process.exit(failed === 0 ? 0 : 1);