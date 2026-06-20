import { shouldUseDevFixtures } from './app-config.js';
import type { GuildCardView, SquadCardView } from './protocol.js';
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

const SEED_GUILDS: NamiGuildRecord[] = [
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
  {
    id: 'guild-passport-showcase',
    name: 'Nami Passport Showcase',
    ownerMemberId: 'm1',
    memberIds: ['m1', 'm2', 'm3', 'm4', 'm6', 'm7', 'm8', 'm9'],
    isPublic: true,
  },
];

const SEED_SQUADS: NamiSquadRecord[] = [
  { id: 'squad-alpha', name: 'Alpha Squad', memberIds: ['m1', 'm2'], maxSlots: 8 },
  { id: 'squad-mint-watch', name: 'Mint Watch', memberIds: ['m1'], maxSlots: 8 },
  { id: 'squad-raid-team', name: 'Raid Team', memberIds: ['m2', 'm3'], maxSlots: 8 },
  { id: 'squad-patch-crew', name: 'Patch Crew', memberIds: ['m3'], maxSlots: 8 },
];

const fixturesEnabled = shouldUseDevFixtures();

export const namiGuilds: NamiGuildRecord[] = fixturesEnabled ? SEED_GUILDS : [];
export const namiSquads: NamiSquadRecord[] = fixturesEnabled ? SEED_SQUADS : [];

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

export function guildById(guildId: string): NamiGuildRecord | undefined {
  return namiGuilds.find((guild) => guild.id === guildId);
}

export function squadById(squadId: string): NamiSquadRecord | undefined {
  return namiSquads.find((squad) => squad.id === squadId);
}

export function guildByIdOrName(guildId: string, guildName?: string): NamiGuildRecord | undefined {
  return (
    guildById(guildId) ??
    (guildName ? guildByName(guildName) : undefined) ??
    namiGuilds.find((guild) => guild.name.toLowerCase() === guildId.toLowerCase())
  );
}

export function squadByIdOrName(squadId: string, squadName?: string): NamiSquadRecord | undefined {
  return (
    squadById(squadId) ??
    (squadName ? squadByName(squadName) : undefined) ??
    namiSquads.find((squad) => squad.name.toLowerCase() === squadId.toLowerCase())
  );
}

function syntheticGuildMemberIds(memberCount: number, seed: string): string[] {
  const normalizedCount = Math.max(1, Math.min(memberCount, members.length));
  const seedOffset = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return members.slice(0, normalizedCount).map((member, index) => {
    const rotatedIndex = (index + seedOffset) % members.length;

    return members[rotatedIndex]!.id;
  });
}

export function resolveGuildFromCard(card: GuildCardView): NamiGuildRecord {
  const existing =
    guildById(card.id) ??
    guildByName(card.title) ??
    namiGuilds.find((guild) => guild.name.toLowerCase() === card.title.toLowerCase());

  if (existing) {
    return existing;
  }

  return {
    id: card.id,
    name: card.title,
    ownerMemberId: members[0]?.id ?? 'm1',
    memberIds: syntheticGuildMemberIds(card.memberCount, card.id),
    isPublic: card.isPublic,
  };
}

export function resolveSquadFromCard(card: SquadCardView): NamiSquadRecord {
  const existing =
    squadById(card.id) ??
    squadByName(card.name) ??
    namiSquads.find((squad) => squad.name.toLowerCase() === card.name.toLowerCase());

  if (existing) {
    return existing;
  }

  return {
    id: card.id,
    name: card.name,
    memberIds: syntheticGuildMemberIds(card.memberCount, card.id),
    maxSlots: card.maxSlots,
  };
}

export function membersForGuild(guild: NamiGuildRecord): NamiMember[] {
  const resolved = guild.memberIds
    .map((memberId) => members.find((member) => member.id === memberId))
    .filter((member): member is NamiMember => Boolean(member));

  if (resolved.length > 0) {
    return resolved;
  }

  return members.slice(0, Math.max(1, guild.memberIds.length));
}

export function membersForSquad(squad: NamiSquadRecord): NamiMember[] {
  const resolved = squad.memberIds
    .map((memberId) => members.find((member) => member.id === memberId))
    .filter((member): member is NamiMember => Boolean(member));

  if (resolved.length > 0) {
    return resolved;
  }

  return members.slice(0, Math.max(1, squad.memberIds.length));
}

export function guildsForSelfMember(): NamiGuildRecord[] {
  return guildsForMember(getSelfMember().id);
}