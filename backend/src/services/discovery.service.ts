import {
  aggregateWeeklyChannelBoosts,
  computeChannelModerationPenalty,
  computeGuildModerationPenalty,
  currentDiscoveryWeekId,
  scoreChannelDiscovery,
  scoreGuildDiscovery,
  scoreOwnerBadges,
  type DiscoveryScoreComponents,
} from '../discovery-scoring.js';
import type { ProjectionRegistry } from '../projection-registry.js';

export interface DiscoveryChannelRanking {
  channel_id: string;
  owner: string;
  is_verified: boolean;
  is_public: boolean;
  boost_power: number;
  boost_count: number;
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
}

const DISCOVERY_ENGINE_VERSION = 'phase6-multi-signal-v1';

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

function maxGuildMembersForOwner(registry: ProjectionRegistry, owner: string): number {
  return registry.guilds
    .getAll()
    .filter((guild) => guild.owner === owner && guild.is_public)
    .reduce((max, guild) => Math.max(max, guild.member_count), 0);
}

export function buildChannelDiscoveryRankings(
  registry: ProjectionRegistry,
  options: { weekId?: number; limit?: number } = {},
): {
  cycle: DiscoveryCycleSnapshot;
  channels: DiscoveryChannelRanking[];
} {
  const weekId = resolveWeekId(registry, options.weekId);
  const limit = options.limit ?? 50;
  const boostByChannel = aggregateWeeklyChannelBoosts(registry.boostHistory.getAll(), weekId);
  const moderationRecords = registry.moderation.getAll();
  const badgeEntries = registry.badgeHistory.getAll();
  const nowMs = Date.now();

  const channels = registry.channels
    .getAll()
    .filter((channel) => channel.is_public)
    .map((channel) => {
      const boost = boostByChannel.get(channel.id) ?? {
        power: 0,
        count: 0,
        unique_boosters: 0,
        concentration_capped: false,
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
      const ranked = scoreChannelDiscovery({
        boost,
        isVerified: channel.is_verified,
        isPublic: channel.is_public,
        badgeScore,
        guildMemberCount,
        moderationPenalty,
      });

      return {
        channel_id: channel.id,
        owner: channel.owner,
        is_verified: channel.is_verified,
        is_public: channel.is_public,
        boost_power: boost.power,
        boost_count: boost.count,
        score: ranked.score,
        week_id: weekId,
        rank: 0,
        signals: ranked.signals,
        score_components: ranked.score_components,
      } satisfies DiscoveryChannelRanking;
    })
    .sort((left, right) => right.score - left.score)
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
      const ranked = scoreGuildDiscovery({
        memberCount: guild.member_count,
        isPublic: guild.is_public,
        badgeScore,
        moderationPenalty,
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