import { createHash } from 'node:crypto';

import {
  isWalrusBorderArtConfigured,
  readWalrusBorderArtConfig,
  type WalrusBorderArtConfig,
} from '../walrus-config.js';

export type WalrusQuiltPatchRef = {
  kind: 'walrus-quilt-patch';
  quiltBlobId: string;
  patchId: string;
  aggregatorBase: string;
  contentHash: string;
  contentType: string;
  rewardId: string;
  artKind: 'static' | 'animated';
  catalogVersionMs: number;
};

export type BorderArtQuiltPatchInput = {
  rewardId: string;
  artKind: 'static' | 'animated';
  contentType: string;
  bytes: Buffer;
  contentHash: string;
  owner: string;
  catalogVersionMs: number;
};

export type QuiltPublishPatchResult = {
  rewardId: string;
  artKind: 'static' | 'animated';
  patchId: string;
  identifier: string;
  ref: WalrusQuiltPatchRef;
  aggregatorUrl: string;
};

export type QuiltPublishResult = {
  quiltBlobId: string;
  patches: QuiltPublishPatchResult[];
};

type QuiltStoreResponse = {
  blobStoreResult?: {
    newlyCreated?: {
      blobObject?: {
        blobId?: string;
      };
    };
    alreadyCertified?: {
      blobId?: string;
    };
  };
  storedQuiltBlobs?: Array<{
    identifier?: string;
    quiltPatchId?: string;
  }>;
};

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

let publishFetch: typeof fetch = globalThis.fetch;

export function setWalrusQuiltPublishFetchForTests(fetchFn: typeof fetch | null): void {
  publishFetch = fetchFn ?? globalThis.fetch;
}

export function isWalrusBorderArtEnabled(
  walrusConfig: WalrusBorderArtConfig = readWalrusBorderArtConfig()
): boolean {
  return isWalrusBorderArtConfigured(walrusConfig);
}

export function buildQuiltPatchIdentifier(rewardId: string, artKind: 'static' | 'animated'): string {
  const safeRewardId = rewardId.replace(/[^a-zA-Z0-9._-]/g, '');

  if (!safeRewardId) {
    throw new Error('invalid_reward_id');
  }

  return safeRewardId + '-' + artKind;
}

export function buildAggregatorPatchUrl(aggregatorBase: string, patchId: string): string {
  const base = aggregatorBase.replace(/\/$/, '');

  return base + '/v1/blobs/by-quilt-patch-id/' + encodeURIComponent(patchId);
}

export function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function buildWalrusQuiltPatchRef(input: {
  quiltBlobId: string;
  patchId: string;
  aggregatorBase: string;
  contentHash: string;
  contentType: string;
  rewardId: string;
  artKind: 'static' | 'animated';
  catalogVersionMs: number;
}): WalrusQuiltPatchRef {
  return {
    kind: 'walrus-quilt-patch',
    quiltBlobId: input.quiltBlobId,
    patchId: input.patchId,
    aggregatorBase: input.aggregatorBase.replace(/\/$/, ''),
    contentHash: input.contentHash,
    contentType: input.contentType,
    rewardId: input.rewardId,
    artKind: input.artKind,
    catalogVersionMs: input.catalogVersionMs,
  };
}

function extensionForContentType(contentType: string): string {
  return MIME_EXTENSIONS[contentType] ?? '.bin';
}

function resolveQuiltBlobId(body: QuiltStoreResponse): string | null {
  const created = body.blobStoreResult?.newlyCreated?.blobObject?.blobId;
  const certified = body.blobStoreResult?.alreadyCertified?.blobId;

  return typeof created === 'string' && created.trim()
    ? created.trim()
    : typeof certified === 'string' && certified.trim()
      ? certified.trim()
      : null;
}

