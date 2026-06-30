import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

describe('member-preferences.service', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-prefs-'));
    process.env.NAMI_DATA_DIR = tempDir;
  });

  afterEach(() => {
    process.env = { ...originalEnv };

    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('locks hub first visit after it is completed', async () => {
    const { upsertMemberPreferences } = await import('./member-preferences.service.js');
    const owner = '0x1111111111111111111111111111111111111111111111111111111111111111';

    await upsertMemberPreferences({
      owner,
      hubFirstVisitCompleted: true,
    });

    await assert.rejects(
      () =>
        upsertMemberPreferences({
          owner,
          hubFirstVisitCompleted: false,
        }),
      /hub_first_visit_locked/,
    );
  });

  it('rejects wholesale super banner seen id replacement', async () => {
    const { upsertMemberPreferences } = await import('./member-preferences.service.js');
    const owner = '0x2222222222222222222222222222222222222222222222222222222222222222';

    await assert.rejects(
      () =>
        upsertMemberPreferences({
          owner,
          superBannerSeenIds: ['hub-sb-1'],
        }),
      /super_banner_seen_ids_replace_forbidden/,
    );
  });
});