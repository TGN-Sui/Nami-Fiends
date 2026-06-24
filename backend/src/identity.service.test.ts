import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { IdentityService } from './services/identity.service.js';

describe('IdentityService', () => {
  it('indexes IdentityCreated events with nodename bytes', async () => {
    const service = new IdentityService('data/projections/identities.test.json');

    await service.clear();

    await service.process({
      module: 'identity',
      id: { txDigest: 'tx1', eventSeq: '0' },
      packageId: '0xpkg',
      transactionModule: 'onboarding',
      sender: '0xsender',
      type: '0xpkg::identity::IdentityCreated',
      timestampMs: '100',
      eventName: 'IdentityCreated',
      data: {
        identity_id: '0xidentity',
        owner: '0xowner',
        nodename: [102, 105, 101, 110, 100, 115, 109, 111, 107, 101, 48, 49],
      },
    });

    const byOwner = service.getByOwner('0xowner');
    const byId = service.getByIdentityId('0xidentity');

    assert.equal(byOwner?.nodename, 'fiendsmoke01');
    assert.equal(byId?.owner, '0xowner');
    assert.equal(service.getStats().count, 1);
  });
});