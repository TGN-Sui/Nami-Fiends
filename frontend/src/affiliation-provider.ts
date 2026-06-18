import { shouldUseDevFixtures } from './app-config.js';
import {
  guildsForMember,
  resolveGuildFromCard,
  resolveSquadFromCard,
  squadsForMember,
  type NamiGuildRecord,
  type NamiSquadRecord,
} from './nami-affiliations.js';
import type { GuildCardView, SquadCardView } from './protocol.js';
import type { ProtocolLoadState } from './protocol-query.js';

export type AffiliationDataSource = 'live' | 'fixture';

export type GuildAffiliationItem = {
  id: string;
  title: string;
  subtitle: string;
  isPublic: boolean;
  memberCount: number;
  badgeLabel: string;
  source: AffiliationDataSource;
  record: NamiGuildRecord;
};

export type SquadAffiliationItem = {
  id: string;
  title: string;
  memberCount: number;
  maxSlots: number;
  roleLabel: string;
  badgeLabel: string;
  source: AffiliationDataSource;
  record: NamiSquadRecord;
  isLeader: boolean;
};

export function mergeGuildRecords(records: NamiGuildRecord[]): NamiGuildRecord[] {
  const seen = new Set<string>();

  return records.filter((guild) => {
    if (seen.has(guild.id)) {
      return false;
    }

    seen.add(guild.id);
    return true;
  });
}

function mapLiveGuildCard(card: GuildCardView): GuildAffiliationItem {
  const record = resolveGuildFromCard(card);

  return {
    id: card.id,
    title: card.title,
    subtitle: card.subtitle,
    isPublic: card.isPublic,
    memberCount: card.memberCount,
    badgeLabel: card.source,
    source: 'live',
    record,
  };
}

function mapFixtureGuild(guild: NamiGuildRecord): GuildAffiliationItem {
  return {
    id: guild.id,
    title: guild.name,
    subtitle: guild.isPublic ? 'Public guild' : 'Private guild',
    isPublic: guild.isPublic,
    memberCount: guild.memberIds.length,
    badgeLabel: 'Guild',
    source: 'fixture',
    record: guild,
  };
}

function mapLiveSquadCard(card: SquadCardView, protocolOwner: string | null): SquadAffiliationItem {
  const record = resolveSquadFromCard(card);
  const isOwner = protocolOwner !== null && card.owner === protocolOwner;

  return {
    id: card.id,
    title: card.name,
    memberCount: card.memberCount,
    maxSlots: card.maxSlots,
    roleLabel: isOwner ? 'Owner' : 'Member',
    badgeLabel: card.source,
    source: 'live',
    record,
    isLeader: isOwner,
  };
}

function mapFixtureSquad(squad: NamiSquadRecord, memberId: string): SquadAffiliationItem {
  const isLeader = squad.memberIds[0] === memberId;

  return {
    id: squad.id,
    title: squad.name,
    memberCount: squad.memberIds.length,
    maxSlots: squad.maxSlots,
    roleLabel: isLeader ? 'Leader' : 'Member',
    badgeLabel: 'Squad',
    source: 'fixture',
    record: squad,
    isLeader,
  };
}

function shouldUseFixtureAffiliations(
  liveCards: unknown[],
  loadState: ProtocolLoadState,
  liveQueryEnabled: boolean
): boolean {
  if (liveCards.length > 0) {
    return false;
  }

  if (!shouldUseDevFixtures()) {
    return false;
  }

  if (liveQueryEnabled && loadState === 'ready') {
    return false;
  }

  return loadState !== 'loading';
}

export function resolveMemberGuildAffiliations(input: {
  liveCards: GuildCardView[];
  loadState: ProtocolLoadState;
  liveQueryEnabled: boolean;
  memberId: string;
  createdGuilds: NamiGuildRecord[];
  fixtureGuilds?: NamiGuildRecord[];
}): GuildAffiliationItem[] {
  if (input.loadState === 'loading') {
    return [];
  }

  if (input.liveCards.length > 0) {
    return input.liveCards.map(mapLiveGuildCard);
  }

  if (!shouldUseFixtureAffiliations(input.liveCards, input.loadState, input.liveQueryEnabled)) {
    return [];
  }

  const fixtureRecords =
    input.fixtureGuilds ??
    mergeGuildRecords([...input.createdGuilds, ...guildsForMember(input.memberId)]);

  return fixtureRecords.map(mapFixtureGuild);
}

export function resolveMemberSquadAffiliations(input: {
  liveCards: SquadCardView[];
  loadState: ProtocolLoadState;
  liveQueryEnabled: boolean;
  memberId: string;
  protocolOwner: string | null;
}): SquadAffiliationItem[] {
  if (input.loadState === 'loading') {
    return [];
  }

  if (input.liveCards.length > 0) {
    return input.liveCards.map((card) => mapLiveSquadCard(card, input.protocolOwner));
  }

  if (!shouldUseFixtureAffiliations(input.liveCards, input.loadState, input.liveQueryEnabled)) {
    return [];
  }

  return squadsForMember(input.memberId).map((squad) => mapFixtureSquad(squad, input.memberId));
}

export function affiliationUsesFixtures<T extends { source: AffiliationDataSource }>(
  items: T[]
): boolean {
  return items.some((item) => item.source === 'fixture');
}