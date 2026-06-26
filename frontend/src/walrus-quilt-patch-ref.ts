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

export function normalizeWalrusQuiltPatchRef(value: unknown): WalrusQuiltPatchRef | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (record.kind !== 'walrus-quilt-patch') {
    return null;
  }

  const quiltBlobId = typeof record.quiltBlobId === 'string' ? record.quiltBlobId.trim() : '';
  const patchId = typeof record.patchId === 'string' ? record.patchId.trim() : '';
  const aggregatorBase =
    typeof record.aggregatorBase === 'string' ? record.aggregatorBase.trim() : '';
  const contentHash = typeof record.contentHash === 'string' ? record.contentHash.trim() : '';
  const contentType = typeof record.contentType === 'string' ? record.contentType.trim() : '';
  const rewardId = typeof record.rewardId === 'string' ? record.rewardId.trim() : '';
  const artKind =
    record.artKind === 'animated' ? 'animated' : record.artKind === 'static' ? 'static' : null;
  const catalogVersionMs =
    typeof record.catalogVersionMs === 'number' && Number.isFinite(record.catalogVersionMs)
      ? record.catalogVersionMs
      : null;

  if (
    !quiltBlobId ||
    !patchId ||
    !aggregatorBase ||
    !contentHash ||
    !contentType ||
    !rewardId ||
    !artKind ||
    catalogVersionMs === null
  ) {
    return null;
  }

  return {
    kind: 'walrus-quilt-patch',
    quiltBlobId,
    patchId,
    aggregatorBase,
    contentHash,
    contentType,
    rewardId,
    artKind,
    catalogVersionMs,
  };
}

export function buildAggregatorPatchUrl(aggregatorBase: string, patchId: string): string {
  const base = aggregatorBase.replace(/\/$/, '');

  return base + '/v1/blobs/by-quilt-patch-id/' + encodeURIComponent(patchId);
}

export function buildBorderArtUrlFromRef(ref: WalrusQuiltPatchRef): string {
  return buildAggregatorPatchUrl(ref.aggregatorBase, ref.patchId);
}

export function isWalrusAggregatorUrl(url: string): boolean {
  const trimmed = url.trim();

  return (
    /\/v1\/blobs\/by-quilt-patch-id\//i.test(trimmed) ||
    /aggregator\.walrus/i.test(trimmed) ||
    /\.walrus\.space/i.test(trimmed)
  );
}