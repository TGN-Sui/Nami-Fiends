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
  return canUseGuildLeadershipTools(member);
}

export function canLeadSquadInvites(member: NamiMember): boolean {
  return canUseGuildLeadershipTools(member);
}