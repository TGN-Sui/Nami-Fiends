import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  buildAggregatorPatchUrl,
  buildQuiltPatchIdentifier,
  buildWalrusQuiltPatchRef,
  publishBorderArtQuilt,
  setWalrusQuiltPublishFetchForTests,
  sha256Hex,
} from './walrus-quilt-publisher.service.js';
import type { WalrusBorderArtConfig } from '../walrus-config.js';

const TEST_WALRUS_CONFIG: WalrusBorderArtConfig = {
  network: 'testnet',
  aggregatorUrl: 'https://aggregator.test',
  publisherUrl: 'https://publisher.test',
  signerKey: '',
  borderArtRequired: false,
  storageEpochs: 3,
};

describe('walrus-quilt-publisher.service', () => {
  afterEach(() => {
    setWalrusQuiltPublishFetchForTests(null);
  });

  it('builds stable quilt patch identifiers', () => {
    assert.equal(buildQuiltPatchIdentifier('overlay-signal-glow', 'static'), 'overlay-signal-glow-static');
    assert.equal(buildQuiltPatchIdentifier('overlay-signal-glow', 'animated'), 'overlay-signal-glow-animated');
  });

  it('builds aggregator patch URLs', () => {
    const url = buildAggregatorPatchUrl(
      'https://aggregator.walrus-testnet.walrus.space',
      '6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKoBAQDQAA'
    );

    assert.equal(
      url,
      'https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id/6XUOE-Q5-nAXHRifN6n9nomVDtHZQbGuAkW3PjlBuKoBAQDQAA'
    );
  });

  it('hashes patch bytes with sha256', () => {
    const bytes = Buffer.from('border-art-bytes');
    const hash = sha256Hex(bytes);

    assert.equal(hash.length, 64);
    assert.match(hash, /^[a-f0-9]{64}$/);
  });

  it('publishes border art patches and maps quilt refs', async () => {
    const bytes = Buffer.from('test-border-art');

    setWalrusQuiltPublishFetchForTests(async (input, init) => {
      assert.equal(input, 'https://publisher.test/v1/quilts?epochs=3');
      assert.equal(init?.method, 'PUT');
      assert.ok(init?.body instanceof FormData);

      return new Response(
        JSON.stringify({
          blobStoreResult: {
            newlyCreated: {
              blobObject: {
                blobId: 'quilt-blob-123',
              },
            },
          },
          storedQuiltBlobs: [
            {
              identifier: 'overlay-signal-glow-static',
              quiltPatchId: 'quilt-blob-123PATCH001',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    });

    const result = await publishBorderArtQuilt(
      [
        {
          rewardId: 'overlay-signal-glow',
          artKind: 'static',
          contentType: 'image/png',
          bytes,
          contentHash: sha256Hex(bytes),
          owner: '0xabc',
          catalogVersionMs: 1_700_000_000_000,
        },
      ],
      TEST_WALRUS_CONFIG
    );

    assert.equal(result.quiltBlobId, 'quilt-blob-123');
    assert.equal(result.patches.length, 1);
    assert.equal(result.patches[0]?.patchId, 'quilt-blob-123PATCH001');
    assert.equal(
      result.patches[0]?.aggregatorUrl,
      'https://aggregator.test/v1/blobs/by-quilt-patch-id/quilt-blob-123PATCH001'
    );

    const ref = buildWalrusQuiltPatchRef({
      quiltBlobId: result.quiltBlobId,
      patchId: result.patches[0]!.patchId,
      aggregatorBase: TEST_WALRUS_CONFIG.aggregatorUrl,
      contentHash: sha256Hex(bytes),
      contentType: 'image/png',
      rewardId: 'overlay-signal-glow',
      artKind: 'static',
      catalogVersionMs: 1_700_000_000_000,
    });

    assert.equal(ref.kind, 'walrus-quilt-patch');
    assert.equal(ref.rewardId, 'overlay-signal-glow');
  });

  it('throws quilt_publish_failed when publisher returns a non-200 response', async () => {
    setWalrusQuiltPublishFetchForTests(async () => new Response('upstream error', { status: 503 }));

    await assert.rejects(
      () =>
        publishBorderArtQuilt(
          [
            {
              rewardId: 'overlay-wave-frame',
              artKind: 'static',
              contentType: 'image/png',
              bytes: Buffer.from('frame'),
              contentHash: sha256Hex(Buffer.from('frame')),
              owner: '0xabc',
              catalogVersionMs: 1,
            },
          ],
          TEST_WALRUS_CONFIG
        ),
      /quilt_publish_failed/
    );
  });
});