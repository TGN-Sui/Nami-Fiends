import { isNamiTeamMember } from './channel-surface.js';
import { applyMembershipTierToMember } from './membership-plans-store.js';
import { hasActiveMemberSession } from './member-session-store.js';
import { readDemoOwner } from './protocol-env.js';
import { getZkLoginSession } from './zklogin.js';
import { withMemberAvatar } from './member-avatar-store.js';
import { withMemberProfile } from './member-profile-store.js';
import { members, type NamiMember } from './uiMockData.js';

export const PINNED_PROFILE_MODULE = 'Official Announcements';

export const SELF_MEMBER_ID = 'm1';

export const LEGACY_SELF_MEMBER_NAMES = ['Nozomi', 'NPC Gamer'] as const;

export function getSelfMember(): NamiMember {
  const baseMember = members.find((member) => member.id === SELF_MEMBER_ID) ?? members[0]!;

  return applyMembershipTierToMember(withMemberProfile(withMemberAvatar(baseMember)));
}

export function isSelfMessageAuthor(authorName: string, selfMember: NamiMember = getSelfMember()): boolean {
  const normalizedAuthor = authorName.trim().toLowerCase();
  const normalizedSelfName = selfMember.name.trim().toLowerCase();

  if (!normalizedAuthor) {
    return false;
  }

  if (normalizedAuthor === normalizedSelfName) {
    return true;
  }

  return LEGACY_SELF_MEMBER_NAMES.some((legacyName) => legacyName.toLowerCase() === normalizedAuthor);
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

  if (isSelfMessageAuthor(message.author, selfMember)) {
    return selfMember;
  }

  return undefined;
}

export function isEliteAuthor(authorName: string): boolean {
  return memberByName(authorName)?.tier === 'Elite';
}

export function messageBubbleClass(
  member: NamiMember | undefined,
  authorName: string
): string {
  if (member && isNamiTeamMember(member)) {
    return ' is-nami-team-chat-bubble is-nami-rainbow-foil-border';
  }

  if (member?.tier === 'Elite' || isEliteAuthor(authorName)) {
    return ' is-elite-chat-bubble';
  }

  return '';
}