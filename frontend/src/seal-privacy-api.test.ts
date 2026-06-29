import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createWalletAuthPayload = vi.fn();

vi.mock('./app-config.js', () => ({
  isIndexerLive: () => true,
  readAppConfig: () => ({ indexerUrl: 'http://127.0.0.1:8787' }),
}));

vi.mock('./protocol-env.js', () => ({
  readIndexerUrl: () => 'http://127.0.0.1:8787',
}));

vi.mock('./wallet-auth.js', () => ({
  createWalletAuthPayload: (...args: unknown[]) => createWalletAuthPayload(...args),
}));

describe('seal-privacy-api', () => {
  beforeEach(() => {
    createWalletAuthPayload.mockReset();
    createWalletAuthPayload.mockResolvedValue({
      signature: '0xsig',
      timestampMs: 1_700_000_000_000,
      signerAddress: '0xsigner',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/api/privacy/status')) {
          return new Response(
            JSON.stringify({
              enabled: true,
              policies: ['appeal_evidence'],
              policies_registered: 4,
              migration_stage: 'nami-seal-v1-dev',
              migration_next_step: 'Mysten Seal',
              seal_version: 'nami-seal-v1-dev',
              mysten_seal_migration: 'planned',
            }),
            { status: 200 }
          );
        }

        if (url.endsWith('/api/privacy/evidence/list')) {
          return new Response(
            JSON.stringify({
              evidence: [
                {
                  id: 'seal-abc',
                  policy: 'appeal_evidence',
                  subject_owner: '0xowner',
                  related_id: '0xappeal',
                  content_hash: 'hash',
                  created_at_ms: 1,
                  seal_version: 'nami-seal-v1-dev',
                },
              ],
            }),
            { status: 200 }
          );
        }

        if (url.endsWith('/api/privacy/evidence/seal')) {
          return new Response(
            JSON.stringify({
              evidence: {
                id: 'seal-new',
                policy: 'appeal_evidence',
                subject_owner: '0xowner',
                related_id: null,
                content_hash: 'hash2',
                created_at_ms: 2,
                seal_version: 'nami-seal-v1-dev',
              },
            }),
            { status: 201 }
          );
        }

        if (url.endsWith('/api/privacy/evidence/open')) {
          return new Response(
            JSON.stringify({
              evidence: {
                id: 'seal-abc',
                policy: 'appeal_evidence',
                subject_owner: '0xowner',
                related_id: null,
                content_hash: 'hash',
                created_at_ms: 1,
                seal_version: 'nami-seal-v1-dev',
              },
              plaintext: 'appeal context',
            }),
            { status: 200 }
          );
        }

        return new Response(JSON.stringify({ error: 'unknown' }), { status: 404 });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads public Seal privacy status', async () => {
    const { fetchSealPrivacyStatus } = await import('./seal-privacy-api.js');
    const status = await fetchSealPrivacyStatus();

    expect(status?.enabled).toBe(true);
    expect(status?.policies).toContain('appeal_evidence');
  });

  it('lists sealed evidence with wallet auth', async () => {
    const { listSealedEvidence } = await import('./seal-privacy-api.js');
    const items = await listSealedEvidence('0xowner');

    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('seal-abc');
    expect(createWalletAuthPayload).toHaveBeenCalledWith('0xowner');
  });

  it('seals and opens evidence packets', async () => {
    const { openSealedEvidence, sealEvidencePacket } = await import('./seal-privacy-api.js');

    const sealed = await sealEvidencePacket({
      owner: '0xowner',
      policy: 'appeal_evidence',
      plaintext: 'screenshots and timeline',
      relatedId: '0xappeal1',
    });

    expect(sealed.id).toBe('seal-new');

    const opened = await openSealedEvidence({
      owner: '0xowner',
      evidenceId: 'seal-abc',
    });

    expect(opened.plaintext).toBe('appeal context');
  });

  it('maps disabled lane errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: 'seal_privacy_disabled',
            message: 'Seal privacy lane is disabled.',
          }),
          { status: 503 }
        )
      )
    );

    const { listSealedEvidence, SealPrivacyApiError } = await import('./seal-privacy-api.js');

    await expect(listSealedEvidence('0xowner')).rejects.toBeInstanceOf(SealPrivacyApiError);
  });
});