import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { decodeMoveBytes } from './move-bytes.js';
import { NodenameRegistryService } from './services/nodename-registry.service.js';

describe('decodeMoveBytes', () => {
  it('decodes utf8 byte arrays', () => {
    assert.equal(decodeMoveBytes([102, 105, 101, 110, 100, 103, 97, 109, 101, 114]), 'fiendgamer');
  });
});

describe('NodenameRegistryService', () => {
  it('indexes nodename registrations and enter_nami completions', async () => {
    const service = new NodenameRegistryService('data/projections/nodename-registry.test.json');

    await service.clear();

    await service.process({
      module: 'onboarding',
      id: { txDigest: 'tx1', eventSeq: '0' },
      packageId: '0xpkg',
      transactionModule: 'onboarding',
      sender: '0xsender',
      type: '0xpkg::onboarding::NodenameRegistered',
      timestampMs: '100',
      eventName: 'NodenameRegistered',
      data: {
        nodename: [102, 105, 101, 110, 100, 103, 97, 109, 101, 114],
        identity_id: '0xidentity',
        owner: '0xowner',
      },
    });

    await service.process({
      module: 'onboarding',
      id: { txDigest: 'tx2', eventSeq: '0' },
      packageId: '0xpkg',
      transactionModule: 'onboarding',
      sender: '0xsender',
      type: '0xpkg::onboarding::EnterNamiCompleted',
      timestampMs: '200',
      eventName: 'EnterNamiCompleted',
      data: {
        owner: '0xowner',
        identity_id: '0xidentity',
        passport_id: '0xpassport',
        profile_id: '0xprofile',
        nodename: [102, 105, 101, 110, 100, 103, 97, 109, 101, 114],
        archetype: 1,
      },
    });

    const byNodename = service.getByNodename('fiendgamer');
    const byOwner = service.getByOwner('0xowner');

    assert.equal(byNodename?.passport_id, '0xpassport');
    assert.equal(byOwner?.nodename, 'fiendgamer');
    assert.equal(service.getStats().count, 1);
  });
});