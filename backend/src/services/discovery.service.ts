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
}

export interface DiscoveryGuildRanking {
  guild_id: string;
  owner: string;
  is_public: boolean;
  member_count: number;
  score: number;
  rank: number;
  signals: string[];
}

export interface DiscoveryCycleSnapshot {
  week_id: number;
  generated_at_ms: number;
  channel_count: number;
  guild_count: number;
}

function currentWeekId(nowMs = Date.now()): number {
  return Math.floor(nowMs / 604_800_000);
}

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

  return currentWeekId();
}

export function buildChannelDiscoveryRankings(
  registry: ProjectionRegistry,
  options: { weekId?: number; limit?: number } = {}
): {
  cycle: DiscoveryCycleSnapshot;
  channels: DiscoveryChannelRanking[];
} {
  const weekId = resolveWeekId(registry, options.weekId);
  const limit = options.limit ?? 50;
  const boostByChannel = new Map<string, { power: number; count: number }>();

  for (const entry of registry.boostHistory.getAll()) {
    if (entry.week_id !== weekId) {
      continue;
    }

    const current = boostByChannel.get(entry.channel_id) ?? { power: 0, count: 0 };

    boostByChannel.set(entry.channel_id, {
      power: current.power + entry.power,
      count: current.count + 1,
    });
  }

  const channels = registry.channels
    .getAll()
    .filter((channel) => channel.is_public)
    .map((channel) => {
      const boost = boostByChannel.get(channel.id) ?? { power: 0, count: 0 };
      const signals: string[] = [];

      if (boost.power > 0) {
        signals.push(`boost:${boost.power}`);
      }

      if (channel.is_verified) {
        signals.push('verified');
      }

      if (channel.is_public) {
        signals.push('public');
      }

      const score =
        boost.power * 10 +
        boost.count * 2 +
        (channel.is_verified ? 50 : 0) +
        (channel.is_public ? 10 : 0);

      return {
        channel_id: channel.id,
        owner: channel.owner,
        is_verified: channel.is_verified,
        is_public: channel.is_public,
        boost_power: boost.power,
        boost_count: boost.count,
        score,
        week_id: weekId,
        rank: 0,
        signals,
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
      generated_at_ms: Date.now(),
      channel_count: channels.length,
      guild_count: 0,
    },
    channels,
  };
}

export function buildGuildDiscoveryRankings(
  registry: ProjectionRegistry,
  options: { limit?: number } = {}
): {
  cycle: DiscoveryCycleSnapshot;
  guilds: DiscoveryGuildRanking[];
} {
  const limit = options.limit ?? 50;

  const guilds = registry.guilds
    .listPublicGuilds(limit * 2)
    .map((guild) => {
      const signals: string[] = ['public'];

      if (guild.member_count >= 8) {
        signals.push('active-guild');
      }

      const score = guild.member_count * 5 + (guild.is_public ? 10 : 0);

      return {
        guild_id: guild.id,
        owner: guild.owner,
        is_public: guild.is_public,
        member_count: guild.member_count,
        score,
        rank: 0,
        signals,
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
      generated_at_ms: Date.now(),
      channel_count: 0,
      guild_count: guilds.length,
    },
    guilds,
  };
}