#!/usr/bin/env node
/**
 * Verify zkLogin env configuration for testnet launch builds.
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

const frontendEnv =
  parseEnvFile(path.join(rootDir, 'frontend', '.env.local')) ??
  parseEnvFile(path.join(rootDir, 'frontend', '.env.testnet.example'));

if (!frontendEnv) {
  fail('frontend env file present');
} else {
  pass('frontend env file');

  if (frontendEnv.VITE_NAMI_TEST_LAUNCH === 'true') {
    pass('VITE_NAMI_TEST_LAUNCH=true');
  } else {
    fail('VITE_NAMI_TEST_LAUNCH=true');
  }

  if (!frontendEnv.VITE_NAMI_DEMO_OWNER) {
    pass('VITE_NAMI_DEMO_OWNER unset');
  } else {
    fail('VITE_NAMI_DEMO_OWNER unset', 'Remove demo owner on testnet');
  }

  if (!isPlaceholder(frontendEnv.VITE_ZKLOGIN_CLIENT_ID)) {
    pass('VITE_ZKLOGIN_CLIENT_ID configured');
  } else {
    fail('VITE_ZKLOGIN_CLIENT_ID configured');
  }

  const redirect = frontendEnv.VITE_ZKLOGIN_REDIRECT_URL ?? '';

  if (!isPlaceholder(redirect)) {
    pass('VITE_ZKLOGIN_REDIRECT_URL configured', redirect);

    try {
      const parsed = new URL(redirect);

      if (redirect.endsWith('/')) {
        pass('redirect URI trailing slash');
      } else {
        fail('redirect URI trailing slash', 'Google OAuth expects trailing /');
      }

      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        pass('redirect URI protocol');
      } else {
        fail('redirect URI protocol');
      }

      if (
        parsed.protocol === 'http:' &&
        parsed.hostname !== 'localhost' &&
        parsed.hostname !== '127.0.0.1'
      ) {
        fail(
          'redirect URI uses https on public deploys',
          'Use https:// for Vercel/public origins — http:// splits zkLogin localStorage'
        );
      } else if (parsed.protocol === 'https:') {
        pass('redirect URI uses https on public deploys');
      }
    } catch {
      fail('redirect URI parseable');
    }
  } else {
    fail('VITE_ZKLOGIN_REDIRECT_URL configured');
  }

  const salt = frontendEnv.VITE_ZKLOGIN_SALT_URL ?? '';

  if (!isPlaceholder(salt)) {
    pass('VITE_ZKLOGIN_SALT_URL configured', salt);
  } else {
    fail('VITE_ZKLOGIN_SALT_URL configured');
  }
}

console.log('');
console.log('Nami zkLogin configuration');
console.log('==========================');

for (const check of checks) {
  const mark = check.ok ? '[ok]' : '[!!]';
  console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
}

console.log('');
console.log(failed === 0 ? 'All checks passed.' : failed + ' check(s) need attention.');

process.exit(failed === 0 ? 0 : 1);