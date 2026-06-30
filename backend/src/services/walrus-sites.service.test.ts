import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

describe('walrus-sites.service', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-walrus-site-'));
    process.env.NAMI_DATA_DIR = tempDir;
    delete process.env.NAMI_WALRUS_SITE_OBJECT_ID;
    delete process.env.NAMI_WALRUS_SITE_NETWORK;
    delete process.env.NAMI_WALRUS_SITE_EPOCHS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };

    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports not configured without projection or env', async () => {
    const { buildWalrusSitesReadiness } = await import('./walrus-sites.service.js');
    const readiness = buildWalrusSitesReadiness();

    assert.equal(readiness.configured, false);
    assert.equal(readiness.site_object_id, null);
    assert.match(readiness.portal_note, /not deployed/i);
  });

  it('reads site object id from projection file', async () => {
    const projectionDir = path.join(tempDir, 'projections');
    fs.mkdirSync(projectionDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectionDir, 'walrus-site.json'),
      JSON.stringify({
        site_object_id: '0xabc123',
        network: 'testnet',
        storage_epochs: 5,
        last_deploy_ms: 1_700_000_000_000,
        portal_note: 'Testnet portal required.',
      })
    );

    const { buildWalrusSitesReadiness } = await import('./walrus-sites.service.js');
    const readiness = buildWalrusSitesReadiness();

    assert.equal(readiness.configured, true);
    assert.equal(readiness.site_object_id, '0xabc123');
    assert.equal(readiness.network, 'testnet');
    assert.equal(readiness.storage_epochs, 5);
    assert.equal(readiness.last_deploy_ms, 1_700_000_000_000);
  });

  it('falls back to NAMI_WALRUS_SITE_OBJECT_ID env', async () => {
    process.env.NAMI_WALRUS_SITE_OBJECT_ID = '0xenvsite';

    const { buildWalrusSitesReadiness } = await import('./walrus-sites.service.js');
    const readiness = buildWalrusSitesReadiness();

    assert.equal(readiness.configured, true);
    assert.equal(readiness.site_object_id, '0xenvsite');
  });

  it('reports renewal_due when storage epochs are near expiry', async () => {
    const projectionDir = path.join(tempDir, 'projections');
    fs.mkdirSync(projectionDir, { recursive: true });

    const { WALRUS_SITE_EPOCH_DURATION_MS } = await import('./walrus-sites-renewal.js');
    const expiredAnchor = Date.now() - 6 * WALRUS_SITE_EPOCH_DURATION_MS;

    fs.writeFileSync(
      path.join(projectionDir, 'walrus-site.json'),
      JSON.stringify({
        site_object_id: '0xrenewme',
        network: 'testnet',
        storage_epochs: 5,
        last_deploy_ms: expiredAnchor,
        last_renew_ms: null,
        portal_note: 'Renew soon.',
      }),
    );

    const { buildWalrusSitesReadiness } = await import('./walrus-sites.service.js');
    const readiness = buildWalrusSitesReadiness();

    assert.equal(readiness.renewal_due, true);
    assert.ok(readiness.expires_at_ms);
    assert.equal(readiness.epochs_remaining_approx, 0);
  });

  it('prefers last_renew_ms over last_deploy_ms for renewal anchor', async () => {
    const projectionDir = path.join(tempDir, 'projections');
    fs.mkdirSync(projectionDir, { recursive: true });

    const { WALRUS_SITE_EPOCH_DURATION_MS } = await import('./walrus-sites-renewal.js');
    const oldDeploy = Date.now() - 10 * WALRUS_SITE_EPOCH_DURATION_MS;
    const recentRenew = Date.now() - WALRUS_SITE_EPOCH_DURATION_MS;

    fs.writeFileSync(
      path.join(projectionDir, 'walrus-site.json'),
      JSON.stringify({
        site_object_id: '0xrenewed',
        network: 'testnet',
        storage_epochs: 5,
        last_deploy_ms: oldDeploy,
        last_renew_ms: recentRenew,
        portal_note: 'Recently renewed.',
      }),
    );

    const { buildWalrusSitesReadiness } = await import('./walrus-sites.service.js');
    const readiness = buildWalrusSitesReadiness();

    assert.equal(readiness.renewal_due, false);
    assert.ok(readiness.epochs_remaining_approx && readiness.epochs_remaining_approx > 0);
  });
});