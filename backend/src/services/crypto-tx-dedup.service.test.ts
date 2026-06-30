import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

describe('crypto-tx-dedup.service', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-tx-dedup-'));
    process.env.NAMI_DATA_DIR = tempDir;
  });

  afterEach(() => {
    process.env = { ...originalEnv };

    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects digest reuse across different payment intents', async () => {
    const { assertTxDigestUnused, recordTxDigestUse } = await import('./crypto-tx-dedup.service.js');

    await recordTxDigestUse('0xabc', 'payment-a');

    await assert.rejects(
      () => assertTxDigestUnused('0xabc', 'payment-b'),
      /tx_digest_already_used/,
    );
  });

  it('allows the same digest for the same payment intent', async () => {
    const { assertTxDigestUnused, recordTxDigestUse } = await import('./crypto-tx-dedup.service.js');

    await recordTxDigestUse('0xdef', 'payment-a');
    await assertTxDigestUnused('0xdef', 'payment-a');
  });
});