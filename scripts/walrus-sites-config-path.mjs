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

export const WALRUS_SITE_EPOCH_DURATION_MS = 24 * 60 * 60 * 1000;
export const WALRUS_SITE_RENEWAL_BUFFER_EPOCHS = 1;

export function computeWalrusSitesRenewalDue(projection, nowMs = Date.now()) {
  const anchorMs = Math.max(
    Number(projection?.last_renew_ms ?? 0),
    Number(projection?.last_deploy_ms ?? 0),
  );

  if (!anchorMs) {
    return {
      renewal_due: false,
      expires_at_ms: null,
      epochs_remaining_approx: null,
    };
  }

  const epochs = Number(projection?.storage_epochs) > 0 ? Number(projection.storage_epochs) : 5;
  const expiresAtMs = anchorMs + epochs * WALRUS_SITE_EPOCH_DURATION_MS;
  const bufferMs = WALRUS_SITE_RENEWAL_BUFFER_EPOCHS * WALRUS_SITE_EPOCH_DURATION_MS;
  const renewalDue = nowMs >= expiresAtMs - bufferMs;
  const remainingMs = Math.max(0, expiresAtMs - nowMs);
  const epochsRemainingApprox = Math.ceil(remainingMs / WALRUS_SITE_EPOCH_DURATION_MS);

  return {
    renewal_due: renewalDue,
    expires_at_ms: expiresAtMs,
    epochs_remaining_approx: epochsRemainingApprox,
  };
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