import { readJsonFile, writeJsonFile } from '../storage.js';

type CryptoTxDedupStore = {
  usedDigests: Record<string, { paymentId: string; usedAtMs: number }>;
};

const DEDUP_PATH = 'data/projections/used-crypto-tx-digests.json';

function emptyStore(): CryptoTxDedupStore {
  return { usedDigests: {} };
}

async function readStore(): Promise<CryptoTxDedupStore> {
  const stored = await readJsonFile<CryptoTxDedupStore>(DEDUP_PATH, emptyStore());

  return {
    usedDigests:
      typeof stored.usedDigests === 'object' && stored.usedDigests !== null
        ? stored.usedDigests
        : {},
  };
}

async function writeStore(store: CryptoTxDedupStore): Promise<void> {
  await writeJsonFile(DEDUP_PATH, store);
}

export async function assertTxDigestUnused(txDigest: string, paymentId: string): Promise<void> {
  const normalizedDigest = txDigest.trim();
  const normalizedPaymentId = paymentId.trim();

  if (!normalizedDigest || !normalizedPaymentId) {
    throw new Error('invalid_tx_digest');
  }

  const store = await readStore();
  const existing = store.usedDigests[normalizedDigest];

  if (existing && existing.paymentId !== normalizedPaymentId) {
    throw new Error('tx_digest_already_used');
  }
}

export async function recordTxDigestUse(txDigest: string, paymentId: string): Promise<void> {
  const normalizedDigest = txDigest.trim();
  const normalizedPaymentId = paymentId.trim();

  if (!normalizedDigest || !normalizedPaymentId) {
    return;
  }

  const store = await readStore();

  store.usedDigests[normalizedDigest] = {
    paymentId: normalizedPaymentId,
    usedAtMs: Date.now(),
  };

  await writeStore(store);
}