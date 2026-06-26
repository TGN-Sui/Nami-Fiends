import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildDefaultChatOverlayRewards } from './chat-overlay-rewards.service.js';

describe('chat-overlay-rewards.service', () => {
  it('seeds four default border art presets for fresh testnet deploys', () => {
    const rewards = buildDefaultChatOverlayRewards(1_700_000_000_000);

    assert.equal(rewards.length, 4);
    assert.deepEqual(
      rewards.map((reward) => reward.id),
      [
        'overlay-signal-glow',
        'overlay-wave-frame',
        'overlay-pulse-ring',
        'overlay-genesis-spark',
      ]
    );
    assert.equal(rewards.every((reward) => reward.enabled), true);
    assert.equal(rewards.some((reward) => reward.motion === 'premium-loop'), true);
  });
});