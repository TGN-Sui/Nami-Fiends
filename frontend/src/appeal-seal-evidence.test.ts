import { describe, expect, it } from 'vitest';

import { sealedEvidenceForAppeal } from './appeal-seal-evidence.js';
import type { SealedEvidenceRef } from './seal-privacy-api.js';

function sampleEvidence(
  overrides: Partial<SealedEvidenceRef> = {}
): SealedEvidenceRef {
  return {
    id: 'seal-abc',
    policy: 'appeal_evidence',
    subject_owner: '0x' + 'a'.repeat(64),
    related_id: '0xappeal1',
    content_hash: 'hash',
    created_at_ms: 1,
    seal_version: 'nami-seal-v1-dev',
    ...overrides,
  };
}

describe('sealedEvidenceForAppeal', () => {
  it('returns only appeal evidence linked to the appeal id', () => {
    const items = [
      sampleEvidence({ id: 'seal-1', related_id: '0xappeal1' }),
      sampleEvidence({ id: 'seal-2', related_id: '0xappeal2', policy: 'appeal_evidence' }),
      sampleEvidence({ id: 'seal-3', related_id: '0xappeal1', policy: 'moderation_packet' }),
    ];

    expect(sealedEvidenceForAppeal(items, '0xappeal1')).toHaveLength(1);
    expect(sealedEvidenceForAppeal(items, '0xappeal1')[0]?.id).toBe('seal-1');
  });
});