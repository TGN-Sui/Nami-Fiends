import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  computeCatalogContentRootHash,
  isCatalogAttestationEnabled,
} from './chat-overlay-catalog-attestation.service.js';
import type { OfficialChatOverlayReward } from './chat-overlay-rewards.service.js';

function rewardWithRefs(): OfficialChatOverlayReward {
  return {
    id: 'overlay-test',
    name: 'Test',
    description: '',
    borderStyle: 'signal-glow',
    motion: 'static',
    accent: 'cyan',
    staticArtUrl: 'https://aggregator.example/v1/blobs/by-quilt-patch-id/patch-a',
    animatedArtUrl: null,
    staticArtRef: {
      kind: 'walrus-quilt-patch',
      quiltBlobId: 'quilt-1',
      patchId: 'patch-a',
      aggregatorBase: 'https://aggregator.example',
      contentHash: 'hash-a',
      contentType: 'image/png',
      rewardId: 'overlay-test',
      artKind: 'static',
      catalogVersionMs: 1_700_000_000_000,
    },
    animatedArtRef: null,
    artSliceInsets: { top: 1, right: 1, bottom: 1, left: 1 },
    displayWidths: { top: 1, right: 1, bottom: 1, left: 1 },
    condition: { type: 'verified' },
    enabled: true,
    updatedAtMs: 1,
  };
}

describe('chat-overlay-catalog-attestation.service', () => {
  it('keeps on-chain attestation disabled unless explicitly enabled', () => {
    const previous = process.env.NAMI_CATALOG_ATTEST_ENABLED;

    delete process.env.NAMI_CATALOG_ATTEST_ENABLED;
    assert.equal(isCatalogAttestationEnabled(), false);

    process.env.NAMI_CATALOG_ATTEST_ENABLED = 'true';
    assert.equal(isCatalogAttestationEnabled(), true);

    if (previous === undefined) {
      delete process.env.NAMI_CATALOG_ATTEST_ENABLED;
    } else {
      process.env.NAMI_CATALOG_ATTEST_ENABLED = previous;
    }
  });

  it('computes a stable root hash from quilt patch refs', () => {
    const first = computeCatalogContentRootHash([rewardWithRefs()]);
    const second = computeCatalogContentRootHash([rewardWithRefs()]);

    assert.equal(first, second);
    assert.match(first, /^[a-f0-9]{64}$/);
  });
});