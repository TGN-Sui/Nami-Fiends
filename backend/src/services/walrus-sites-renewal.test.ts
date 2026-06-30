import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  computeWalrusSitesRenewalStatus,
  WALRUS_SITE_EPOCH_DURATION_MS,
} from './walrus-sites-renewal.js';

describe('walrus-sites-renewal', () => {
  it('marks renewal due inside the buffer window before expiry', () => {
    const nowMs = 1_700_000_000_000;
    const anchorMs = nowMs - 4 * WALRUS_SITE_EPOCH_DURATION_MS;
    const status = computeWalrusSitesRenewalStatus(
      {
        last_deploy_ms: anchorMs,
        last_renew_ms: null,
        storage_epochs: 5,
      },
      nowMs,
    );

    assert.equal(status.renewal_due, true);
    assert.equal(status.epochs_remaining_approx, 1);
  });

  it('uses the more recent renew timestamp as the anchor', () => {
    const nowMs = 1_700_000_000_000;
    const status = computeWalrusSitesRenewalStatus(
      {
        last_deploy_ms: nowMs - 10 * WALRUS_SITE_EPOCH_DURATION_MS,
        last_renew_ms: nowMs - WALRUS_SITE_EPOCH_DURATION_MS,
        storage_epochs: 5,
      },
      nowMs,
    );

    assert.equal(status.renewal_due, false);
    assert.equal(status.anchor_ms, nowMs - WALRUS_SITE_EPOCH_DURATION_MS);
  });
});