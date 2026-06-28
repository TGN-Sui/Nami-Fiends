import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export function defaultWalrusSitesConfigPath() {
  const home = process.env.USERPROFILE || process.env.HOME || os.homedir();

  return path.join(home, '.config', 'walrus', 'sites-config.yaml');
}

export function exampleWalrusSitesConfigPath() {
  return path.join(rootDir, 'config', 'walrus-sites-config.example.yaml');
}

export function resolveWalrusSitesConfigPath(explicitPath = '') {
  const trimmed = explicitPath.trim();

  if (trimmed) {
    return trimmed;
  }

  const defaults = defaultWalrusSitesConfigPath();

  if (fs.existsSync(defaults)) {
    return defaults;
  }

  return '';
}

export function readWalrusSiteProjection(root = rootDir) {
  const candidates = [
    path.join(root, 'backend', 'data', 'projections', 'walrus-site.json'),
    path.join(root, 'data', 'projections', 'walrus-site.json'),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return null;
    }
  }

  return null;
}