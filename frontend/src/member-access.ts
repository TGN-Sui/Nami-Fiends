import { isOfficialNamiGalaxyMember } from './channel-surface.js';
import { applyGenesisSelfOverrides, shouldUseGenesisSelfMember } from './genesis-member.js';
import {
  applyDemoMemberOverrides,
  readDemoSafetyModerationRole,
} from './demo-perspective-store.js';
import { isOfficialOwner, resolveNamiAdminRole } from './nami-capabilities.js';
import { applyMembershipTierToMember, effectiveMemberTier } from './membership-plans-store.js';
import { hasComplimentaryMembershipAccess } from './official-membership-access.js';
import { hasActiveMemberSession } from './member-session-store.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';
import { withMemberAvatar } from './member-avatar-store.js';
import { withMemberProfile } from './member-profile-store.js';
import { members, type NamiMember } from './uiMockData.js';

export const PINNED_PROFILE_MODULE = 'Official Announcements';

export const SELF_MEMBER_ID = 'm1';

export const LEGACY_SELF_MEMBER_NAMES = ['Nozomi', 'NPC Gamer'] as const;

export function getSelfMember(): NamiMember {
  const baseMember = members.find((member) => member.id === SELF_MEMBER_ID) ?? members[0]!;
  let member = withMemberProfile(withMemberAvatar(baseMember));

  if (shouldUseGenesisSelfMember()) {
    member = applyGenesisSelfOverrides(member);
  }

  return applyDemoMemberOverrides(applyMembershipTierToMember(member));
}

/** Tier used for feature gates (appearance, feeds, boosts) — not passport display labels. */
export function memberFeatureTier(member: NamiMember): NamiMember['tier'] {
  if (member.id !== SELF_MEMBER_ID) {
    return member.tier;
  }

  if (hasComplimentaryMembershipAccess(readSignedInOwner())) {
    return effectiveMemberTier();
  }

  return member.tier;
}

export function isOfficialOwnerSelfMember(member: NamiMember = getSelfMember()): boolean {
  return member.id === SELF_MEMBER_ID && isOfficialOwner(readSignedInOwner());
}

export function memberHasEliteAccess(member: NamiMember): boolean {
  if (member.id === SELF_MEMBER_ID && hasComplimentaryMembershipAccess(readSignedInOwner())) {
    return true;
  }

  return memberFeatureTier(member) === 'Elite';
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
  if (member.signal !== 'Green') {
    return false;
  }

  if (member.id === SELF_MEMBER_ID) {
    const owner = readSignedInOwner();

    if (isOfficialOwner(owner) || hasComplimentaryMembershipAccess(owner)) {
      return true;
    }
  }

  return member.tier !== 'NPC';
}

export function isNpcMember(member: NamiMember): boolean {
  return member.tier === 'NPC';
}

export function canReportMemberProfile(reporter: NamiMember = getSelfMember()): boolean {
  return isMemberVerified(reporter);
}

export function canMessageOtherMembers(sender: NamiMember = getSelfMember()): boolean {
  return isSignedInMember() && isMemberVerified(sender);
}

export function canAccessBadgeBook(member: NamiMember): boolean {
  if (member.id === SELF_MEMBER_ID && isMemberVerified(member)) {
    return true;
  }

  return !isNpcMember(member);
}

export function canSubscribeToChannelBanners(member: NamiMember = getSelfMember()): boolean {
  return isMemberVerified(member);
}

export function canToggleStreamingStatus(member: NamiMember = getSelfMember()): boolean {
  return isMemberVerified(member);
}

function isViewingAsGameChannelOwner(): boolean {
  try {
    const storedRole = window.localStorage.getItem('nami.user.surface-role');

    if (storedRole === 'channel-owner') {
      return true;
    }

    return window.localStorage.getItem('nami.viewing-as-channel-owner') === 'true';
  } catch {
    return false;
  }
}

export function canManageTemporaryGlobalChats(member: NamiMember = getSelfMember()): boolean {
  if (isViewingAsGameChannelOwner()) {
    return false;
  }

  return memberHasEliteAccess(member) && isMemberVerified(member);
}

export function canEditProfileCosmetics(member: NamiMember = getSelfMember()): boolean {
  return isMemberVerified(member);
}

export function canPurchaseOrClaimMembership(member: NamiMember = getSelfMember()): boolean {
  return isMemberVerified(member);
}

export function canAccessModerationQueues(
  connectedOwner: string | null = readSignedInOwner()
): boolean {
  const demoRole = readDemoSafetyModerationRole();

  if (demoRole !== null) {
    return demoRole === 'Nami Moderator' || demoRole === 'Nami Dev';
  }

  const adminRole = resolveNamiAdminRole(connectedOwner);

  return adminRole === 'official-owner' || adminRole === 'official-moderator';
}

export function readSignedInOwner(): string | null {
  return readResolvedProtocolOwner();
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
  return canMessageOtherMembers();
}

export function canSendOfficialChatMessages(): boolean {
  return canSendChatMessages();
}

export function isProOrHigherTier(member: NamiMember): boolean {
  if (member.id === SELF_MEMBER_ID && hasComplimentaryMembershipAccess(readSignedInOwner())) {
    return true;
  }

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
  if (member && isOfficialNamiGalaxyMember(member)) {
    return ' is-nami-team-chat-bubble is-nami-rainbow-foil-border';
  }

  if (member?.tier === 'Elite' || isEliteAuthor(authorName)) {
    return ' is-elite-chat-bubble';
  }

  return '';
}