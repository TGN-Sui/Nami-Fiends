import { OFFICIAL_OWNER_RANK_LABEL, memberDisplayRankLabel } from './channel-surface.js';
import { SELF_MEMBER_ID } from './member-access.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { readOwnerPassportLabels } from './owner-passport-labels-store.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';
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

/** Passport tier chip for member cards — matches Nami Passport display, not feature gates. */
export function memberPassportTierLabel(
  member: NamiMember,
  connectedOwner: string | null = readResolvedProtocolOwner()
): string {
  if (isOwnerPassportMember(member, connectedOwner)) {
    return resolveOwnerPassportLabels(connectedOwner)?.primaryLabel ?? OFFICIAL_OWNER_RANK_LABEL;
  }

  return memberDisplayRankLabel(member);
}