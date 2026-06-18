import { useSyncExternalStore } from 'react';

import { guildOwnerMember, type NamiGuildRecord } from './nami-affiliations.js';
import { members, type NamiMember } from './uiMockData.js';

const STORAGE_KEY = 'nami.guild.hierarchy';

export const DEFAULT_GUILD_RANK_TITLES = [
  'Guild Master',
  'Officer',
  'Veteran',
  'Member',
] as const;

export type GuildRankPermissionKey =
  | 'inviteMembers'
  | 'promoteMembers'
  | 'demoteMembers'
  | 'removeMembers'
  | 'createEvents'
  | 'editRankTitles'
  | 'manageRankPermissions';

export const GUILD_RANK_PERMISSION_LABELS: Record<GuildRankPermissionKey, string> = {
  inviteMembers: 'Can invite members to guild',
  promoteMembers: 'Can promote members',
  demoteMembers: 'Can demote members',
  removeMembers: 'Can remove members',
  createEvents: 'Can create guild events',
  editRankTitles: 'Can edit rank titles',
  manageRankPermissions: 'Can manage rank permissions',
};

export const GUILD_RANK_PERMISSION_SHORT_LABELS: Record<GuildRankPermissionKey, string> = {
  inviteMembers: 'Invite',
  promoteMembers: 'Promote',
  demoteMembers: 'Demote',
  removeMembers: 'Remove',
  createEvents: 'Events',
  editRankTitles: 'Titles',
  manageRankPermissions: 'Perms',
};

export type GuildMemberRank = {
  memberId: string;
  rankIndex: number;
};

export type GuildRankPermissions = {
  rankIndex: number;
  permissions: Record<GuildRankPermissionKey, boolean>;
};

export type GuildHierarchyState = {
  rankTitles: string[];
  memberRanks: GuildMemberRank[];
  removedMemberIds: string[];
  guildMasterMemberId: string;
  cofounderMemberIds: string[];
  rankPermissions: GuildRankPermissions[];
};

const listeners = new Set<() => void>();
let cachedSnapshot: Record<string, GuildHierarchyState> | null = null;

