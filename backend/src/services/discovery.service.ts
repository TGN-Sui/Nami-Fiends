import {
  DISCOVERY_CHANNEL_CATEGORIES,
  normalizeDiscoveryChannelCategory,
  type DiscoveryChannelCategoryId,
} from '../discovery-categories.js';
import {
  aggregateWeeklyChannelBoosts,
  computeChannelModerationPenalty,
  computeGuildModerationPenalty,
  currentDiscoveryWeekId,
  matchesDiscoveryChannelCategory,
  scoreChannelDiscovery,
  scoreGuildDiscovery,
  scoreOwnerBadges,
  scoreOwnerConduct,
  scorePublicProfile,
  scoreSquadActivity,
  sortChannelRankingsForCategory,
  type DiscoveryScoreComponents,
} from '../discovery-scoring.js';
import type { PassportTimelineSnapshot } from './passport-timeline.service.js';
import type { ProjectionRegistry } from '../projection-registry.js';

export interface DiscoveryChannelRanking {
  channel_id: string;
  owner: string;
  is_verified: boolean;
  is_public: boolean;
  boost_power: number;
  boost_count: number;
  rising_delta: number;
  score: number;
  week_id: number;
  rank: number;
  signals: string[];
  score_components: DiscoveryScoreComponents;
}

export interface DiscoveryGuildRanking {
  guild_id: string;
  owner: string;
  is_public: boolean;
  member_count: number;
  score: number;
  rank: number;
  signals: string[];
  score_components: DiscoveryScoreComponents;
}

export interface DiscoveryCycleSnapshot {
  week_id: number;
  generated_at_ms: number;
  channel_count: number;
  guild_count: number;
  engine_version: string;
  category?: DiscoveryChannelCategoryId;
}

const DISCOVERY_ENGINE_VERSION = 'phase6-complete-v2';

function resolveWeekId(registry: ProjectionRegistry, override?: number): number {
  if (override !== undefined && Number.isFinite(override)) {
    return override;
  }

  const boostWeeks = registry.boostHistory
    .getAll()
    .map((entry) => entry.week_id)
    .filter((week) => Number.isFinite(week));

  if (boostWeeks.length > 0) {
    return Math.max(...boostWeeks);
  }

  return currentDiscoveryWeekId();
}

function buildOwnerSnapshotIndex(
  registry: ProjectionRegistry,
): Map<string, PassportTimelineSnapshot | undefined> {
  const index = new Map<string, PassportTimelineSnapshot | undefined>();

  for (const profile of registry.profiles.getAll()) {
    index.set(profile.owner, registry.passportTimelines.getSnapshot(profile.passport_id));
  }

  for (const channel of registry.channels.getAll()) {
    if (!index.has(channel.owner)) {
      index.set(
        channel.owner,
        registry.passportTimelines.getSnapshot(channel.owner_passport_id),
      );
    }
  }

  return index;
}

function maxGuildMembersForOwner(registry: ProjectionRegistry, owner: string): number {
  return registry.guilds
    .getAll()
    .filter((guild) => guild.owner === owner && guild.is_public)
    .reduce((max, guild) => Math.max(max, guild.member_count), 0);
}

export function listDiscoveryChannelCategories() {
  return DISCOVERY_CHANNEL_CATEGORIES;
}

