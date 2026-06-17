import { getSelfMember } from './member-access.js';
import { members, type NamiMember } from './uiMockData.js';

export type NamiGuildRecord = {
  id: string;
  name: string;
  ownerMemberId: string;
  memberIds: string[];
  isPublic: boolean;
};

export type NamiSquadRecord = {
  id: string;
  name: string;
  memberIds: string[];
  maxSlots: number;
};

export const NAMI_GUILD_NAMES = [
  'Wave Raiders',
  'Creator Circle',
  'Night Market PvP',
  'Retro Arena',
  'Builder League',
  'Sui Creators',
  'Ocean Mint Crew',
  'Signal Watch',
] as const;

export const NAMI_SQUAD_NAMES = [
  'Alpha Squad',
  'Mint Watch',
  'Raid Team',
  'Patch Crew',
  'Builder Squad',
  'Event Ops',
  'Support Squad',
  'Lore Team',
] as const;

export const namiGuilds: NamiGuildRecord[] = [
  {
    id: 'guild-wave-raiders',
    name: 'Wave Raiders',
    ownerMemberId: 'm1',
    memberIds: ['m1', 'm2'],
    isPublic: true,
  },
  {
    id: 'guild-creator-circle',
    name: 'Creator Circle',
    ownerMemberId: 'm1',
    memberIds: ['m1', 'm3'],
    isPublic: false,
  },
  {
    id: 'guild-night-market',
    name: 'Night Market PvP',
    ownerMemberId: 'm3',
    memberIds: ['m3', 'm2'],
    isPublic: true,
  },
  {
    id: 'guild-builder-league',
    name: 'Builder League',
    ownerMemberId: 'm4',
    memberIds: ['m4'],
    isPublic: true,
  },
];

export const namiSquads: NamiSquadRecord[] = [
  { id: 'squad-alpha', name: 'Alpha Squad', memberIds: ['m1', 'm2'], maxSlots: 8 },
  { id: 'squad-mint-watch', name: 'Mint Watch', memberIds: ['m1'], maxSlots: 8 },
  { id: 'squad-raid-team', name: 'Raid Team', memberIds: ['m2', 'm3'], maxSlots: 8 },
  { id: 'squad-patch-crew', name: 'Patch Crew', memberIds: ['m3'], maxSlots: 8 },
];

export function guildMemberLimitForTier(tier: NamiMember['tier']): number {
  if (tier === 'Elite') {
    return 250;
  }

  if (tier === 'Pro') {
    return 100;
  }

  if (tier === 'Adventurer') {
    return 25;
  }

  return 0;
}

export function guildsForMember(memberId: string): NamiGuildRecord[] {
  return namiGuilds.filter((guild) => guild.memberIds.includes(memberId));
}

export function squadsForMember(memberId: string): NamiSquadRecord[] {
  return namiSquads.filter((squad) => squad.memberIds.includes(memberId));
}

export function guildByName(name: string): NamiGuildRecord | undefined {
  const normalized = name.trim().toLowerCase();

  return namiGuilds.find((guild) => guild.name.toLowerCase() === normalized);
}

export function squadByName(name: string): NamiSquadRecord | undefined {
  const normalized = name.trim().toLowerCase();

  return namiSquads.find((squad) => squad.name.toLowerCase() === normalized);
}

export function guildOwnerMember(guild: NamiGuildRecord): NamiMember | undefined {
  return members.find((member) => member.id === guild.ownerMemberId);
}

export function guildMemberCount(guildId: string): number {
  const guild = namiGuilds.find((entry) => entry.id === guildId);

  return guild?.memberIds.length ?? 0;
}

export function guildMaxMembers(guild: NamiGuildRecord): number {
  const owner = guildOwnerMember(guild);

  return guildMemberLimitForTier(owner?.tier ?? 'NPC');
}

export function canMemberInviteToGuild(memberId: string, guild: NamiGuildRecord): boolean {
  return guild.ownerMemberId === memberId || guild.memberIds.includes(memberId);
}

export function selfInvitableGuilds(): NamiGuildRecord[] {
  const selfId = getSelfMember().id;

  return namiGuilds.filter((guild) => canMemberInviteToGuild(selfId, guild));
}