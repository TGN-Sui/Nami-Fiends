#!/usr/bin/env node
/**
 * Ensures core passport objects stay soulbound (key ability only — no store).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcesDir = path.join(__dirname, '..', 'contracts', 'nami', 'sources');

const SOULBOUND_TYPES = ['Identity', 'Passport', 'Profile', 'Badge', 'ConductStatus'];

const forbidden = /\bstruct\s+(Identity|Passport|Profile|Badge|ConductStatus)\s+has\s+key\s*,\s*store\b/;
const required = /\bstruct\s+(Identity|Passport|Profile|Badge|ConductStatus)\s+has\s+key\s*\{/;

let failed = 0;

for (const fileName of fs.readdirSync(sourcesDir)) {
  if (!fileName.endsWith('.move')) {
    continue;
  }

  const text = fs.readFileSync(path.join(sourcesDir, fileName), 'utf8');

  if (forbidden.test(text)) {
    console.error(`FAIL ${fileName}: passport objects must not declare store (soulbound)`);
    failed += 1;
  }
}

for (const typeName of SOULBOUND_TYPES) {
  const pattern = new RegExp(`\\bstruct\\s+${typeName}\\s+has\\s+key\\s*\\{`);
  const found = fs
    .readdirSync(sourcesDir)
    .filter((fileName) => fileName.endsWith('.move'))
    .some((fileName) => pattern.test(fs.readFileSync(path.join(sourcesDir, fileName), 'utf8')));

  if (!found) {
    console.error(`FAIL missing soulbound struct definition: ${typeName}`);
    failed += 1;
  } else {
    console.log(`PASS ${typeName} is key-only (soulbound)`);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('All soulbound struct checks passed.');