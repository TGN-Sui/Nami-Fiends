import { SELF_MEMBER_ID } from './member-access.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { readOwnerPassportLabels } from './owner-passport-labels-store.js';
import type { NamiMember } from './uiMockData.js';

export function isOwnerPassportMember(
  member: NamiMember,
  connectedOwner: string | null
): boolean {
  return member.id === SELF_MEMBER_ID && isOfficialOwner(connectedOwner);
}

export function resolveOwnerPassportLabels(connectedOwner: string | null): {
  primaryLabel: string;
  secondaryLabel: string;
} | null {
  if (!isOfficialOwner(connectedOwner)) {
    return null;
  }

  const labels = readOwnerPassportLabels();

  return {
    primaryLabel: labels.primaryLabel,
    secondaryLabel: labels.secondaryLabel,
  };
}