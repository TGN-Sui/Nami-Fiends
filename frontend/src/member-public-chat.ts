import { readEmbeddedFeedLinks } from './embedded-feed-preferences.js';
import type { GlobalChatRoom, SocialEmbed } from './global-chats.js';
import { isMemberVerified } from './member-access.js';
import { isMemberStreamingOnline } from './member-online-store.js';
import type { NamiMember } from './uiMockData.js';

/** Reserved nodename prefix for passport claims (displayed as @fiend). */
export const FIEND_CLAIM_HANDLE_PREFIX = 'fiend';

/** @deprecated Pre-testnet prefix; still parsed when loading existing claims. */
export const LEGACY_NAMI_CLAIM_HANDLE_PREFIX = 'nami';

const COLLAPSED_KEY = 'nami.member-public-chat.collapsed';

export function memberPublicChatId(memberId: string): string {
  return 'member-public-live-' + memberId;
}

export function memberPublicChatRoom(member: NamiMember): GlobalChatRoom {
  return {
    id: memberPublicChatId(member.id),
    title: member.name + ' Live Chat',
    kind: 'temporary',
    createdBy: member.name,
    creatorVerified: isMemberVerified(member),
    activeMembers: 18 + member.id.charCodeAt(1) % 40,
    voiceEnabled: false,
    isOfficial: false,
    closesOnExit: false,
  };
}

export function canShowMemberPublicChat(member: NamiMember, isStreamingOnline: boolean): boolean {
  return isMemberVerified(member) && isStreamingOnline;
}

export function memberLiveBroadcastEmbed(memberId: string): SocialEmbed | undefined {
  const embeds = readEmbeddedFeedLinks('member', memberId);

  return (
    embeds.find((embed) => embed.platform === 'twitch' && embed.live) ??
    embeds.find((embed) => embed.platform === 'twitch')
  );
}

/** Live Twitch (or primary stream embed) when the member is marked streaming online. */
export function memberWatchableLiveFeed(memberId: string): SocialEmbed | undefined {
  if (!isMemberStreamingOnline(memberId)) {
    return undefined;
  }

  return memberLiveBroadcastEmbed(memberId);
}

export function nodenameSuffixFromFull(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (!normalized) {
    return '';
  }

  if (normalized.startsWith(FIEND_CLAIM_HANDLE_PREFIX)) {
    return normalized.slice(FIEND_CLAIM_HANDLE_PREFIX.length);
  }

  if (normalized.startsWith(LEGACY_NAMI_CLAIM_HANDLE_PREFIX)) {
    return normalized.slice(LEGACY_NAMI_CLAIM_HANDLE_PREFIX.length);
  }

  return normalized;
}

export function buildClaimNodename(suffix: string): string {
  const normalizedSuffix = suffix.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  return FIEND_CLAIM_HANDLE_PREFIX + normalizedSuffix;
}

function readCollapsedMap(): Record<string, boolean> {
  try {
    const stored = window.localStorage.getItem(COLLAPSED_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function readMemberPublicChatCollapsed(memberId: string): boolean {
  return readCollapsedMap()[memberId] === true;
}

export function saveMemberPublicChatCollapsed(memberId: string, collapsed: boolean): void {
  window.localStorage.setItem(
    COLLAPSED_KEY,
    JSON.stringify({
      ...readCollapsedMap(),
      [memberId]: collapsed,
    })
  );
}