import { applyMembershipTierToMember } from './membership-plans-store.js';
import { hasActiveMemberSession } from './member-session-store.js';
import { readDemoOwner } from './protocol-env.js';
import { getZkLoginSession } from './zklogin.js';
import { withMemberAvatar } from './member-avatar-store.js';
import { withMemberProfile } from './member-profile-store.js';
import { members, type NamiMember } from './uiMockData.js';

export const PINNED_PROFILE_MODULE = 'Official Announcements';

export function getSelfMember(): NamiMember {
  const baseMember = members.find((member) => member.id === 'm1') ?? members[0]!;

  return applyMembershipTierToMember(withMemberProfile(withMemberAvatar(baseMember)));
}

export function isMemberVerified(member: NamiMember): boolean {
  return member.signal === 'Green' && member.tier !== 'NPC';
}

export function readSignedInOwner(): string | null {
  const zkOwner = getZkLoginSession()?.address ?? null;

  if (zkOwner) {
    return zkOwner;
  }

  return readDemoOwner();
}

export function isSignedInMember(): boolean {
  return hasActiveMemberSession() || readSignedInOwner() !== null;
}

export function canSendChatMessages(): boolean {
  if (hasActiveMemberSession()) {
    return true;
  }

  if (!readSignedInOwner()) {
    return false;
  }

  return isMemberVerified(getSelfMember());
}

export function canSendPrivateMessages(): boolean {
  return isSignedInMember();
}

export function canSendOfficialChatMessages(): boolean {
  return canSendChatMessages();
}

export function isProOrHigherTier(member: NamiMember): boolean {
  return member.tier === 'Pro' || member.tier === 'Elite';
}

export function memberByName(name: string): NamiMember | undefined {
  return members.find((member) => member.name === name);
}

export function resolveMessageAuthorMember(
  message: { id: string; author: string },
  selfMember: NamiMember,
  roster: NamiMember[] = members
): NamiMember | undefined {
  if (message.id.startsWith('user-cm-') || message.id.startsWith('user-gc-')) {
    return selfMember;
  }

  const eligible = roster.filter((member) => member.signal !== 'Black');
  const memberByNameMap = new Map(eligible.map((member) => [member.name, member]));
  memberByNameMap.set(selfMember.name, selfMember);

  const directMatch = memberByNameMap.get(message.author);

  if (directMatch) {
    return directMatch;
  }

  if (message.author === selfMember.name || message.author === 'Nozomi') {
    return selfMember;
  }

  return undefined;
}

export function isEliteAuthor(authorName: string): boolean {
  return memberByName(authorName)?.tier === 'Elite';
}