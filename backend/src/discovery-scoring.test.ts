import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  aggregateWeeklyChannelBoosts,
  computeChannelModerationPenalty,
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
      3,
    );

    const channel = aggregates.get('0xchannel');

    assert.equal(channel?.power, 3);
    assert.equal(channel?.count, 3);
    assert.equal(channel?.concentration_capped, true);
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
      boost: { power: 20, count: 2, unique_boosters: 2, concentration_capped: false },
      isVerified: true,
      isPublic: true,
      badgeScore: 12,
      guildMemberCount: 10,
      moderationPenalty: penalty,
    });

    assert.ok(penalty < 0);
    assert.ok(ranked.score > 0);
    assert.ok(ranked.signals.includes('verified'));
    assert.ok(ranked.signals.includes('guild-activity'));
    assert.ok(ranked.score_components.moderation < 0);
  });
});