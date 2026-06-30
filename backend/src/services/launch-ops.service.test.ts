import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import type { SealPrivacyReadiness } from './seal-privacy.service.js';

describe('launch-ops.service security review', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  const baseSealPrivacy: SealPrivacyReadiness = {
    enabled: false,
    key_configured: false,
    sealed_count: 0,
    walrus_publisher_configured: false,
    walrus_ciphertext_count: 0,
    policies_in_use: [],
    policies_registered: 0,
    migration_stage: 'local-only',
    migration_next_step: 'Enable NAMI_SEAL_PRIVACY_ENABLED',
    stack_note: 'Seal privacy lane is optional on testnet.',
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-launch-ops-'));
    process.env.NAMI_DATA_DIR = tempDir;
    process.env.NAMI_TEST_LAUNCH = 'true';
    process.env.NAMI_OFFICIAL_OWNER = '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca';
    process.env.NAMI_ADMIN_CAP_BACKUP_HOLDER =
      '0x258608d20931e37c9eb3ded2aa05c20d27ae9570efd86b56080b5b062d9caca1';
    delete process.env.NAMI_SECURITY_REVIEW_LAST_RUN_MS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };

    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports review_ready when backup holder and test-launch policy are configured', async () => {
    const { buildSecurityReviewReadiness } = await import('./launch-ops.service.js');
    const review = buildSecurityReviewReadiness(baseSealPrivacy);

    assert.equal(review.backup_holder_configured, true);
    assert.equal(review.mock_payments_disabled, true);
    assert.equal(review.officials_sync_secret_server_only, true);
    assert.equal(review.review_ready, true);
  });

  it('blocks review_ready when backup holder is missing', async () => {
    delete process.env.NAMI_ADMIN_CAP_BACKUP_HOLDER;

    const { buildSecurityReviewReadiness } = await import('./launch-ops.service.js');
    const review = buildSecurityReviewReadiness(baseSealPrivacy);

    assert.equal(review.backup_holder_configured, false);
    assert.equal(review.review_ready, false);
  });

  it('reads security_script_last_run_ms from projection file', async () => {
    const projectionDir = path.join(tempDir, 'projections');
    fs.mkdirSync(projectionDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectionDir, 'security-review.json'),
      JSON.stringify({ last_run_ms: 1_700_000_000_000 }),
    );

    const { buildSecurityReviewReadiness } = await import('./launch-ops.service.js');
    const review = buildSecurityReviewReadiness(baseSealPrivacy);

    assert.equal(review.security_script_last_run_ms, 1_700_000_000_000);
  });
});