export function buildChannelDiscoveryRankings(
  registry: ProjectionRegistry,
  options: { weekId?: number; limit?: number; category?: string } = {},
): {
  cycle: DiscoveryCycleSnapshot;
  channels: DiscoveryChannelRanking[];
} {
  const weekId = resolveWeekId(registry, options.weekId);
  const category = normalizeDiscoveryChannelCategory(options.category);
  const limit = options.limit ?? 50;
  const ownerSnapshots = buildOwnerSnapshotIndex(registry);
  const boostByChannel = aggregateWeeklyChannelBoosts(
    registry.boostHistory.getAll(),
    weekId,
    ownerSnapshots,
    undefined,
    weekId - 1,
  );
  const moderationRecords = registry.moderation.getAll();
  const badgeEntries = registry.badgeHistory.getAll();
  const squads = registry.squads.getAll();
  const nowMs = Date.now();

  const channels = registry.channels
    .getAll()
    .filter((channel) => channel.is_public)
    .map((channel) => {
      const boost = boostByChannel.get(channel.id) ?? {
        power: 0,
        weighted_power: 0,
        count: 0,
        unique_boosters: 0,
        concentration_capped: false,
        dominant_owner_share: 0,
        rising_delta: 0,
      };
      const badgeScore = scoreOwnerBadges(badgeEntries, channel.owner, {
        issuer: 8,
        minted: 3,
        cap: 40,
      });
      const guildMemberCount = maxGuildMembersForOwner(registry, channel.owner);
      const moderationPenalty = computeChannelModerationPenalty(
        moderationRecords,
        channel.id,
        channel.owner,
        nowMs,
      );
      const ownerSnapshot =
        ownerSnapshots.get(channel.owner) ??
        registry.passportTimelines.getSnapshot(channel.owner_passport_id);
      const conduct = scoreOwnerConduct(ownerSnapshot);
      const squadScore = scoreSquadActivity(
        squads,
        channel.owner,
        2,
        16,
      );
      const profileScore = scorePublicProfile(registry.profiles.getByOwner(channel.owner));
      const access = registry.channelAccess.getPolicy(channel.id);
      const ranked = scoreChannelDiscovery({
        boost,
        isVerified: channel.is_verified,
        isPublic: channel.is_public,
        badgeScore,
        guildMemberCount,
        moderationPenalty,
        conductScore: conduct.score,
        squadScore,
        profileScore,
        category,
      });

      return {
        channel_id: channel.id,
        owner: channel.owner,
        is_verified: channel.is_verified,
        is_public: channel.is_public,
        boost_power: boost.power,
        boost_count: boost.count,
        rising_delta: boost.rising_delta,
        score: ranked.score,
        week_id: weekId,
        rank: 0,
        signals: ranked.signals,
        score_components: ranked.score_components,
        categoryEligible: matchesDiscoveryChannelCategory({
          category,
          isVerified: channel.is_verified,
          badgeScore,
          guildMemberCount,
          conductSignal: conduct.signal,
          access,
          boost,
          conductExcluded: conduct.excluded,
        }),
      };
    })
    .filter((entry) => entry.categoryEligible)
    .map(({ categoryEligible: _categoryEligible, ...entry }) => entry)
    .sort((left, right) => sortChannelRankingsForCategory(category, left, right))
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return {
    cycle: {
      week_id: weekId,
      generated_at_ms: nowMs,
      channel_count: channels.length,
      guild_count: 0,
      engine_version: DISCOVERY_ENGINE_VERSION,
      category,
    },
    channels,
  };
}

export function buildGuildDiscoveryRankings(
  registry: ProjectionRegistry,
  options: { limit?: number } = {},
): {
  cycle: DiscoveryCycleSnapshot;
  guilds: DiscoveryGuildRanking[];
} {
  const limit = options.limit ?? 50;
  const moderationRecords = registry.moderation.getAll();
  const badgeEntries = registry.badgeHistory.getAll();
  const squads = registry.squads.getAll();
  const nowMs = Date.now();

  const guilds = registry.guilds
    .listPublicGuilds(limit * 2)
    .map((guild) => {
      const badgeScore = scoreOwnerBadges(badgeEntries, guild.owner, {
        issuer: 4,
        minted: 2,
        cap: 24,
      });
      const moderationPenalty = computeGuildModerationPenalty(
        moderationRecords,
        guild.owner,
        nowMs,
      );
      const squadScore = scoreSquadActivity(squads, guild.owner, 1, 12);
      const profileScore = scorePublicProfile(registry.profiles.getByOwner(guild.owner));
      const ranked = scoreGuildDiscovery({
        memberCount: guild.member_count,
        isPublic: guild.is_public,
        badgeScore,
        moderationPenalty,
        squadScore,
        profileScore,
      });

      return {
        guild_id: guild.id,
        owner: guild.owner,
        is_public: guild.is_public,
        member_count: guild.member_count,
        score: ranked.score,
        rank: 0,
        signals: ranked.signals,
        score_components: ranked.score_components,
      } satisfies DiscoveryGuildRanking;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return {
    cycle: {
      week_id: resolveWeekId(registry),
      generated_at_ms: nowMs,
      channel_count: 0,
      guild_count: guilds.length,
      engine_version: DISCOVERY_ENGINE_VERSION,
    },
    guilds,
  };
}