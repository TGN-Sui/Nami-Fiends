import { useSyncExternalStore } from 'react';

import { memberFeatureTier } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

const STORAGE_KEY = 'nami.member.audience-subchannels';

export type AudienceSubchannel = {
  id: string;
  slug: string;
  title: string;
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

function roomId(hostMemberId: string, slug: string): string {
  return 'member-audience-' + hostMemberId + '-' + slug;
}

export function audienceSubchannelRoomId(channel: AudienceSubchannel, hostMemberId: string): string {
  return roomId(hostMemberId, channel.slug);
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

  if (!state || !Array.isArray(state.channels)) {
    cachedByHost.set(hostMemberId, {
      hostMemberId,
      channels: [],
      updatedAtMs: Date.now(),
    });
    return [];
  }

  const channels = state.channels.filter(
    (entry): entry is AudienceSubchannel =>
      typeof entry?.id === 'string' &&
      typeof entry.slug === 'string' &&
      typeof entry.title === 'string' &&
      typeof entry.voiceChatEnabled === 'boolean'
  );

  cachedByHost.set(hostMemberId, {
    hostMemberId,
    channels,
    updatedAtMs: state.updatedAtMs ?? Date.now(),
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
  const existing = readMemberAudienceSubchannels(member.id).length;

  return existing < limit;
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

  if (channels.length >= limit) {
    return {
      ok: false,
      reason: 'You have reached your audience subchannel limit (' + limit + ').',
    };
  }

  const nextTitle = title.trim() || defaultTitle(channels.length);
  const baseSlug = slugifyTitle(nextTitle);
  const slug = channels.some((entry) => entry.slug === baseSlug)
    ? baseSlug + '-' + (channels.length + 1)
    : baseSlug;
  const now = Date.now();

  const channel: AudienceSubchannel = {
    id: roomId(member.id, slug),
    slug,
    title: nextTitle,
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
  const next = channels.filter((entry) => entry.id !== channelId);

  if (next.length === channels.length) {
    return false;
  }

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