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
});