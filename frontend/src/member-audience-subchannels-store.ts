import { useSyncExternalStore } from 'react';

import type { GlobalChatRoom } from './global-chats.js';
import { isMemberVerified, memberFeatureTier } from './member-access.js';
import { memberPublicChatId, memberPublicChatRoom } from './member-public-chat.js';
import type { NamiMember } from './uiMockData.js';

const STORAGE_KEY = 'nami.member.audience-subchannels';

export const LIVE_CHAT_SLUG = 'live-chat';
export const LIVE_CHAT_DEFAULT_TITLE = 'Live Chat';

export type AudienceSubchannelKind = 'live-chat' | 'custom';

export type AudienceSubchannel = {
  id: string;
  slug: string;
  title: string;
  kind: AudienceSubchannelKind;
  voiceChatEnabled: boolean;
  createdAtMs: number;
  updatedAtMs: number;
};

export type MemberAudienceSubchannelsState = {
  hostMemberId: string;
  channels: AudienceSubchannel[];
  updatedAtMs: number;
};

let cachedByHost = new Map<string, MemberAudienceSubchannelsState>();

/** Test-only: clears in-memory cache between vitest cases. */
export function resetAudienceSubchannelsStoreForTests(): void {
  cachedByHost.clear();
}

function defaultTitle(index: number): string {
  return 'Audience room ' + (index + 1);
}

function slugifyTitle(title: string): string {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'audience-room';
}

export function maxAudienceSubchannelsForTier(tier: NamiMember['tier']): number {
  if (tier === 'Elite') {
    return 4;
  }

  if (tier === 'Pro') {
    return 3;
  }

  if (tier === 'Adventurer') {
    return 1;
  }

  return 0;
}

export function maxAudienceSubchannelsForMember(member: NamiMember): number {
  return maxAudienceSubchannelsForTier(memberFeatureTier(member));
}

function customRoomId(hostMemberId: string, slug: string): string {
  return 'member-audience-' + hostMemberId + '-' + slug;
}

export function audienceSubchannelRoomId(channel: AudienceSubchannel, hostMemberId: string): string {
  if (channel.kind === 'live-chat' || channel.slug === LIVE_CHAT_SLUG) {
    return memberPublicChatId(hostMemberId);
  }

  return customRoomId(hostMemberId, channel.slug);
}

function buildDefaultLiveChatChannel(hostMemberId: string): AudienceSubchannel {
  const now = Date.now();

  return {
    id: memberPublicChatId(hostMemberId),
    slug: LIVE_CHAT_SLUG,
    title: LIVE_CHAT_DEFAULT_TITLE,
    kind: 'live-chat',
    voiceChatEnabled: false,
    createdAtMs: now,
    updatedAtMs: now,
  };
}

function isLiveChatChannel(channel: AudienceSubchannel): boolean {
  return channel.kind === 'live-chat' || channel.slug === LIVE_CHAT_SLUG;
}

function normalizeStoredChannel(
  entry: Partial<AudienceSubchannel>,
  hostMemberId: string
): AudienceSubchannel | null {
  if (typeof entry?.slug !== 'string' || typeof entry.title !== 'string') {
    return null;
  }

  const live = isLiveChatChannel(entry as AudienceSubchannel);
  const now = Date.now();

  return {
    id: live ? memberPublicChatId(hostMemberId) : customRoomId(hostMemberId, entry.slug),
    slug: live ? LIVE_CHAT_SLUG : entry.slug,
    title: entry.title.trim() || (live ? LIVE_CHAT_DEFAULT_TITLE : defaultTitle(0)),
    kind: live ? 'live-chat' : 'custom',
    voiceChatEnabled: entry.voiceChatEnabled === true,
    createdAtMs: typeof entry.createdAtMs === 'number' ? entry.createdAtMs : now,
    updatedAtMs: typeof entry.updatedAtMs === 'number' ? entry.updatedAtMs : now,
  };
}

function normalizeChannels(hostMemberId: string, channels: AudienceSubchannel[]): AudienceSubchannel[] {
  const custom = channels.filter((entry) => !isLiveChatChannel(entry));
  const storedLive = channels.find((entry) => isLiveChatChannel(entry));
  const live = storedLive
    ? {
        ...storedLive,
        id: memberPublicChatId(hostMemberId),
        slug: LIVE_CHAT_SLUG,
        kind: 'live-chat' as const,
      }
    : buildDefaultLiveChatChannel(hostMemberId);

  return [live, ...custom];
}

export function countCustomAudienceSubchannels(hostMemberId: string): number {
  return readMemberAudienceSubchannels(hostMemberId).filter((entry) => entry.kind === 'custom').length;
}

export function audienceSubchannelChatRoom(
  channel: AudienceSubchannel,
  hostMember: NamiMember
): GlobalChatRoom {
  if (channel.kind === 'live-chat' || channel.slug === LIVE_CHAT_SLUG) {
    return memberPublicChatRoom(hostMember);
  }

  return {
    id: audienceSubchannelRoomId(channel, hostMember.id),
    title: channel.title,
    kind: 'temporary',
    createdBy: hostMember.name,
    creatorVerified: isMemberVerified(hostMember),
    activeMembers: 12 + hostMember.id.charCodeAt(1) % 24,
    voiceEnabled: channel.voiceChatEnabled,
    isOfficial: false,
    closesOnExit: false,
  };
}

