import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  buildSealWalrusAggregatorBlobUrl,
  fetchSealCiphertextFromWalrus,
  isSealWalrusStorageConfigured,
  setSealWalrusStorageFetchForTests,
  uploadSealCiphertextToWalrus,
} from './seal-walrus-storage.service.js';

describe('seal-walrus-storage.service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NAMI_WALRUS_NETWORK = 'testnet';
    process.env.NAMI_WALRUS_PUBLISHER_URL = 'https://publisher.test';
    process.env.NAMI_WALRUS_AGGREGATOR_URL = 'https://aggregator.test';
    process.env.NAMI_WALRUS_STORAGE_EPOCHS = '3';
    setSealWalrusStorageFetchForTests(null);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setSealWalrusStorageFetchForTests(null);
  });

  it('reports configured when publisher and aggregator URLs are set', async () => {
    const { readWalrusBorderArtConfig } = await import('../walrus-config.js');
    const configured = isSealWalrusStorageConfigured(readWalrusBorderArtConfig());

    assert.equal(configured, true);
  });

  it('uploads ciphertext bytes and returns blob id', async () => {
    setSealWalrusStorageFetchForTests(async (input, init) => {
      assert.equal(input, 'https://publisher.test/v1/blobs?epochs=3&deletable=true');
      assert.equal(init?.method, 'PUT');

      return new Response(
        JSON.stringify({
          newlyCreated: {
            blobObject: {
              blobId: 'blob-seal-123',
            },
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });

    const uploaded = await uploadSealCiphertextToWalrus(Buffer.from('cipher-bytes'));

    assert.equal(uploaded.blob_id, 'blob-seal-123');
    assert.equal(uploaded.storage_epochs, 3);
  });

  it('fetches ciphertext bytes from the aggregator', async () => {
    setSealWalrusStorageFetchForTests(async (input, init) => {
      assert.equal(init?.method, 'GET');
      assert.equal(
        input,
        buildSealWalrusAggregatorBlobUrl('https://aggregator.test', 'blob-seal-123'),
      );

      return new Response(Buffer.from('cipher-bytes'), { status: 200 });
    });

    const bytes = await fetchSealCiphertextFromWalrus('blob-seal-123');

    assert.equal(bytes.toString('utf8'), 'cipher-bytes');
  });

  it('throws when publisher is not configured', async () => {
    delete process.env.NAMI_WALRUS_PUBLISHER_URL;
    delete process.env.NAMI_WALRUS_NETWORK;

    await assert.rejects(
      () => uploadSealCiphertextToWalrus(Buffer.from('cipher-bytes')),
      /seal_walrus_not_configured/,
    );
  });
});