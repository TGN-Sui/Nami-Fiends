import dotenv from 'dotenv';

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
  fullnodeUrl: process.env.SUI_FULLNODE_URL ?? 'http://127.0.0.1:9000',

  pollIntervalMs: readNumber('NAMI_POLL_INTERVAL_MS', 5000),
  pageLimit: readNumber('NAMI_PAGE_LIMIT', 50),
  maxPagesPerModule: readNumber('NAMI_MAX_PAGES_PER_MODULE', 5),

  cursorPath: process.env.NAMI_CURSOR_PATH ?? 'data/cursors.json',
  eventLogPath: process.env.NAMI_EVENT_LOG_PATH ?? 'data/events.jsonl'
} as const;

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