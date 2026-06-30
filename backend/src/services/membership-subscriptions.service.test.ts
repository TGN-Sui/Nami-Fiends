import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

describe('membership-subscriptions.service client sync guards', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-subscriptions-'));
    process.env.NAMI_DATA_DIR = tempDir;
  });

  afterEach(() => {
    process.env = { ...originalEnv };

    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects tier escalation from client sync', async () => {
    const { syncMembershipSubscription } = await import('./membership-subscriptions.service.js');
    const owner = '0x3333333333333333333333333333333333333333333333333333333333333333';

    await assert.rejects(
      () =>
        syncMembershipSubscription({
          owner,
          activeTier: 'Elite',
          status: 'active',
        }),
      /subscription_tier_escalation_forbidden/,
    );
  });

  it('allows pending downgrade requests without escalating active tier', async () => {
    const { syncMembershipSubscription } = await import('./membership-subscriptions.service.js');
    const owner = '0x4444444444444444444444444444444444444444444444444444444444444444';

    const subscription = await syncMembershipSubscription({
      owner,
      status: 'pending-downgrade',
      pendingTier: 'Adventurer',
    });

    assert.equal(subscription.status, 'pending-downgrade');
    assert.equal(subscription.pendingTier, 'Adventurer');
    assert.equal(subscription.activeTier, 'Adventurer');
  });
});