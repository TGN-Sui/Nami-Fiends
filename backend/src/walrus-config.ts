export type WalrusNetwork = 'testnet' | 'mainnet';

export type WalrusBorderArtConfig = {
  network: WalrusNetwork | null;
  aggregatorUrl: string;
  publisherUrl: string;
  signerKey: string;
  borderArtRequired: boolean;
  storageEpochs: number;
};

const DEFAULT_AGGREGATOR_URLS: Record<WalrusNetwork, string> = {
  testnet: 'https://aggregator.walrus-testnet.walrus.space',
  mainnet: 'https://aggregator.walrus-mainnet.walrus.space',
};

const DEFAULT_PUBLISHER_URLS: Record<WalrusNetwork, string> = {
  testnet: 'https://publisher.walrus-testnet.walrus.space',
  mainnet: '',
};

function readBoolean(name: string, fallback = false): boolean {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

function readPositiveNumber(name: string, fallback: number): number {
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

function readWalrusNetwork(): WalrusNetwork | null {
  const value = (process.env.NAMI_WALRUS_NETWORK ?? '').trim().toLowerCase();

  if (value === '') {
    return null;
  }

  if (value === 'testnet' || value === 'mainnet') {
    return value;
  }

  throw new Error(`Invalid NAMI_WALRUS_NETWORK "${value}". Expected testnet or mainnet.`);
}

function readUrl(name: string): string {
  return (process.env[name] ?? '').trim().replace(/\/$/, '');
}

export function readWalrusBorderArtConfig(): WalrusBorderArtConfig {
  const network = readWalrusNetwork();
  const explicitAggregator = readUrl('NAMI_WALRUS_AGGREGATOR_URL');
  const explicitPublisher = readUrl('NAMI_WALRUS_PUBLISHER_URL');

  return {
    network,
    aggregatorUrl:
      explicitAggregator !== ''
        ? explicitAggregator
        : network
          ? DEFAULT_AGGREGATOR_URLS[network]
          : '',
    publisherUrl:
      explicitPublisher !== ''
        ? explicitPublisher
        : network
          ? DEFAULT_PUBLISHER_URLS[network]
          : '',
    signerKey: (process.env.NAMI_WALRUS_SIGNER_KEY ?? '').trim(),
    borderArtRequired: readBoolean('NAMI_WALRUS_BORDER_ART_REQUIRED'),
    storageEpochs: readPositiveNumber('NAMI_WALRUS_STORAGE_EPOCHS', 5),
  };
}

export function isWalrusBorderArtConfigured(
  walrusConfig: WalrusBorderArtConfig = readWalrusBorderArtConfig()
): boolean {
  return walrusConfig.publisherUrl !== '' && walrusConfig.aggregatorUrl !== '';
}