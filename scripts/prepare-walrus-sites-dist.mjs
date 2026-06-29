#!/usr/bin/env node
/**
 * Build frontend/dist for Walrus Sites deploy (SDK + Vite + ws-resources.json).
 *
 * Usage:
 *   node scripts/prepare-walrus-sites-dist.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const sdkDir = fs.existsSync(path.join(rootDir, 'SDK'))
  ? path.join(rootDir, 'SDK')
  : path.join(rootDir, 'sdk');
const distDir = path.join(frontendDir, 'dist');
const wsSource = path.join(frontendDir, 'ws-resources.json');
const wsTarget = path.join(distDir, 'ws-resources.json');

function run(label, command, args, cwd) {
  console.log('');
  console.log(label);
  console.log('-'.repeat(label.length));

  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function mergeWsResourcesIntoDist() {
  if (!fs.existsSync(wsSource)) {
    console.error('Missing frontend/ws-resources.json');
    process.exit(1);
  }

  if (!fs.existsSync(distDir)) {
    console.error('Missing frontend/dist — Vite build did not produce output.');
    process.exit(1);
  }

  const source = JSON.parse(fs.readFileSync(wsSource, 'utf8'));
  let existing = {};

  if (fs.existsSync(wsTarget)) {
    try {
      existing = JSON.parse(fs.readFileSync(wsTarget, 'utf8'));
    } catch {
      existing = {};
    }
  }

  const merged = {
    ...source,
    ...existing,
    metadata: { ...source.metadata, ...existing.metadata },
    routes: { ...source.routes, ...existing.routes },
    headers: { ...source.headers, ...existing.headers },
    ignore: existing.ignore ?? source.ignore ?? [],
  };

  fs.writeFileSync(wsTarget, JSON.stringify(merged, null, 2) + '\n');

  if (merged.object_id) {
    fs.writeFileSync(wsSource, JSON.stringify(merged, null, 2) + '\n');
    console.log('Synced object_id to frontend/ws-resources.json:', merged.object_id);
  }

  console.log('Wrote', path.relative(rootDir, wsTarget));
}

console.log('Nami Walrus Sites dist prepare');
console.log('==============================');

run('Build @nami/sdk', 'npm', ['run', 'build'], sdkDir);
run('Build frontend', 'npm', ['run', 'build'], frontendDir);
mergeWsResourcesIntoDist();

console.log('');
console.log('Ready:', path.relative(rootDir, distDir));
console.log('Next: node scripts/deploy-walrus-sites.mjs --dry-run');