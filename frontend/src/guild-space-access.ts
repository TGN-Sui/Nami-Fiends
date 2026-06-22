import { qualifiesForOwnerSoloGuild } from './channel-owner-access.js';
import { channelOwnerOfficialGuildCount } from './guild-creation-store.js';
import { isMemberVerified, memberFeatureTier, SELF_MEMBER_ID } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

function memberHasLeadershipTier(member: NamiMember): boolean {
  const tier = member.id === SELF_MEMBER_ID ? memberFeatureTier(member) : member.tier;

  return tier !== 'NPC';
}

export function canUseGuildLeadershipTools(member: NamiMember): boolean {
  return isMemberVerified(member) && memberHasLeadershipTier(member) && member.signal !== 'Black';
}

export function canFoundNewGuild(member: NamiMember): boolean {
  if (member.signal === 'Black') {
    return false;
  }

  if (qualifiesForOwnerSoloGuild() && member.id === SELF_MEMBER_ID) {
    return channelOwnerOfficialGuildCount(member.id) === 0;
  }

  return canUseGuildLeadershipTools(member);
}

export function canLeadSquadInvites(member: NamiMember): boolean {
  return canUseGuildLeadershipTools(member);
}