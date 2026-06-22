import { useSyncExternalStore } from 'react';

import { canUseGuildLeadershipTools } from './guild-space-access.js';
import { getCreatedGuildRecords } from './guild-creation-store.js';
import { canGuildMember, getGuildHierarchy } from './guild-hierarchy-store.js';
import { effectiveGuildMemberIds } from './guild-join-requests-store.js';
import { getSelfMember, isMemberVerified } from './member-access.js';
import {
  canMemberInviteToGuild,
  guildMaxMembers,
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

export function allGuildRecords(): NamiGuildRecord[] {
  const seen = new Set<string>();

  return [...getCreatedGuildRecords(), ...namiGuilds].filter((guild) => {
    if (seen.has(guild.id)) {
      return false;
    }

    seen.add(guild.id);
    return true;
  });
}

export function activeGuildMemberIds(guild: NamiGuildRecord): string[] {
  const removed = new Set(getGuildHierarchy(guild).removedMemberIds);

  return effectiveGuildMemberIds(guild).filter((memberId) => !removed.has(memberId));
}

export function activeGuildMemberCount(guild: NamiGuildRecord): number {
  return activeGuildMemberIds(guild).length;
}

export function guildsWithInvitePermissionForMember(
  memberId: string = getSelfMember().id
): NamiGuildRecord[] {
  return allGuildRecords().filter((guild) => {
    if (!activeGuildMemberIds(guild).includes(memberId)) {
      return false;
    }

    return canGuildMember(guild, memberId, 'inviteMembers');
  });
}

export function canShowGuildInviteOnProfile(targetMember: NamiMember): boolean {
  const selfMember = getSelfMember();

  if (targetMember.id === selfMember.id || !canUseGuildLeadershipTools(selfMember)) {
    return false;
  }

  return guildsWithInvitePermissionForMember(selfMember.id).length > 0;
}

export function invitableGuildsForTarget(targetMemberId: string): NamiGuildRecord[] {
  const selfMember = getSelfMember();

  if (!canUseGuildLeadershipTools(selfMember)) {
    return [];
  }

  return guildsWithInvitePermissionForMember(selfMember.id).filter((guild) => {
    if (!canMemberInviteToGuild(selfMember.id, guild)) {
      return false;
    }

    if (activeGuildMemberIds(guild).includes(targetMemberId)) {
      return false;
    }

    if (activeGuildMemberCount(guild) >= guildMaxMembers(guild)) {
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

  return canShowGuildInviteOnProfile(targetMember);
}

export function sendGuildInvite(targetMember: NamiMember, guild: NamiGuildRecord): GuildInviteResult {
  const selfMember = getSelfMember();

  if (!canUseGuildLeadershipTools(selfMember)) {
    return { ok: false, reason: 'Claim and verify your passport to invite members to guilds.' };
  }

  if (!canMemberInviteToGuild(selfMember.id, guild)) {
    return { ok: false, reason: 'Your guild rank does not allow member invites.' };
  }

  if (!isMemberVerified(targetMember)) {
    return { ok: false, reason: targetMember.name + ' must verify their passport before guild invites.' };
  }

  if (activeGuildMemberIds(guild).includes(targetMember.id)) {
    return { ok: false, reason: targetMember.name + ' is already in ' + guild.name + '.' };
  }

  const maxMembers = guildMaxMembers(guild);
  const memberCount = activeGuildMemberCount(guild);

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