import dotenv from 'dotenv';

import { readWalrusBorderArtConfig } from './walrus-config.js';

dotenv.config();

export type NamiNetwork = 'devnet' | 'testnet' | 'mainnet' | 'localnet';

function readNetwork(): NamiNetwork {
  const value = process.env.NAMI_NETWORK ?? 'testnet';

  if (
    value === 'devnet' ||
    value === 'testnet' ||
    value === 'mainnet' ||
    value === 'localnet'
  ) {
    return value;
  }

  throw new Error(
    `Invalid NAMI_NETWORK "${value}". Expected devnet, testnet, mainnet, or localnet.`
  );
}

function readBoolean(name: string, fallback = false): boolean {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

function readNumber(name: string, fallback: number): number {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}. Expected a positive number.`);
  }

  return parsed;
}

export const config = {
  network: readNetwork(),
  packageId: process.env.NAMI_PACKAGE_ID ?? '',
  nodenameRegistryId: process.env.NAMI_NODENAME_REGISTRY_ID ?? '',
  adminCapId: process.env.NAMI_ADMIN_CAP_ID ?? '',
  officialOwner: process.env.NAMI_OFFICIAL_OWNER ?? '',
  officialOwnerEmail: (process.env.NAMI_OFFICIAL_OWNER_EMAIL ?? '').trim().toLowerCase(),
  testLaunch: readBoolean('NAMI_TEST_LAUNCH'),
  fullnodeUrl: process.env.SUI_FULLNODE_URL ?? 'http://127.0.0.1:9000',

  pollIntervalMs: readNumber('NAMI_POLL_INTERVAL_MS', 5000),
  pageLimit: readNumber('NAMI_PAGE_LIMIT', 50),
  maxPagesPerModule: readNumber('NAMI_MAX_PAGES_PER_MODULE', 5),

  dataDir: (process.env.NAMI_DATA_DIR ?? 'data').trim().replace(/\/$/, '') || 'data',
  cursorPath: process.env.NAMI_CURSOR_PATH ?? 'data/cursors.json',
  eventLogPath: process.env.NAMI_EVENT_LOG_PATH ?? 'data/events.jsonl',

  httpEnabled: (process.env.NAMI_HTTP_ENABLED ?? 'true').toLowerCase() !== 'false',
  httpPort: readNumber('PORT', readNumber('NAMI_HTTP_PORT', 8787)),
  publicApiUrl: (process.env.NAMI_PUBLIC_API_URL ?? '').trim().replace(/\/$/, ''),

  alertWebhookUrl: process.env.NAMI_ALERT_WEBHOOK_URL ?? '',
  alertFailureThreshold: readNumber('NAMI_ALERT_FAILURE_THRESHOLD', 3),

  resendApiKey: (process.env.RESEND_API_KEY ?? '').trim(),
  transferEmailFrom: (process.env.NAMI_TRANSFER_EMAIL_FROM ?? '').trim(),
  transferPortalUrl: (
    process.env.NAMI_TRANSFER_PORTAL_URL ?? 'https://nami-fiends.vercel.app'
  )
    .trim()
    .replace(/\/$/, ''),

  get walrus() {
    return readWalrusBorderArtConfig();
  },
};

export function assertRuntimeConfig(): void {
  if (config.packageId.trim() === '') {
    throw new Error(
      'Missing NAMI_PACKAGE_ID. Add it to backend/.env after publishing the Move package.'
    );
  }

  if (!config.packageId.startsWith('0x')) {
    throw new Error('Invalid NAMI_PACKAGE_ID. Expected a Sui object/package ID starting with 0x.');
  }
}