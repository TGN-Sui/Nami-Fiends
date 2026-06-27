import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  listSealPolicyDefinitions,
  sealPolicyMigrationSummary,
} from './seal-policy-registry.js';

describe('seal-policy-registry', () => {
  it('registers all four evidence policies for 9.2.2 groundwork', () => {
    const policies = listSealPolicyDefinitions();

    assert.equal(policies.length, 4);
    assert.ok(policies.every((entry) => entry.walrus_blob_prefix.startsWith('seal/')));
  });

  it('reports dev-envelope stage until Mysten policy ids are assigned', () => {
    const summary = sealPolicyMigrationSummary();

    assert.equal(summary.stage, 'dev-envelope');
    assert.equal(summary.policies_with_mysten_ids, 0);
    assert.match(summary.next_step, /9\.2\.2/);
  });
});