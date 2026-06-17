import { useSyncExternalStore } from 'react';

import { getSelfMember } from './member-access.js';
import {
  canMemberInviteToGuild,
  guildMaxMembers,
  guildMemberCount,
  guildOwnerMember,
  namiGuilds,
  type NamiGuildRecord,
} from './nami-affiliations.js';
import { members, type NamiMember } from './uiMockData.js';

const INVITES_KEY = 'nami.user.guild-invites';

export type GuildInviteStatus = 'pending' | 'accepted' | 'declined';

export type GuildInvite = {
  id: string;
  guildId: string;
  guildName: string;
  inviterMemberId: string;
  inviterName: string;
  targetMemberId: string;
  targetMemberName: string;
  status: GuildInviteStatus;
  createdAt: string;
};

export type GuildInviteResult =
  | { ok: true; invite: GuildInvite }
  | { ok: false; reason: string };

const listeners = new Set<() => void>();
let cachedSnapshot: GuildInvite[] | null = null;

function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readInvites(): GuildInvite[] {
  try {
    const stored = window.localStorage.getItem(INVITES_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as GuildInvite[]) : [];
  } catch {
    return [];
  }
}

function writeInvites(invites: GuildInvite[]): void {
  window.localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
  emit();
}

function getSnapshot(): GuildInvite[] {
  if (!cachedSnapshot) {
    cachedSnapshot = readInvites();
  }

  return cachedSnapshot;
}

export function useGuildInvites(): GuildInvite[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function invitableGuildsForTarget(targetMemberId: string): NamiGuildRecord[] {
  const selfMember = getSelfMember();

  return namiGuilds.filter((guild) => {
    if (!canMemberInviteToGuild(selfMember.id, guild)) {
      return false;
    }

    if (guild.memberIds.includes(targetMemberId)) {
      return false;
    }

    if (guildMemberCount(guild.id) >= guildMaxMembers(guild)) {
      return false;
    }

    const pendingInvite = readInvites().some(
      (invite) =>
        invite.guildId === guild.id &&
        invite.targetMemberId === targetMemberId &&
        invite.status === 'pending'
    );

    return !pendingInvite;
  });
}

export function canInviteMemberToAnyGuild(targetMember: NamiMember): boolean {
  if (targetMember.id === getSelfMember().id) {
    return false;
  }

  return invitableGuildsForTarget(targetMember.id).length > 0;
}

export function sendGuildInvite(targetMember: NamiMember, guild: NamiGuildRecord): GuildInviteResult {
  const selfMember = getSelfMember();

  if (!canMemberInviteToGuild(selfMember.id, guild)) {
    return { ok: false, reason: 'Only guild owners and members can send invites.' };
  }

  if (guild.memberIds.includes(targetMember.id)) {
    return { ok: false, reason: targetMember.name + ' is already in ' + guild.name + '.' };
  }

  const maxMembers = guildMaxMembers(guild);
  const memberCount = guildMemberCount(guild.id);

  if (memberCount >= maxMembers) {
    const owner = guildOwnerMember(guild);
    const tierLabel = owner?.tier ?? 'Adventurer';

    return {
      ok: false,
      reason:
        guild.name +
        ' is full (' +
        memberCount +
        '/' +
        maxMembers +
        '). ' +
        tierLabel +
        ' guilds cap at ' +
        maxMembers +
        ' members.',
    };
  }

  const invite: GuildInvite = {
    id: 'guild-invite-' + Date.now(),
    guildId: guild.id,
    guildName: guild.name,
    inviterMemberId: selfMember.id,
    inviterName: selfMember.name,
    targetMemberId: targetMember.id,
    targetMemberName: targetMember.name,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  writeInvites([invite, ...readInvites()]);

  return { ok: true, invite };
}

export function pendingInvitesForMember(memberId: string): GuildInvite[] {
  return readInvites().filter(
    (invite) => invite.targetMemberId === memberId && invite.status === 'pending'
  );
}