import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  aggregateWeeklyChannelBoosts,
  boosterQualityMultiplier,
  computeChannelModerationPenalty,
  matchesDiscoveryChannelCategory,
  scoreChannelDiscovery,
} from './discovery-scoring.js';
import { MODERATION_ACTION } from './services/moderation.service.js';

describe('discovery-scoring', () => {
  it('caps per-owner channel boosts to reduce concentration', () => {
    const aggregates = aggregateWeeklyChannelBoosts(
      [
        {
          id: '1',
          owner: '0xmember',
          channel_id: '0xchannel',
          power: 1,
          tier: 1,
          week_id: 12,
          used_at_ms: null,
        },
        {
          id: '2',
          owner: '0xmember',
          channel_id: '0xchannel',
          power: 1,
          tier: 1,
          week_id: 12,
          used_at_ms: null,
        },
        {
          id: '3',
          owner: '0xmember',
          channel_id: '0xchannel',
          power: 1,
          tier: 1,
          week_id: 12,
          used_at_ms: null,
        },
        {
          id: '4',
          owner: '0xmember',
          channel_id: '0xchannel',
          power: 1,
          tier: 1,
          week_id: 12,
          used_at_ms: null,
        },
      ],
      12,
    );

    const channel = aggregates.get('0xchannel');

    assert.equal(channel?.power, 3);
    assert.equal(channel?.count, 3);
    assert.equal(channel?.concentration_capped, true);
  });

  it('weights boosts by booster reputation and membership tier', () => {
    const aggregates = aggregateWeeklyChannelBoosts(
      [
        {
          id: '1',
          owner: '0xgoonie',
          channel_id: '0xchannel',
          power: 10,
          tier: 3,
          week_id: 12,
          used_at_ms: null,
        },
      ],
      12,
      new Map([
        [
          '0xgoonie',
          {
            level: 20,
            total_xp: 1000,
            level_progress: 0,
            badge_points_total: 40,
            reputation: 3,
            tier: 3,
            conduct_signal: 1,
            equipped_title_type: null,
            verification_level: 1,
          },
        ],
      ]),
    );

    const channel = aggregates.get('0xchannel');
    const multiplier = boosterQualityMultiplier(
      {
        level: 20,
        total_xp: 1000,
        level_progress: 0,
        badge_points_total: 40,
        reputation: 3,
        tier: 3,
        conduct_signal: 1,
        equipped_title_type: null,
        verification_level: 1,
      },
      3,
    );

    assert.ok((channel?.weighted_power ?? 0) > (channel?.power ?? 0));
    assert.ok(multiplier > 1);
  });

  it('penalizes moderation issues without zeroing verified channels', () => {
    const penalty = computeChannelModerationPenalty(
      [
        {
          id: 'mute-1',
          action_type: MODERATION_ACTION.MUTE,
          moderator: '0xmod',
          target_owner: '0xowner',
          passport_id: '0xpassport',
          channel_id: '0xchannel',
          reason_code: 1,
          expires_at_ms: Date.now() + 60_000,
          issued_at_ms: String(Date.now()),
        },
      ],
      '0xchannel',
      '0xowner',
    );

    const ranked = scoreChannelDiscovery({
      boost: {
        power: 20,
        weighted_power: 24,
        count: 2,
        unique_boosters: 2,
        concentration_capped: false,
        dominant_owner_share: 0.4,
        rising_delta: 4,
      },
      isVerified: true,
      isPublic: true,
      badgeScore: 12,
      guildMemberCount: 10,
      moderationPenalty: penalty,
      conductScore: 8,
      squadScore: 4,
      profileScore: 10,
    });

    assert.ok(penalty < 0);
    assert.ok(ranked.score > 0);
    assert.ok(ranked.signals.includes('verified'));
    assert.ok(ranked.signals.includes('guild-activity'));
    assert.ok(ranked.score_components.moderation < 0);
    assert.equal(ranked.score_components.reputation, 8);
    assert.equal(ranked.score_components.squad, 4);
    assert.equal(ranked.score_components.profile, 10);
  });

  it('filters rising and cozy discovery categories', () => {
    assert.equal(
      matchesDiscoveryChannelCategory({
        category: 'rising',
        isVerified: false,
        badgeScore: 0,
        guildMemberCount: 0,
        conductSignal: 1,
        access: undefined,
        boost: {
          power: 5,
          weighted_power: 5,
          count: 1,
          unique_boosters: 1,
          concentration_capped: false,
          dominant_owner_share: 1,
          rising_delta: 3,
        },
        conductExcluded: false,
      }),
      true,
    );

    assert.equal(
      matchesDiscoveryChannelCategory({
        category: 'cozy',
        isVerified: false,
        badgeScore: 0,
        guildMemberCount: 0,
        conductSignal: 1,
        access: {
          channel_id: '0xchannel',
          owner: '0xowner',
          allow_npc_chat: true,
          minimum_tier: 1,
          minimum_reputation: 0,
          created_at_ms: null,
          updated_at_ms: null,
        },
        boost: {
          power: 0,
          weighted_power: 0,
          count: 0,
          unique_boosters: 0,
          concentration_capped: false,
          dominant_owner_share: 0,
          rising_delta: 0,
        },
        conductExcluded: false,
      }),
      true,
    );
  });
});