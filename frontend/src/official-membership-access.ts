import { isNamiTeamMember, OFFICIAL_OWNER_RANK_LABEL } from './channel-surface.js';
import { resolveNamiAdminRole } from './nami-capabilities.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';
import { members } from './uiMockData.js';

const SELF_MEMBER_ID = 'm1';

export const COMPLIMENTARY_MEMBERSHIP_TIER = 'Elite' as const;

export const COMPLIMENTARY_MEMBERSHIP_REASON =
  'Official Nami owner and team members receive Elite-tier access without payment.';

function readConnectedOwner(): string | null {
  return readResolvedProtocolOwner();
}

function readBaseSelfMemberIsNamiTeam(): boolean {
  const baseMember = members.find((member) => member.id === SELF_MEMBER_ID) ?? members[0];

  return baseMember ? isNamiTeamMember(baseMember) : false;
}

/** Owner, official moderators, and Nami team members skip paid membership. */
export function hasComplimentaryMembershipAccess(
  owner: string | null = readConnectedOwner()
): boolean {
  const adminRole = resolveNamiAdminRole(owner);

  if (adminRole === 'official-owner' || adminRole === 'official-moderator') {
    return true;
  }

  return readBaseSelfMemberIsNamiTeam();
}

export function complimentaryMembershipStatusLabel(
  owner: string | null = readConnectedOwner()
): string {
  const adminRole = resolveNamiAdminRole(owner);

  if (adminRole === 'official-owner') {
    return OFFICIAL_OWNER_RANK_LABEL;
  }

  if (adminRole === 'official-moderator') {
    return 'Official moderator access';
  }

  if (readBaseSelfMemberIsNamiTeam()) {
    return 'Official Nami member access';
  }

  return 'Complimentary access';
}