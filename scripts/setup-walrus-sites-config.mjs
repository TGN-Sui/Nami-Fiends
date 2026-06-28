#!/usr/bin/env node
/**
 * Copy Walrus Sites config template to the default user config path.
 *
 * Usage:
 *   node scripts/setup-walrus-sites-config.mjs
 *   node scripts/setup-walrus-sites-config.mjs --force
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  defaultWalrusSitesConfigPath,
  exampleWalrusSitesConfigPath,
} from './walrus-sites-config-path.mjs';

const force = process.argv.includes('--force');
const targetPath = defaultWalrusSitesConfigPath();
const sourcePath = exampleWalrusSitesConfigPath();

if (!fs.existsSync(sourcePath)) {
  console.error('Missing template:', sourcePath);
  process.exit(1);
}

if (fs.existsSync(targetPath) && !force) {
  console.log('Walrus Sites config already exists:', targetPath);
  console.log('Re-run with --force to overwrite.');
  process.exit(0);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);

console.log('Copied Walrus Sites config:');
console.log('  from', sourcePath);
console.log('  to  ', targetPath);
console.log('');
console.log('Next steps:');
console.log('  1. Ensure Sui + Walrus CLI wallets are funded on testnet');
console.log('  2. node scripts/verify-walrus-sites-ready.mjs');
console.log('  3. node scripts/deploy-walrus-sites.mjs --epochs 5 --context testnet');