function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAllHierarchy(): Record<string, GuildHierarchyState> {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, GuildHierarchyState>;

    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeAllHierarchy(next: Record<string, GuildHierarchyState>): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

function getSnapshot(): Record<string, GuildHierarchyState> {
  if (!cachedSnapshot) {
    cachedSnapshot = readAllHierarchy();
  }

  return cachedSnapshot;
}

export function useGuildHierarchyStore(): Record<string, GuildHierarchyState> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function defaultCofounderMemberIds(guild: NamiGuildRecord): string[] {
  return guild.memberIds.filter((memberId) => memberId !== guild.ownerMemberId).slice(0, 2);
}

function defaultPermissionsForRank(rankIndex: number): Record<GuildRankPermissionKey, boolean> {
  if (rankIndex === 0) {
    return {
      inviteMembers: true,
      promoteMembers: true,
      demoteMembers: true,
      removeMembers: true,
      createEvents: true,
      editRankTitles: true,
      manageRankPermissions: true,
    };
  }

  return {
    inviteMembers: false,
    promoteMembers: false,
    demoteMembers: false,
    removeMembers: false,
    createEvents: false,
    editRankTitles: false,
    manageRankPermissions: false,
  };
}

function buildDefaultRankPermissions(rankCount: number): GuildRankPermissions[] {
  return Array.from({ length: rankCount }, (_, rankIndex) => ({
    rankIndex,
    permissions: defaultPermissionsForRank(rankIndex),
  }));
}

function normalizeHierarchy(guild: NamiGuildRecord, state: Partial<GuildHierarchyState>): GuildHierarchyState {
  const owner = guildOwnerMember(guild);
  const masterId = state.guildMasterMemberId ?? guild.ownerMemberId;
  const rankTitles =
    state.rankTitles && state.rankTitles.length > 0
      ? state.rankTitles
      : [...DEFAULT_GUILD_RANK_TITLES];

  return {
    rankTitles,
    memberRanks:
      state.memberRanks ??
      guild.memberIds.map((memberId, index) => ({
        memberId,
        rankIndex:
          memberId === masterId ? 0 : Math.min(index + 1, rankTitles.length - 1),
      })),
    removedMemberIds: state.removedMemberIds ?? [],
    guildMasterMemberId: masterId,
    cofounderMemberIds: state.cofounderMemberIds ?? defaultCofounderMemberIds(guild),
    rankPermissions:
      state.rankPermissions && state.rankPermissions.length > 0
        ? state.rankPermissions
        : buildDefaultRankPermissions(rankTitles.length),
  };
}

function defaultHierarchyForGuild(guild: NamiGuildRecord): GuildHierarchyState {
  return normalizeHierarchy(guild, {});
}

export function getGuildHierarchy(guild: NamiGuildRecord): GuildHierarchyState {
  const stored = readAllHierarchy()[guild.id];

  if (stored) {
    return normalizeHierarchy(guild, stored);
  }

  return defaultHierarchyForGuild(guild);
}

function saveGuildHierarchy(guildId: string, state: GuildHierarchyState): void {
  const next = { ...readAllHierarchy(), [guildId]: state };
  writeAllHierarchy(next);
}

export function initializeGuildHierarchy(
  guild: NamiGuildRecord,
  creatorMemberId: string,
  cofounderMemberIds: string[]
): void {
  const rankTitles = [...DEFAULT_GUILD_RANK_TITLES];
  const memberIds = [creatorMemberId, ...cofounderMemberIds];

  saveGuildHierarchy(guild.id, {
    rankTitles,
    guildMasterMemberId: creatorMemberId,
    cofounderMemberIds,
    removedMemberIds: [],
    rankPermissions: buildDefaultRankPermissions(rankTitles.length),
    memberRanks: memberIds.map((memberId, index) => ({
      memberId,
      rankIndex: memberId === creatorMemberId ? 0 : Math.min(index, rankTitles.length - 1),
    })),
  });
}

export function getGuildMasterMemberId(guild: NamiGuildRecord): string {
  return getGuildHierarchy(guild).guildMasterMemberId;
}

export function isGuildMaster(guild: NamiGuildRecord, memberId: string): boolean {
  return getGuildMasterMemberId(guild) === memberId;
}

export function isGuildCofounder(guild: NamiGuildRecord, memberId: string): boolean {
  return getGuildHierarchy(guild).cofounderMemberIds.includes(memberId);
}

export function getMemberRankIndex(guild: NamiGuildRecord, memberId: string): number {
  const hierarchy = getGuildHierarchy(guild);
  const entry = hierarchy.memberRanks.find((rank) => rank.memberId === memberId);

  return entry?.rankIndex ?? hierarchy.rankTitles.length - 1;
}

export function canGuildMember(
  guild: NamiGuildRecord,
  memberId: string,
  permission: GuildRankPermissionKey
): boolean {
  if (isGuildMaster(guild, memberId)) {
    return true;
  }

  const hierarchy = getGuildHierarchy(guild);
  const rankIndex = getMemberRankIndex(guild, memberId);
  const rankPermissions = hierarchy.rankPermissions.find((entry) => entry.rankIndex === rankIndex);

  return rankPermissions?.permissions[permission] === true;
}

export function updateGuildRankTitles(guild: NamiGuildRecord, rankTitles: string[]): void {
  const normalized = rankTitles
    .map((title) => title.trim())
    .filter((title) => title.length > 0)
    .slice(0, 8);

  if (normalized.length === 0) {
    return;
  }

  const current = getGuildHierarchy(guild);

  saveGuildHierarchy(guild.id, {
    ...current,
    rankTitles: normalized,
    memberRanks: current.memberRanks.map((entry) => ({
      ...entry,
      rankIndex: Math.min(entry.rankIndex, normalized.length - 1),
    })),
    rankPermissions: current.rankPermissions
      .filter((entry) => entry.rankIndex < normalized.length)
      .concat(
        Array.from({ length: Math.max(0, normalized.length - current.rankPermissions.length) }, (_, offset) => ({
          rankIndex: current.rankPermissions.length + offset,
          permissions: defaultPermissionsForRank(current.rankPermissions.length + offset),
        }))
      ),
  });
}

export function setGuildRankPermission(
  guild: NamiGuildRecord,
  rankIndex: number,
  permission: GuildRankPermissionKey,
  enabled: boolean,
  actingMemberId: string
): { ok: true } | { ok: false; reason: string } {
  if (!isGuildMaster(guild, actingMemberId)) {
    return { ok: false, reason: 'Only the guild master can change rank permissions.' };
  }

  if (rankIndex === 0) {
    return { ok: false, reason: 'Guild Master rank permissions cannot be changed.' };
  }

  const current = getGuildHierarchy(guild);
  const nextPermissions = current.rankPermissions.map((entry) => {
    if (entry.rankIndex !== rankIndex) {
      return entry;
    }

    return {
      ...entry,
      permissions: {
        ...entry.permissions,
        [permission]: enabled,
      },
    };
  });

  saveGuildHierarchy(guild.id, {
    ...current,
    rankPermissions: nextPermissions,
  });

  return { ok: true };
}

export function setGuildMemberRank(
  guild: NamiGuildRecord,
  memberId: string,
  rankIndex: number
): void {
  const current = getGuildHierarchy(guild);
  const maxIndex = Math.max(0, current.rankTitles.length - 1);
  const nextIndex = Math.max(0, Math.min(rankIndex, maxIndex));

  saveGuildHierarchy(guild.id, {
    ...current,
    memberRanks: current.memberRanks.map((entry) =>
      entry.memberId === memberId ? { ...entry, rankIndex: nextIndex } : entry
    ),
  });
}

export function relinquishGuildMaster(
  guild: NamiGuildRecord,
  toMemberId: string,
  actingMemberId: string
): { ok: true } | { ok: false; reason: string } {
  if (!isGuildMaster(guild, actingMemberId)) {
    return { ok: false, reason: 'Only the current guild master can relinquish the role.' };
  }

  const current = getGuildHierarchy(guild);

  if (!current.cofounderMemberIds.includes(toMemberId)) {
    return { ok: false, reason: 'Guild master can only be passed to a co-founding member.' };
  }

  if (toMemberId === actingMemberId) {
    return { ok: false, reason: 'Pick a different co-founder to become guild master.' };
  }

  const actingRank = getMemberRankIndex(guild, actingMemberId);
  const targetRank = getMemberRankIndex(guild, toMemberId);

  saveGuildHierarchy(guild.id, {
    ...current,
    guildMasterMemberId: toMemberId,
    memberRanks: current.memberRanks.map((entry) => {
      if (entry.memberId === toMemberId) {
        return { ...entry, rankIndex: 0 };
      }

      if (entry.memberId === actingMemberId) {
        return { ...entry, rankIndex: Math.max(1, targetRank) };
      }

      return entry;
    }),
    rankPermissions: current.rankPermissions.map((entry) => {
      if (entry.rankIndex === 0 || entry.rankIndex === actingRank) {
        return {
          rankIndex: entry.rankIndex,
          permissions: defaultPermissionsForRank(entry.rankIndex),
        };
      }

      return entry;
    }),
  });

  return { ok: true };
}

export function removeGuildMember(
  guild: NamiGuildRecord,
  memberId: string
): { ok: true } | { ok: false; reason: string } {
  if (isGuildMaster(guild, memberId)) {
    return { ok: false, reason: 'The guild master cannot be removed from the roster.' };
  }

  const current = getGuildHierarchy(guild);

  if (current.removedMemberIds.includes(memberId)) {
    return { ok: false, reason: 'That member is already off the guild roster.' };
  }

  saveGuildHierarchy(guild.id, {
    ...current,
    removedMemberIds: [...current.removedMemberIds, memberId],
    memberRanks: current.memberRanks.filter((entry) => entry.memberId !== memberId),
  });

  return { ok: true };
}

export function managedGuildMemberIds(guild: NamiGuildRecord): string[] {
  const hierarchy = getGuildHierarchy(guild);

  return guild.memberIds.filter((memberId) => !hierarchy.removedMemberIds.includes(memberId));
}

export function managedMembersForGuild(guild: NamiGuildRecord): NamiMember[] {
  const hierarchy = getGuildHierarchy(guild);
  const memberIds = managedGuildMemberIds(guild);
  const rankMap = new Map(hierarchy.memberRanks.map((entry) => [entry.memberId, entry.rankIndex]));

  return memberIds
    .map((memberId) => members.find((member) => member.id === memberId))
    .filter((member): member is NamiMember => Boolean(member))
    .sort((left, right) => {
      const leftRank = rankMap.get(left.id) ?? hierarchy.rankTitles.length;
      const rightRank = rankMap.get(right.id) ?? hierarchy.rankTitles.length;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.name.localeCompare(right.name);
    });
}

export function rankTitleForMember(guild: NamiGuildRecord, memberId: string): string {
  const hierarchy = getGuildHierarchy(guild);
  const entry = hierarchy.memberRanks.find((rank) => rank.memberId === memberId);
  const rankIndex = entry?.rankIndex ?? hierarchy.rankTitles.length - 1;

  return hierarchy.rankTitles[rankIndex] ?? hierarchy.rankTitles[hierarchy.rankTitles.length - 1] ?? 'Member';
}