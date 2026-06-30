import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

const TEST_KEY_HEX = 'a'.repeat(64);

describe('seal-privacy.service', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-seal-'));
    process.env.NAMI_DATA_DIR = tempDir;
    process.env.NAMI_SEAL_PRIVACY_ENABLED = 'true';
    process.env.NAMI_SEAL_EVIDENCE_KEY = TEST_KEY_HEX;
    process.env.NAMI_OFFICIAL_OWNER =
      '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca';
  });

  afterEach(() => {
    process.env = { ...originalEnv };

    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('seals and opens evidence for the subject owner', async () => {
    const subject =
      '0x1111111111111111111111111111111111111111111111111111111111111111';
    const { sealEvidencePacket, openSealedEvidencePacket } = await import(
      './seal-privacy.service.js'
    );

    const sealed = await sealEvidencePacket({
      policy: 'appeal_evidence',
      subjectOwner: subject,
      relatedId: '0xappeal1',
      plaintext: 'screenshot description and context',
    });

    const opened = await openSealedEvidencePacket(sealed.id, subject);

    assert.equal(opened.plaintext, 'screenshot description and context');
    assert.equal(opened.record.policy, 'appeal_evidence');
  });

  it('allows official owner to read another subject packet', async () => {
    const subject =
      '0x2222222222222222222222222222222222222222222222222222222222222222';
    const official = process.env.NAMI_OFFICIAL_OWNER!;
    const { sealEvidencePacket, openSealedEvidencePacket } = await import(
      './seal-privacy.service.js'
    );

    const sealed = await sealEvidencePacket({
      policy: 'moderation_packet',
      subjectOwner: subject,
      plaintext: 'moderator notes',
    });

    const opened = await openSealedEvidencePacket(sealed.id, official);

    assert.equal(opened.plaintext, 'moderator notes');
  });

  it('rejects non-owner readers', async () => {
    const subject =
      '0x3333333333333333333333333333333333333333333333333333333333333333';
    const stranger =
      '0x4444444444444444444444444444444444444444444444444444444444444444';
    const { sealEvidencePacket, openSealedEvidencePacket } = await import(
      './seal-privacy.service.js'
    );

    const sealed = await sealEvidencePacket({
      policy: 'recovery_attachment',
      subjectOwner: subject,
      plaintext: 'recovery proof',
    });

    await assert.rejects(
      () => openSealedEvidencePacket(sealed.id, stranger),
      /sealed_evidence_forbidden/
    );
  });

  it('reports disabled when flag is off', async () => {
    process.env.NAMI_SEAL_PRIVACY_ENABLED = 'false';

    const { sealEvidencePacket } = await import('./seal-privacy.service.js');

    await assert.rejects(
      () =>
        sealEvidencePacket({
          policy: 'verification_proof',
          subjectOwner:
            '0x5555555555555555555555555555555555555555555555555555555555555555',
          plaintext: 'linked account proof',
        }),
      /seal_privacy_disabled/
    );
  });

  it('stores walrus_blob_id when publisher upload succeeds', async () => {
    process.env.NAMI_WALRUS_NETWORK = 'testnet';
    process.env.NAMI_WALRUS_PUBLISHER_URL = 'https://publisher.test';
    process.env.NAMI_WALRUS_AGGREGATOR_URL = 'https://aggregator.test';

    const { setSealWalrusStorageFetchForTests } = await import('./seal-walrus-storage.service.js');
    setSealWalrusStorageFetchForTests(async (_input, init) => {
      if (init?.method === 'PUT') {
        return new Response(
          JSON.stringify({
            newlyCreated: {
              blobObject: {
                blobId: 'walrus-blob-abc',
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }

      return new Response('not-found', { status: 404 });
    });

    const subject =
      '0x6666666666666666666666666666666666666666666666666666666666666666';
    const { sealEvidencePacket, openSealedEvidencePacket } = await import(
      './seal-privacy.service.js'
    );

    const sealed = await sealEvidencePacket({
      policy: 'appeal_evidence',
      subjectOwner: subject,
      plaintext: 'walrus-backed evidence',
    });

    assert.equal(sealed.walrus_blob_id, 'walrus-blob-abc');

    setSealWalrusStorageFetchForTests(async (_input, init) => {
      if (init?.method === 'GET') {
        const ciphertext = Buffer.from(sealed.ciphertext_b64, 'base64');
        return new Response(ciphertext, { status: 200 });
      }

      return new Response('not-found', { status: 404 });
    });

    const opened = await openSealedEvidencePacket(sealed.id, subject);

    assert.equal(opened.plaintext, 'walrus-backed evidence');
  });

  it('falls back to projection ciphertext when walrus is not configured', async () => {
    delete process.env.NAMI_WALRUS_NETWORK;
    delete process.env.NAMI_WALRUS_PUBLISHER_URL;
    delete process.env.NAMI_WALRUS_AGGREGATOR_URL;

    const subject =
      '0x7777777777777777777777777777777777777777777777777777777777777777';
    const { sealEvidencePacket } = await import('./seal-privacy.service.js');

    const sealed = await sealEvidencePacket({
      policy: 'moderation_packet',
      subjectOwner: subject,
      plaintext: 'projection-only ciphertext',
    });

    assert.equal(sealed.walrus_blob_id ?? null, null);
    assert.ok(sealed.ciphertext_b64.length > 0);
  });
});