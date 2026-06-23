import { BADGE_SOURCE, type BadgeHistoryEntry } from './services/badge-history.service.js';
import {
  MODERATION_ACTION,
  type ModerationRecordProjection,
} from './services/moderation.service.js';
import type { BoostHistoryEntry } from './services/boost-history.service.js';

/** Phase 6 discovery weights — no single signal dominates ranking. */
export const DISCOVERY_CHANNEL_WEIGHTS = {
  boostPower: 10,
  boostCount: 2,
  verified: 50,
  public: 10,
  badgeIssuer: 8,
  badgeMinted: 3,
  badgeScoreCap: 40,
  guildActivity: 15,
  guildActivityMemberThreshold: 8,
  moderationWarning: -5,
  moderationMute: -12,
  moderationChannelBan: -20,
  moderationBlack: -100,
  maxBoostsPerOwnerPerChannel: 3,
} as const;

export const DISCOVERY_GUILD_WEIGHTS = {
  memberCount: 5,
  public: 10,
  activeGuild: 20,
  activeGuildMemberThreshold: 8,
  badgeIssuer: 4,
  badgeMinted: 2,
  badgeScoreCap: 24,
  moderationWarning: -4,
  moderationMute: -10,
  moderationBlack: -80,
} as const;

export type DiscoveryScoreComponents = {
  boost: number;
  verification: number;
  badges: number;
  guild: number;
  moderation: number;
  base: number;
};

export type ChannelBoostAggregate = {
  power: number;
  count: number;
  unique_boosters: number;
  concentration_capped: boolean;
};

export function currentDiscoveryWeekId(nowMs = Date.now()): number {
  return Math.floor(nowMs / 604_800_000);
}

export function aggregateWeeklyChannelBoosts(
  entries: BoostHistoryEntry[],
  weekId: number,
  maxBoostsPerOwnerPerChannel = DISCOVERY_CHANNEL_WEIGHTS.maxBoostsPerOwnerPerChannel,
): Map<string, ChannelBoostAggregate> {
  const ownerChannelCounts = new Map<string, number>();
  const aggregates = new Map<
    string,
    { power: number; count: number; boosters: Set<string>; capped: boolean }
  >();

  for (const entry of entries) {
    if (entry.week_id !== weekId) {
      continue;
    }

    const ownerChannelKey = `${entry.channel_id}|${entry.owner}`;
    const used = ownerChannelCounts.get(ownerChannelKey) ?? 0;

    if (used >= maxBoostsPerOwnerPerChannel) {
      const current = aggregates.get(entry.channel_id);

      if (current) {
        current.capped = true;
      }

      continue;
    }

    ownerChannelCounts.set(ownerChannelKey, used + 1);

    const bucket =
      aggregates.get(entry.channel_id) ??
      { power: 0, count: 0, boosters: new Set<string>(), capped: false };

    bucket.power += entry.power;
    bucket.count += 1;
    bucket.boosters.add(entry.owner);
    aggregates.set(entry.channel_id, bucket);
  }

  const result = new Map<string, ChannelBoostAggregate>();

  for (const [channelId, bucket] of aggregates) {
    result.set(channelId, {
      power: bucket.power,
      count: bucket.count,
      unique_boosters: bucket.boosters.size,
      concentration_capped: bucket.capped,
    });
  }

  return result;
}

function isModerationRecordActive(record: ModerationRecordProjection, nowMs: number): boolean {
  if (record.action_type === MODERATION_ACTION.WARNING) {
    return false;
  }

  if (record.expires_at_ms === null) {
    return true;
  }

  return record.expires_at_ms > nowMs;
}

function warningIssuedRecently(
  record: ModerationRecordProjection,
  nowMs: number,
  windowMs = 90 * 86_400_000,
): boolean {
  if (record.action_type !== MODERATION_ACTION.WARNING) {
    return false;
  }

  const issuedAt = record.issued_at_ms ? Number(record.issued_at_ms) : 0;

  return issuedAt > 0 && nowMs - issuedAt <= windowMs;
}

export function computeChannelModerationPenalty(
  records: ModerationRecordProjection[],
  channelId: string,
  owner: string,
  nowMs = Date.now(),
): number {
  let penalty = 0;
  let warningCount = 0;

  for (const record of records) {
    if (record.channel_id === channelId) {
      if (!isModerationRecordActive(record, nowMs)) {
        continue;
      }

      if (record.action_type === MODERATION_ACTION.MUTE) {
        penalty += DISCOVERY_CHANNEL_WEIGHTS.moderationMute;
      }

      if (record.action_type === MODERATION_ACTION.CHANNEL_BAN) {
        penalty += DISCOVERY_CHANNEL_WEIGHTS.moderationChannelBan;
      }
    }

    if (record.target_owner !== owner) {
      continue;
    }

    if (warningIssuedRecently(record, nowMs)) {
      warningCount += 1;
      continue;
    }

    if (
      record.action_type === MODERATION_ACTION.BLACK_PASSPORT &&
      isModerationRecordActive(record, nowMs)
    ) {
      penalty += DISCOVERY_CHANNEL_WEIGHTS.moderationBlack;
    }
  }

  penalty += Math.min(3, warningCount) * DISCOVERY_CHANNEL_WEIGHTS.moderationWarning;

  return penalty;
}