function resolvePatchLookup(
  patches: BorderArtQuiltPatchInput[],
  storedQuiltBlobs: QuiltStoreResponse['storedQuiltBlobs']
): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const entry of storedQuiltBlobs ?? []) {
    const identifier = typeof entry.identifier === 'string' ? entry.identifier.trim() : '';
    const patchId = typeof entry.quiltPatchId === 'string' ? entry.quiltPatchId.trim() : '';

    if (!identifier || !patchId) {
      continue;
    }

    lookup.set(identifier, patchId);
  }

  for (const patch of patches) {
    const identifier = buildQuiltPatchIdentifier(patch.rewardId, patch.artKind);

    if (!lookup.has(identifier)) {
      throw new Error('quilt_publish_failed');
    }
  }

  return lookup;
}

export async function publishBorderArtQuilt(
  patches: BorderArtQuiltPatchInput[],
  walrusConfig: WalrusBorderArtConfig = readWalrusBorderArtConfig()
): Promise<QuiltPublishResult> {
  if (patches.length === 0) {
    throw new Error('quilt_publish_empty');
  }

  if (!isWalrusBorderArtConfigured(walrusConfig)) {
    throw new Error('quilt_publish_not_configured');
  }

  const form = new FormData();
  const metadata: Array<{ identifier: string; tags: Record<string, string> }> = [];

  for (const patch of patches) {
    const identifier = buildQuiltPatchIdentifier(patch.rewardId, patch.artKind);
    const extension = extensionForContentType(patch.contentType);
    const blob = new Blob([Uint8Array.from(patch.bytes)], { type: patch.contentType });

    form.append(identifier, blob, identifier + extension);
    metadata.push({
      identifier,
      tags: {
        'nami:asset-type': 'border-art',
        'nami:reward-id': patch.rewardId,
        'nami:art-kind': patch.artKind,
        'nami:catalog-version': String(patch.catalogVersionMs),
        'nami:owner': patch.owner,
        'nami:content-hash': 'sha256:' + patch.contentHash,
      },
    });
  }

  form.append('_metadata', JSON.stringify(metadata));

  const publisherUrl = walrusConfig.publisherUrl.replace(/\/$/, '');
  const url =
    publisherUrl +
    '/v1/quilts?epochs=' +
    encodeURIComponent(String(walrusConfig.storageEpochs));

  let response: Response;

  try {
    response = await publishFetch(url, {
      method: 'PUT',
      body: form,
    });
  } catch {
    throw new Error('quilt_publish_failed');
  }

  if (!response.ok) {
    throw new Error('quilt_publish_failed');
  }

  let body: QuiltStoreResponse;

  try {
    body = (await response.json()) as QuiltStoreResponse;
  } catch {
    throw new Error('quilt_publish_failed');
  }

  const quiltBlobId = resolveQuiltBlobId(body);

  if (!quiltBlobId) {
    throw new Error('quilt_publish_failed');
  }

  const patchLookup = resolvePatchLookup(patches, body.storedQuiltBlobs);
  const publishedPatches: QuiltPublishPatchResult[] = [];

  for (const patch of patches) {
    const identifier = buildQuiltPatchIdentifier(patch.rewardId, patch.artKind);
    const patchId = patchLookup.get(identifier);

    if (!patchId) {
      throw new Error('quilt_publish_failed');
    }

    const ref = buildWalrusQuiltPatchRef({
      quiltBlobId,
      patchId,
      aggregatorBase: walrusConfig.aggregatorUrl,
      contentHash: patch.contentHash,
      contentType: patch.contentType,
      rewardId: patch.rewardId,
      artKind: patch.artKind,
      catalogVersionMs: patch.catalogVersionMs,
    });

    publishedPatches.push({
      rewardId: patch.rewardId,
      artKind: patch.artKind,
      patchId,
      identifier,
      ref,
      aggregatorUrl: buildAggregatorPatchUrl(walrusConfig.aggregatorUrl, patchId),
    });
  }

  return {
    quiltBlobId,
    patches: publishedPatches,
  };
}