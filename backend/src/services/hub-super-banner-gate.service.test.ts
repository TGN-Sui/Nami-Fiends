import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

function createRegistry(channelId: string, owner: string) {
  return {
    channels: {
      getChannel(id: string) {
        if (id !== channelId) {
          return undefined;
        }

        return {
          id: channelId,
          owner,
          owner_passport_id: 'passport-1',
          is_public: true,
          is_verified: true,
          created_at_ms: '1',
          updated_at_ms: '1',
          verified_at_ms: '1',
        };
      },
    },
  };
}

describe('hub-super-banner-gate.service', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-hub-sb-gate-'));
    process.env.NAMI_DATA_DIR = tempDir;
  });

  afterEach(() => {
    process.env = { ...originalEnv };

    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('computes a stable daily window key', async () => {
    const { currentSuperBannerWindowKey } = await import('./hub-super-banner-gate.service.js');

    assert.equal(typeof currentSuperBannerWindowKey(Date.UTC(2026, 5, 29, 18, 0, 0)), 'string');
  });

  it('requires activation before publish and enforces daily quota', async () => {
    const {
      activateSuperBannerEntitlement,
      assertCanPublishSuperBanner,
      recordSuperBannerSend,
    } = await import('./hub-super-banner-gate.service.js');

    const registry = createRegistry('channel-a', '0xowner');
    const owner = '0xowner';

    await assert.rejects(
      () =>
        assertCanPublishSuperBanner({
          registry: registry as never,
          channelId: 'channel-a',
          owner,
        }),
      /super_banner_not_entitled/,
    );

    await activateSuperBannerEntitlement({
      registry: registry as never,
      channelId: 'channel-a',
      owner,
    });

    await assertCanPublishSuperBanner({
      registry: registry as never,
      channelId: 'channel-a',
      owner,
    });

    await recordSuperBannerSend('channel-a');
    await recordSuperBannerSend('channel-a');

    await assert.rejects(
      () =>
        assertCanPublishSuperBanner({
          registry: registry as never,
          channelId: 'channel-a',
          owner,
        }),
      /super_banner_daily_limit/,
    );
  });

  it('rejects publish from a non-owner wallet', async () => {
    const { activateSuperBannerEntitlement, assertCanPublishSuperBanner } = await import(
      './hub-super-banner-gate.service.js'
    );

    const registry = createRegistry('channel-a', '0xowner');

    await activateSuperBannerEntitlement({
      registry: registry as never,
      channelId: 'channel-a',
      owner: '0xowner',
    });

    await assert.rejects(
      () =>
        assertCanPublishSuperBanner({
          registry: registry as never,
          channelId: 'channel-a',
          owner: '0xintruder',
        }),
      /not_channel_owner/,
    );
  });
});