function readAllStates(): Record<string, MemberAudienceSubchannelsState> {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, MemberAudienceSubchannelsState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAllStates(states: Record<string, MemberAudienceSubchannelsState>): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  cachedByHost.clear();
  window.dispatchEvent(new CustomEvent('nami-audience-subchannels-changed'));
}

export function readMemberAudienceSubchannels(hostMemberId: string): AudienceSubchannel[] {
  const cached = cachedByHost.get(hostMemberId);

  if (cached) {
    return cached.channels;
  }

  const states = readAllStates();
  const state = states[hostMemberId];

  const rawChannels = state?.channels;
  const parsedChannels = Array.isArray(rawChannels)
    ? rawChannels
        .map((entry) => normalizeStoredChannel(entry, hostMemberId))
        .filter((entry): entry is AudienceSubchannel => entry !== null)
    : [];
  const channels = normalizeChannels(hostMemberId, parsedChannels);

  cachedByHost.set(hostMemberId, {
    hostMemberId,
    channels,
    updatedAtMs: state?.updatedAtMs ?? Date.now(),
  });

  return channels;
}

function persistChannels(hostMemberId: string, channels: AudienceSubchannel[]): void {
  const states = readAllStates();

  states[hostMemberId] = {
    hostMemberId,
    channels,
    updatedAtMs: Date.now(),
  };

  writeAllStates(states);
}

export function canCreateAudienceSubchannel(member: NamiMember): boolean {
  const limit = maxAudienceSubchannelsForMember(member);
  const existing = countCustomAudienceSubchannels(member.id);

  return limit > 0 && existing < limit;
}

export type AudienceSubchannelMutationResult =
  | { ok: true; channel: AudienceSubchannel }
  | { ok: false; reason: string };

export function createAudienceSubchannel(
  member: NamiMember,
  title = ''
): AudienceSubchannelMutationResult {
  const limit = maxAudienceSubchannelsForMember(member);

  if (limit === 0) {
    return { ok: false, reason: 'Upgrade membership to open audience subchannels.' };
  }

  const channels = readMemberAudienceSubchannels(member.id);
  const customChannels = channels.filter((entry) => entry.kind === 'custom');

  if (customChannels.length >= limit) {
    return {
      ok: false,
      reason: 'You have reached your audience subchannel limit (' + limit + ').',
    };
  }

  const nextTitle = title.trim() || defaultTitle(customChannels.length);
  const baseSlug = slugifyTitle(nextTitle);
  const slug = channels.some((entry) => entry.slug === baseSlug)
    ? baseSlug + '-' + (customChannels.length + 1)
    : baseSlug;
  const now = Date.now();

  const channel: AudienceSubchannel = {
    id: customRoomId(member.id, slug),
    slug,
    title: nextTitle,
    kind: 'custom',
    voiceChatEnabled: false,
    createdAtMs: now,
    updatedAtMs: now,
  };

  persistChannels(member.id, [...channels, channel]);

  return { ok: true, channel };
}

export function renameAudienceSubchannel(
  hostMemberId: string,
  channelId: string,
  title: string
): AudienceSubchannelMutationResult {
  const trimmed = title.trim();

  if (!trimmed) {
    return { ok: false, reason: 'Enter a subchannel title.' };
  }

  const channels = readMemberAudienceSubchannels(hostMemberId);
  let updated: AudienceSubchannel | null = null;

  const next = channels.map((entry) => {
    if (entry.id !== channelId) {
      return entry;
    }

    updated = {
      ...entry,
      title: trimmed,
      updatedAtMs: Date.now(),
    };

    return updated;
  });

  if (!updated) {
    return { ok: false, reason: 'Subchannel not found.' };
  }

  persistChannels(hostMemberId, next);

  return { ok: true, channel: updated };
}

export function setAudienceSubchannelVoiceEnabled(
  hostMemberId: string,
  channelId: string,
  enabled: boolean
): AudienceSubchannelMutationResult {
  const channels = readMemberAudienceSubchannels(hostMemberId);
  let updated: AudienceSubchannel | null = null;

  const next = channels.map((entry) => {
    if (entry.id !== channelId) {
      return entry;
    }

    updated = {
      ...entry,
      voiceChatEnabled: enabled,
      updatedAtMs: Date.now(),
    };

    return updated;
  });

  if (!updated) {
    return { ok: false, reason: 'Subchannel not found.' };
  }

  persistChannels(hostMemberId, next);

  return { ok: true, channel: updated };
}

export function removeAudienceSubchannel(hostMemberId: string, channelId: string): boolean {
  const channels = readMemberAudienceSubchannels(hostMemberId);
  const target = channels.find((entry) => entry.id === channelId);

  if (!target || target.kind === 'live-chat') {
    return false;
  }

  const next = channels.filter((entry) => entry.id !== channelId);
  persistChannels(hostMemberId, next);
  return true;
}

function subscribe(listener: () => void): () => void {
  function handleChange(): void {
    cachedByHost.clear();
    listener();
  }

  window.addEventListener('nami-audience-subchannels-changed', handleChange);

  return () => window.removeEventListener('nami-audience-subchannels-changed', handleChange);
}

export function useMemberAudienceSubchannels(hostMemberId: string): AudienceSubchannel[] {
  return useSyncExternalStore(
    subscribe,
    () => readMemberAudienceSubchannels(hostMemberId),
    () => []
  );
}