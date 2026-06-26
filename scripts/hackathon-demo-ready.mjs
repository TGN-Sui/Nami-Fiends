#!/usr/bin/env node
/**
 * Pre-demo gate: testnet env/readiness + live Walrus border-art smoke.
 *
 * Usage:
 *   node scripts/hackathon-demo-ready.mjs
 *   node scripts/hackathon-demo-ready.mjs --indexer-url https://nami-backend-rv0o.onrender.com
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function readPassthroughArgs() {
  const indexerUrl = process.argv.includes('--indexer-url')
    ? process.argv[process.argv.indexOf('--indexer-url') + 1]
    : '';

  return indexerUrl ? ['--indexer-url', indexerUrl] : [];
}

function runScript(scriptName, extraArgs = []) {
  const scriptPath = path.join(rootDir, 'scripts', scriptName);
  const result = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });

  return result.status ?? 1;
}

console.log('');
console.log('Nami hackathon demo readiness');
console.log('=============================');
console.log('');

const passthrough = readPassthroughArgs();
const verifyExit = runScript('verify-testnet-ready.mjs', passthrough);

if (verifyExit !== 0) {
  process.exit(verifyExit);
}

console.log('');
console.log('Walrus border art smoke');
console.log('-----------------------');
console.log('');

const smokeExit = runScript('smoke-border-art-walrus.mjs', passthrough);
process.exit(smokeExit);