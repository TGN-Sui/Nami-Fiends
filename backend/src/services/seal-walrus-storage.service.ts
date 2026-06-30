import {
  isWalrusBorderArtConfigured,
  readWalrusBorderArtConfig,
  type WalrusBorderArtConfig,
} from '../walrus-config.js';

export type SealWalrusBlobStoreResponse = {
  newlyCreated?: {
    blobObject?: {
      blobId?: string;
    };
  };
  alreadyCertified?: {
    blobId?: string;
  };
};

export type SealWalrusUploadResult = {
  blob_id: string;
  storage_epochs: number;
  uploaded_ms: number;
};

let storageFetch: typeof fetch = globalThis.fetch;

export function setSealWalrusStorageFetchForTests(fetchFn: typeof fetch | null): void {
  storageFetch = fetchFn ?? globalThis.fetch;
}

export function isSealWalrusStorageConfigured(
  walrusConfig: WalrusBorderArtConfig = readWalrusBorderArtConfig()
): boolean {
  return isWalrusBorderArtConfigured(walrusConfig) && walrusConfig.publisherUrl.trim() !== '';
}

function resolveBlobId(body: SealWalrusBlobStoreResponse): string | null {
  const created = body.newlyCreated?.blobObject?.blobId;
  const certified = body.alreadyCertified?.blobId;

  return typeof created === 'string' && created.trim()
    ? created.trim()
    : typeof certified === 'string' && certified.trim()
      ? certified.trim()
      : null;
}

export async function uploadSealCiphertextToWalrus(
  ciphertextBytes: Buffer,
  walrusConfig: WalrusBorderArtConfig = readWalrusBorderArtConfig()
): Promise<SealWalrusUploadResult> {
  if (!isSealWalrusStorageConfigured(walrusConfig)) {
    throw new Error('seal_walrus_not_configured');
  }

  const publisherUrl = walrusConfig.publisherUrl.replace(/\/$/, '');
  const url =
    publisherUrl +
    '/v1/blobs?epochs=' +
    encodeURIComponent(String(walrusConfig.storageEpochs)) +
    '&deletable=true';

  let response: Response;

  try {
    response = await storageFetch(url, {
      method: 'PUT',
      headers: {
        'content-type': 'application/octet-stream',
      },
      body: new Uint8Array(ciphertextBytes),
    });
  } catch {
    throw new Error('seal_walrus_upload_failed');
  }

  if (!response.ok) {
    throw new Error('seal_walrus_upload_failed');
  }

  let body: SealWalrusBlobStoreResponse;

  try {
    body = (await response.json()) as SealWalrusBlobStoreResponse;
  } catch {
    throw new Error('seal_walrus_upload_failed');
  }

  const blobId = resolveBlobId(body);

  if (!blobId) {
    throw new Error('seal_walrus_upload_failed');
  }

  return {
    blob_id: blobId,
    storage_epochs: walrusConfig.storageEpochs,
    uploaded_ms: Date.now(),
  };
}

export function buildSealWalrusAggregatorBlobUrl(
  aggregatorBase: string,
  blobId: string
): string {
  const base = aggregatorBase.replace(/\/$/, '');

  return base + '/v1/blobs/' + encodeURIComponent(blobId);
}

export async function fetchSealCiphertextFromWalrus(
  blobId: string,
  walrusConfig: WalrusBorderArtConfig = readWalrusBorderArtConfig()
): Promise<Buffer> {
  if (!isWalrusBorderArtConfigured(walrusConfig)) {
    throw new Error('seal_walrus_not_configured');
  }

  const url = buildSealWalrusAggregatorBlobUrl(walrusConfig.aggregatorUrl, blobId);
  let response: Response;

  try {
    response = await storageFetch(url, { method: 'GET' });
  } catch {
    throw new Error('seal_walrus_fetch_failed');
  }

  if (!response.ok) {
    throw new Error('seal_walrus_fetch_failed');
  }

  const bytes = Buffer.from(await response.arrayBuffer());

  if (bytes.length === 0) {
    throw new Error('seal_walrus_fetch_failed');
  }

  return bytes;
}