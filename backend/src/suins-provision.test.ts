import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildSuinsSubname,
  nodenameSuffixFromClaim,
  provisionSuinsSubname,
} from './services/suins-provision.service.js';

describe('suins-provision', () => {
  it('builds subnames under the fiend parent', () => {
    assert.equal(buildSuinsSubname('gamer'), 'gamer.fiend');
    assert.equal(nodenameSuffixFromClaim('fiendgamer'), 'gamer');
  });

  it('returns pending_operator when credentials are missing', async () => {
    const previous = process.env.NAMI_SUINS_OPERATOR_PRIVATE_KEY;
    delete process.env.NAMI_SUINS_OPERATOR_PRIVATE_KEY;

    const result = await provisionSuinsSubname({
      nodename: 'fiendgamer',
      recipientAddress: '0xabc',
    });

    assert.equal(result.status, 'pending_operator');
    assert.equal(result.subname, 'gamer.fiend');

    if (previous) {
      process.env.NAMI_SUINS_OPERATOR_PRIVATE_KEY = previous;
    }
  });
});