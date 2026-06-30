import type { SealedEvidenceRef } from './seal-privacy-api.js';

export function sealedEvidenceForAppeal(
  items: SealedEvidenceRef[],
  appealId: string
): SealedEvidenceRef[] {
  const normalizedAppealId = appealId.toLowerCase();

  return items.filter((item) => {
    if (item.policy !== 'appeal_evidence') {
      return false;
    }

    if (!item.related_id) {
      return false;
    }

    return item.related_id.toLowerCase() === normalizedAppealId;
  });
}