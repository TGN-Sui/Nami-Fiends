import { isMemberVerified } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

export function canUseGuildLeadershipTools(member: NamiMember): boolean {
  return isMemberVerified(member) && member.tier !== 'NPC' && member.signal !== 'Black';
}

export function canFoundNewGuild(member: NamiMember): boolean {
  return canUseGuildLeadershipTools(member);
}

export function canLeadSquadInvites(member: NamiMember): boolean {
  return canUseGuildLeadershipTools(member);
}