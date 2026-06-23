import type { DiscoveryChannelCategoryId } from './discovery-categories.js';
import { BADGE_SOURCE, type BadgeHistoryEntry } from './services/badge-history.service.js';
import type { ChannelAccessProjection } from './services/channel-access.service.js';
import {
  MODERATION_ACTION,
  type ModerationRecordProjection,
} from './services/moderation.service.js';
import type { BoostHistoryEntry } from './services/boost-history.service.js';
import type { PassportTimelineSnapshot } from './services/passport-timeline.service.js';
import type { ProfileProjection } from './services/profile.service.js';
import type { SquadProjection } from './services/squad.service.js';

export const CONDUCT_SIGNAL = {
  GREEN: 1,
  ORANGE: 2,
  RED: 3,
  BLACK: 4,
} as const;

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
  conductGreen: 8,
  conductOrange: 4,
  conductRed: 2,
  conductBlackExclude: true,
  squadMember: 2,
  squadScoreCap: 16,
  publicProfile: 10,
  reputationBoostMultiplierStep: 0.05,
  membershipTierBoostMultiplier: 0.05,
  anomalyDominanceThreshold: 0.6,
  anomalyPenalty: -15,
  risingBoostPowerWeight: 12,
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
  squadMember: 1,
  squadScoreCap: 12,
  publicProfile: 8,
} as const;

export type DiscoveryScoreComponents = {
  boost: number;
  verification: number;
  badges: number;
  guild: number;
  moderation: number;
  reputation: number;
  squad: number;
  profile: number;
  anomaly: number;
  base: number;
};

export type ChannelBoostAggregate = {
  power: number;
  weighted_power: number;
  count: number;
  unique_boosters: number;
  concentration_capped: boolean;
  dominant_owner_share: number;
  rising_delta: number;
};

export function currentDiscoveryWeekId(nowMs = Date.now()): number {
  return Math.floor(nowMs / 604_800_000);
}

export function boosterQualityMultiplier(
  snapshot: PassportTimelineSnapshot | undefined,
  membershipTier: number,
): number {
  const reputation = snapshot?.reputation ?? 0;
  const reputationMultiplier =
    1 + Math.max(0, reputation) * DISCOVERY_CHANNEL_WEIGHTS.reputationBoostMultiplierStep;
  const tierMultiplier =
    1 + Math.max(0, membershipTier) * DISCOVERY_CHANNEL_WEIGHTS.membershipTierBoostMultiplier;

  return reputationMultiplier * tierMultiplier;
}

