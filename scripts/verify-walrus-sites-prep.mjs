#!/usr/bin/env node
/**
 * Verify Walrus Sites deploy prerequisites (Phase 9.1.4 prep).
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

const requiredScripts = [
  'scripts/prepare-walrus-sites-dist.mjs',
  'scripts/deploy-walrus-sites.mjs',
  'scripts/sync-testnet-env.mjs',
];

for (const relativePath of requiredScripts) {
  const absolutePath = path.join(rootDir, relativePath);

  if (fs.existsSync(absolutePath)) {
    pass(relativePath + ' present');
  } else {
    fail(relativePath + ' present');
  }
}

const wsResources = path.join(rootDir, 'frontend', 'ws-resources.json');

if (fs.existsSync(wsResources)) {
  const parsed = JSON.parse(fs.readFileSync(wsResources, 'utf8'));
  pass('frontend/ws-resources.json present', parsed.routes ? 'routes configured' : 'missing routes');
} else {
  fail('frontend/ws-resources.json present');
}

const exampleConfig = path.join(rootDir, 'config', 'walrus-sites-config.example.yaml');

if (fs.existsSync(exampleConfig)) {
  pass('config/walrus-sites-config.example.yaml present');
} else {
  fail('config/walrus-sites-config.example.yaml present');
}

const projectionPath = path.join(rootDir, 'backend', 'data', 'projections', 'walrus-site.json');

if (fs.existsSync(projectionPath)) {
  const projection = JSON.parse(fs.readFileSync(projectionPath, 'utf8'));
  pass(
    'walrus-site projection readable',
    projection.object_id ? 'object_id=' + projection.object_id : 'awaiting first deploy',
  );
} else {
  pass('walrus-site projection readable', 'awaiting first deploy (optional until 9.1.4)');
}

console.log('');
console.log('Walrus Sites prep (9.1.4)');
console.log('===========================');

for (const check of checks) {
  const mark = check.ok ? '[ok]' : '[XX]';
  console.log(mark, check.label, check.detail ? '— ' + check.detail : '');
}

console.log('');
if (failed === 0) {
  console.log('Walrus Sites prep checks passed. Run: node scripts/deploy-walrus-sites.mjs --dry-run');
} else {
  console.log(failed + ' prep check(s) need attention.');
}

process.exit(failed === 0 ? 0 : 1);