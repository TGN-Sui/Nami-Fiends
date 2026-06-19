import { useSyncExternalStore } from 'react';

import { isGameChannelOwner } from './channel-owner-access.js';
import { getSelfMember, isMemberVerified } from './member-access.js';
import { getCreatedGuildRecords } from './guild-creation-store.js';
import {
  guildById,
  guildMaxMembers,
  namiGuilds,
  type NamiGuildRecord,
} from './nami-affiliations.js';

const REQUESTS_KEY = 'nami.guild.join-requests';
const MEMBERSHIP_KEY = 'nami.guild.join-members';

export type GuildJoinRequestStatus = 'pending' | 'approved' | 'declined';

export type GuildJoinRequest = {
  id: string;
  guildId: string;
  guildName: string;
  requesterMemberId: string;
  requesterName: string;
  status: GuildJoinRequestStatus;
  createdAt: string;
};

export type GuildJoinRequestResult =
  | { ok: true; request: GuildJoinRequest }
  | { ok: false; reason: string };

const listeners = new Set<() => void>();
let cachedRequests: GuildJoinRequest[] | null = null;
let cachedMembers: Record<string, string[]> | null = null;

function emit(): void {
  cachedRequests = null;
  cachedMembers = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readRequests(): GuildJoinRequest[] {
  try {
    const stored = window.localStorage.getItem(REQUESTS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as GuildJoinRequest[]) : [];
  } catch {
    return [];
  }
}

function writeRequests(requests: GuildJoinRequest[]): void {
  window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  emit();
}

function readJoinedMembers(): Record<string, string[]> {
  try {
    const stored = window.localStorage.getItem(MEMBERSHIP_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, string[]>;

    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeJoinedMembers(next: Record<string, string[]>): void {
  window.localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(next));
  emit();
}

export function useGuildJoinRequests(): GuildJoinRequest[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!cachedRequests) {
        cachedRequests = readRequests();
      }

      return cachedRequests;
    },
    () => readRequests()
  );
}

export function resolveGuildRecord(guildId: string): NamiGuildRecord | undefined {
  return (
    guildById(guildId) ??
    getCreatedGuildRecords().find((guild) => guild.id === guildId) ??
    namiGuilds.find((guild) => guild.id === guildId)
  );
}

export function effectiveGuildMemberIds(guild: NamiGuildRecord): string[] {
  const joined = readJoinedMembers()[guild.id] ?? [];

  return [...new Set([...guild.memberIds, ...joined])];
}

export function canRequestToJoinGuild(guild: NamiGuildRecord, memberId: string = getSelfMember().id): boolean {
  if (isGameChannelOwner()) {
    return false;
  }

  if (!guild.isPublic) {
    return false;
  }

  const member = getSelfMember();

  if (!isMemberVerified(member) || member.tier === 'NPC') {
    return false;
  }

  if (effectiveGuildMemberIds(guild).includes(memberId)) {
    return false;
  }

  const pending = readRequests().some(
    (request) =>
      request.guildId === guild.id &&
      request.requesterMemberId === memberId &&
      request.status === 'pending'
  );

  return !pending;
}

export function submitGuildJoinRequest(guild: NamiGuildRecord): GuildJoinRequestResult {
  const selfMember = getSelfMember();

  if (isGameChannelOwner()) {
    return {
      ok: false,
      reason: 'Game channel owners manage one official guild and cannot join other guilds.',
    };
  }

  if (!guild.isPublic) {
    return { ok: false, reason: guild.name + ' is private — join requests are invite only.' };
  }

  if (!isMemberVerified(selfMember) || selfMember.tier === 'NPC') {
    return { ok: false, reason: 'Only verified members can request to join public guilds.' };
  }

  if (effectiveGuildMemberIds(guild).includes(selfMember.id)) {
    return { ok: false, reason: 'You are already in ' + guild.name + '.' };
  }

  const memberCount = effectiveGuildMemberIds(guild).length;
  const maxMembers = guildMaxMembers(guild);

  if (memberCount >= maxMembers) {
    return { ok: false, reason: guild.name + ' is full (' + memberCount + '/' + maxMembers + ').' };
  }

  const request: GuildJoinRequest = {
    id: 'guild-join-' + Date.now(),
    guildId: guild.id,
    guildName: guild.name,
    requesterMemberId: selfMember.id,
    requesterName: selfMember.name,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  writeRequests([request, ...readRequests()]);

  return { ok: true, request };
}

export function approveGuildJoinRequest(requestId: string): GuildJoinRequestResult {
  const requests = readRequests();
  const index = requests.findIndex((request) => request.id === requestId);

  if (index < 0) {
    return { ok: false, reason: 'Join request not found.' };
  }

  const current = requests[index]!;
  const guild = resolveGuildRecord(current.guildId);

  if (!guild) {
    return { ok: false, reason: 'Guild no longer exists.' };
  }

  const joined = readJoinedMembers();
  const guildJoined = joined[guild.id] ?? [];

  writeJoinedMembers({
    ...joined,
    [guild.id]: [...guildJoined, current.requesterMemberId],
  });

  const next = [...requests];
  next[index] = { ...current, status: 'approved' };
  writeRequests(next);

  return { ok: true, request: next[index]! };
}