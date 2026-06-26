import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildDefaultChatOverlayRewards } from './chat-overlay-rewards.service.js';
import { syncMemberCosmeticEquip } from './member-cosmetic-equips.service.js';

describe('member-cosmetic-equips.service', () => {
  it('accepts clearing an equipped overlay', async () => {
    const projection = await syncMemberCosmeticEquip({
      memberId: 'm1',
      chatOverlayDisplay: '',
    });

    assert.equal(projection.equips.m1, undefined);
  });

  it('rejects equips for overlays missing from the catalog', async () => {
    await assert.rejects(
      () =>
        syncMemberCosmeticEquip({
          memberId: 'm1',
          chatOverlayDisplay: 'overlay-missing',
        }),
      /overlay_not_found/
    );
  });

  it('rejects equips for disabled catalog entries', async () => {
    const rewards = buildDefaultChatOverlayRewards();
    const disabled = rewards.find((reward) => reward.id === 'overlay-signal-glow');

    assert.ok(disabled);

    await (await import('../storage.js')).writeJsonFile(
      'data/projections/chat-overlay-rewards.json',
      {
        rewards: [{ ...disabled, enabled: false }],
        updatedAtMs: Date.now(),
      }
    );

    await assert.rejects(
      () =>
        syncMemberCosmeticEquip({
          memberId: 'm1',
          chatOverlayDisplay: 'overlay-signal-glow',
        }),
      /overlay_disabled/
    );
  });

  it('persists equips for enabled catalog entries', async () => {
    const rewards = buildDefaultChatOverlayRewards();

    await (await import('../storage.js')).writeJsonFile(
      'data/projections/chat-overlay-rewards.json',
      {
        rewards,
        updatedAtMs: Date.now(),
      }
    );

    const projection = await syncMemberCosmeticEquip({
      memberId: 'm1',
      chatOverlayDisplay: 'overlay-signal-glow',
    });

    assert.equal(projection.equips.m1, 'overlay-signal-glow');
  });
});