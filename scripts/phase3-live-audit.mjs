#!/usr/bin/env node
/**
 * Phase 3 live-surface audit — verifies test-launch policy files and guards.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const frontendSrc = path.join(rootDir, 'frontend', 'src');

const checks = [];
let failed = 0;

function pass(label, detail = '') {
  checks.push({ ok: true, label, detail });
}

function fail(label, detail = '') {
  checks.push({ ok: false, label, detail });
  failed += 1;
}

const allowedSeedImports = new Set([
  path.join(frontendSrc, 'fixture-catalog-access.ts'),
  path.join(frontendSrc, 'uiMockData.ts'),
  path.join(frontendSrc, 'fixtures', 'seed-data.ts'),
  path.join(frontendSrc, 'fixtures', 'landing-hero-members.ts'),
]);

function walkTsFiles(directory) {
  const entries = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      entries.push(...walkTsFiles(fullPath));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      entries.push(fullPath);
    }
  }

  return entries;
}

const testnetExample = path.join(rootDir, 'frontend', '.env.testnet.example');

if (fs.existsSync(testnetExample)) {
  const envText = fs.readFileSync(testnetExample, 'utf8');

  if (envText.includes('VITE_NAMI_TEST_LAUNCH=true')) {
    pass('frontend/.env.testnet.example TEST_LAUNCH=true');
  } else {
    fail('frontend/.env.testnet.example TEST_LAUNCH=true');
  }

  if (envText.includes('VITE_NAMI_DEV_FIXTURES=false')) {
    pass('frontend/.env.testnet.example DEV_FIXTURES=false');
  } else {
    fail('frontend/.env.testnet.example DEV_FIXTURES=false');
  }
} else {
  fail('frontend/.env.testnet.example present');
}

const requiredFiles = [
  path.join(frontendSrc, 'fixture-catalog-access.ts'),
  path.join(frontendSrc, 'live-surface-audit.test.ts'),
  path.join(rootDir, 'scripts', 'phase3-live-audit.mjs'),
];

for (const filePath of requiredFiles) {
  if (fs.existsSync(filePath)) {
    pass('required file', path.relative(rootDir, filePath));
  } else {
    fail('required file', path.relative(rootDir, filePath));
  }
}

const unguardedSeedImports = [];

for (const filePath of walkTsFiles(frontendSrc)) {
  if (allowedSeedImports.has(filePath)) {
    continue;
  }

  const text = fs.readFileSync(filePath, 'utf8');

  if (/from ['"]\.\.?\/.*fixtures\/seed-data(?:\.js)?['"]/.test(text)) {
    unguardedSeedImports.push(path.relative(rootDir, filePath));
  }
}

if (unguardedSeedImports.length === 0) {
  pass('no unguarded fixtures/seed-data imports');
} else {
  fail('no unguarded fixtures/seed-data imports', unguardedSeedImports.join(', '));
}

const testResult = spawnSync(
  'npm',
  ['--prefix', 'frontend', 'test', '--', 'src/live-surface-audit.test.ts', 'src/fixture-catalog-access.test.ts', 'src/app-config.test.ts'],
  {
    cwd: rootDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  }
);

if (testResult.status === 0) {
  pass('live-surface audit tests');
} else {
  fail('live-surface audit tests', (testResult.stderr || testResult.stdout || '').trim().slice(-400));
}

console.log('');
console.log('Nami Phase 3 live-surface audit');
console.log('=================================');

for (const check of checks) {
  const mark = check.ok ? '[ok]' : '[!!]';
  console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
}

console.log('');
console.log(failed === 0 ? 'All checks passed.' : failed + ' check(s) need attention.');

process.exit(failed === 0 ? 0 : 1);