export function aggregateWeeklyChannelBoosts(
  entries: BoostHistoryEntry[],
  weekId: number,
  ownerSnapshots: Map<string, PassportTimelineSnapshot | undefined> = new Map(),
  maxBoostsPerOwnerPerChannel = DISCOVERY_CHANNEL_WEIGHTS.maxBoostsPerOwnerPerChannel,
  previousWeekId?: number,
): Map<string, ChannelBoostAggregate> {
  const ownerChannelCounts = new Map<string, number>();
  const aggregates = new Map<
    string,
    {
      power: number;
      weighted_power: number;
      count: number;
      boosters: Set<string>;
      capped: boolean;
      ownerPower: Map<string, number>;
    }
  >();
  const previousPower = new Map<string, number>();

  for (const entry of entries) {
    if (previousWeekId !== undefined && entry.week_id === previousWeekId) {
      previousPower.set(
        entry.channel_id,
        (previousPower.get(entry.channel_id) ?? 0) + entry.power,
      );
    }

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
      {
        power: 0,
        weighted_power: 0,
        count: 0,
        boosters: new Set<string>(),
        capped: false,
        ownerPower: new Map<string, number>(),
      };

    const multiplier = boosterQualityMultiplier(
      ownerSnapshots.get(entry.owner),
      entry.tier,
    );
    const weightedPower = entry.power * multiplier;

    bucket.power += entry.power;
    bucket.weighted_power += weightedPower;
    bucket.count += 1;
    bucket.boosters.add(entry.owner);
    bucket.ownerPower.set(entry.owner, (bucket.ownerPower.get(entry.owner) ?? 0) + weightedPower);
    aggregates.set(entry.channel_id, bucket);
  }

  const result = new Map<string, ChannelBoostAggregate>();

  for (const [channelId, bucket] of aggregates) {
    const totalWeighted = bucket.weighted_power;
    const dominantOwnerPower = Math.max(0, ...bucket.ownerPower.values());
    const dominantShare = totalWeighted > 0 ? dominantOwnerPower / totalWeighted : 0;
    const previous = previousPower.get(channelId) ?? 0;

    result.set(channelId, {
      power: bucket.power,
      weighted_power: bucket.weighted_power,
      count: bucket.count,
      unique_boosters: bucket.boosters.size,
      concentration_capped: bucket.capped,
      dominant_owner_share: dominantShare,
      rising_delta: bucket.power - previous,
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

export function scoreOwnerConduct(snapshot: PassportTimelineSnapshot | undefined): {
  score: number;
  signal: number | null;
  excluded: boolean;
} {
  const signal = snapshot?.conduct_signal ?? null;

  if (signal === CONDUCT_SIGNAL.BLACK) {
    return { score: 0, signal, excluded: DISCOVERY_CHANNEL_WEIGHTS.conductBlackExclude };
  }

  if (signal === CONDUCT_SIGNAL.GREEN) {
    return { score: DISCOVERY_CHANNEL_WEIGHTS.conductGreen, signal, excluded: false };
  }

  if (signal === CONDUCT_SIGNAL.ORANGE) {
    return { score: DISCOVERY_CHANNEL_WEIGHTS.conductOrange, signal, excluded: false };
  }

  if (signal === CONDUCT_SIGNAL.RED) {
    return { score: DISCOVERY_CHANNEL_WEIGHTS.conductRed, signal, excluded: false };
  }

  return { score: 0, signal, excluded: false };
}

export function scoreSquadActivity(
  squads: SquadProjection[],
  owner: string,
  memberWeight: number,
  cap: number,
): number {
  const sponsoredMembers = squads
    .filter((squad) => squad.owner === owner)
    .reduce((total, squad) => total + Math.max(0, squad.member_count - 1), 0);

  return Math.min(cap, sponsoredMembers * memberWeight);
}

export function scorePublicProfile(profile: ProfileProjection | undefined): number {
  return profile?.is_public ? DISCOVERY_CHANNEL_WEIGHTS.publicProfile : 0;
}

export function scoreBoostAnomaly(boost: ChannelBoostAggregate): number {
  if (boost.dominant_owner_share >= DISCOVERY_CHANNEL_WEIGHTS.anomalyDominanceThreshold) {
    return DISCOVERY_CHANNEL_WEIGHTS.anomalyPenalty;
  }

  return 0;
}

export function scoreChannelDiscovery(input: {
  boost: ChannelBoostAggregate;
  isVerified: boolean;
  isPublic: boolean;
  badgeScore: number;
  guildMemberCount: number;
  moderationPenalty: number;
  conductScore: number;
  squadScore: number;
  profileScore: number;
  category?: DiscoveryChannelCategoryId;
}): { score: number; signals: string[]; score_components: DiscoveryScoreComponents } {
  const signals: string[] = [];
  const category = input.category ?? 'featured';
  const boostBasis =
    category === 'top_boosted'
      ? input.boost.power
      : category === 'rising'
        ? Math.max(0, input.boost.rising_delta)
        : input.boost.weighted_power;
  const boostScore =
    boostBasis * DISCOVERY_CHANNEL_WEIGHTS.boostPower +
    input.boost.count * DISCOVERY_CHANNEL_WEIGHTS.boostCount;
  const verificationScore =
    (input.isVerified ? DISCOVERY_CHANNEL_WEIGHTS.verified : 0) +
    (input.isPublic ? DISCOVERY_CHANNEL_WEIGHTS.public : 0);
  const guildScore =
    input.guildMemberCount >= DISCOVERY_CHANNEL_WEIGHTS.guildActivityMemberThreshold
      ? DISCOVERY_CHANNEL_WEIGHTS.guildActivity
      : 0;
  const anomalyPenalty = scoreBoostAnomaly(input.boost);
  const reputationScore = input.conductScore + input.squadScore + input.profileScore;

  if (input.boost.power > 0) {
    signals.push(`boost:${input.boost.power}`);
  }

  if (input.boost.weighted_power > input.boost.power) {
    signals.push(`weighted-boost:${Math.round(input.boost.weighted_power)}`);
  }

  if (input.boost.rising_delta > 0) {
    signals.push(`rising:+${input.boost.rising_delta}`);
  }

  if (input.boost.unique_boosters > 0) {
    signals.push(`boosters:${input.boost.unique_boosters}`);
  }

  if (input.boost.concentration_capped) {
    signals.push('boost-concentration-capped');
  }

  if (anomalyPenalty < 0) {
    signals.push('boost-anomaly');
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

  if (input.conductScore > 0) {
    signals.push(`conduct:+${input.conductScore}`);
  }

  if (input.squadScore > 0) {
    signals.push(`squad:+${input.squadScore}`);
  }

  if (input.profileScore > 0) {
    signals.push('profile-active');
  }

  if (input.moderationPenalty < 0) {
    signals.push(`moderation:${input.moderationPenalty}`);
  }

  const score = Math.max(
    0,
    boostScore +
      verificationScore +
      input.badgeScore +
      guildScore +
      reputationScore +
      input.moderationPenalty +
      anomalyPenalty,
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
      reputation: input.conductScore,
      squad: input.squadScore,
      profile: input.profileScore,
      anomaly: anomalyPenalty,
      base: verificationScore,
    },
  };
}

export function scoreGuildDiscovery(input: {
  memberCount: number;
  isPublic: boolean;
  badgeScore: number;
  moderationPenalty: number;
  squadScore: number;
  profileScore: number;
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

  if (input.squadScore > 0) {
    signals.push(`squad:+${input.squadScore}`);
  }

  if (input.profileScore > 0) {
    signals.push('profile-active');
  }

  if (input.moderationPenalty < 0) {
    signals.push(`moderation:${input.moderationPenalty}`);
  }

  const score = Math.max(
    0,
    memberScore +
      publicScore +
      activeGuildScore +
      input.badgeScore +
      input.squadScore +
      input.profileScore +
      input.moderationPenalty,
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
      reputation: 0,
      squad: input.squadScore,
      profile: input.profileScore,
      anomaly: 0,
      base: publicScore,
    },
  };
}

export function matchesDiscoveryChannelCategory(input: {
  category: DiscoveryChannelCategoryId;
  isVerified: boolean;
  badgeScore: number;
  guildMemberCount: number;
  conductSignal: number | null;
  access: ChannelAccessProjection | undefined;
  boost: ChannelBoostAggregate;
  conductExcluded: boolean;
}): boolean {
  if (input.conductExcluded) {
    return false;
  }

  switch (input.category) {
    case 'featured':
    case 'top_boosted':
      return true;
    case 'rising':
      return input.boost.rising_delta > 0;
    case 'verified':
      return input.isVerified;
    case 'new_player_friendly':
      return (
        input.access?.allow_npc_chat === true ||
        (input.access?.minimum_tier ?? 1) <= 1
      );
    case 'guild_spotlight':
      return input.guildMemberCount >= DISCOVERY_CHANNEL_WEIGHTS.guildActivityMemberThreshold;
    case 'badge_campaigns':
      return input.badgeScore >= 16;
    case 'cozy':
      return (
        input.conductSignal === CONDUCT_SIGNAL.GREEN &&
        (input.access?.minimum_reputation ?? 0) <= 1
      );
    case 'competitive':
      return (
        input.conductSignal === CONDUCT_SIGNAL.ORANGE ||
        input.conductSignal === CONDUCT_SIGNAL.RED
      );
    default:
      return true;
  }
}

export function sortChannelRankingsForCategory<T extends { score: number; boost_power: number }>(
  category: DiscoveryChannelCategoryId,
  left: T & { rising_delta?: number },
  right: T & { rising_delta?: number },
): number {
  if (category === 'top_boosted') {
    return right.boost_power - left.boost_power;
  }

  if (category === 'rising') {
    return (right.rising_delta ?? 0) - (left.rising_delta ?? 0);
  }

  return right.score - left.score;
}