export function computeGuildModerationPenalty(
  records: ModerationRecordProjection[],
  owner: string,
  nowMs = Date.now(),
): number {
  let penalty = 0;
  let warningCount = 0;

  for (const record of records) {
    if (record.target_owner !== owner) {
      continue;
    }

    if (warningIssuedRecently(record, nowMs)) {
      warningCount += 1;
      continue;
    }

    if (!isModerationRecordActive(record, nowMs)) {
      continue;
    }

    if (record.action_type === MODERATION_ACTION.MUTE) {
      penalty += DISCOVERY_GUILD_WEIGHTS.moderationMute;
    }

    if (record.action_type === MODERATION_ACTION.BLACK_PASSPORT) {
      penalty += DISCOVERY_GUILD_WEIGHTS.moderationBlack;
    }
  }

  penalty += Math.min(3, warningCount) * DISCOVERY_GUILD_WEIGHTS.moderationWarning;

  return penalty;
}

export function scoreOwnerBadges(
  entries: BadgeHistoryEntry[],
  owner: string,
  weights: { issuer: number; minted: number; cap: number },
): number {
  let score = 0;

  for (const entry of entries) {
    if (entry.owner !== owner) {
      continue;
    }

    if (entry.source === BADGE_SOURCE.ISSUER) {
      score += weights.issuer;
      continue;
    }

    score += weights.minted;
  }

  return Math.min(weights.cap, score);
}

export function scoreChannelDiscovery(input: {
  boost: ChannelBoostAggregate;
  isVerified: boolean;
  isPublic: boolean;
  badgeScore: number;
  guildMemberCount: number;
  moderationPenalty: number;
}): { score: number; signals: string[]; score_components: DiscoveryScoreComponents } {
  const signals: string[] = [];
  const boostScore =
    input.boost.power * DISCOVERY_CHANNEL_WEIGHTS.boostPower +
    input.boost.count * DISCOVERY_CHANNEL_WEIGHTS.boostCount;
  const verificationScore =
    (input.isVerified ? DISCOVERY_CHANNEL_WEIGHTS.verified : 0) +
    (input.isPublic ? DISCOVERY_CHANNEL_WEIGHTS.public : 0);
  const guildScore =
    input.guildMemberCount >= DISCOVERY_CHANNEL_WEIGHTS.guildActivityMemberThreshold
      ? DISCOVERY_CHANNEL_WEIGHTS.guildActivity
      : 0;

  if (input.boost.power > 0) {
    signals.push(`boost:${input.boost.power}`);
  }

  if (input.boost.unique_boosters > 0) {
    signals.push(`boosters:${input.boost.unique_boosters}`);
  }

  if (input.boost.concentration_capped) {
    signals.push('boost-concentration-capped');
  }

  if (input.isVerified) {
    signals.push('verified');
  }

  if (input.isPublic) {
    signals.push('public');
  }

  if (input.badgeScore > 0) {
    signals.push(`badge-quality:${input.badgeScore}`);
  }

  if (guildScore > 0) {
    signals.push('guild-activity');
  }

  if (input.moderationPenalty < 0) {
    signals.push(`moderation:${input.moderationPenalty}`);
  }

  const score = Math.max(
    0,
    boostScore + verificationScore + input.badgeScore + guildScore + input.moderationPenalty,
  );

  return {
    score,
    signals,
    score_components: {
      boost: boostScore,
      verification: verificationScore,
      badges: input.badgeScore,
      guild: guildScore,
      moderation: input.moderationPenalty,
      base: verificationScore,
    },
  };
}

export function scoreGuildDiscovery(input: {
  memberCount: number;
  isPublic: boolean;
  badgeScore: number;
  moderationPenalty: number;
}): { score: number; signals: string[]; score_components: DiscoveryScoreComponents } {
  const signals: string[] = [];
  const memberScore = input.memberCount * DISCOVERY_GUILD_WEIGHTS.memberCount;
  const publicScore = input.isPublic ? DISCOVERY_GUILD_WEIGHTS.public : 0;
  const activeGuildScore =
    input.memberCount >= DISCOVERY_GUILD_WEIGHTS.activeGuildMemberThreshold
      ? DISCOVERY_GUILD_WEIGHTS.activeGuild
      : 0;

  if (input.isPublic) {
    signals.push('public');
  }

  if (activeGuildScore > 0) {
    signals.push('active-guild');
  }

  if (input.badgeScore > 0) {
    signals.push(`badge-quality:${input.badgeScore}`);
  }

  if (input.moderationPenalty < 0) {
    signals.push(`moderation:${input.moderationPenalty}`);
  }

  const score = Math.max(
    0,
    memberScore + publicScore + activeGuildScore + input.badgeScore + input.moderationPenalty,
  );

  return {
    score,
    signals,
    score_components: {
      boost: 0,
      verification: publicScore,
      badges: input.badgeScore,
      guild: memberScore + activeGuildScore,
      moderation: input.moderationPenalty,
      base: publicScore,
    },
  };
}