import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ProjectionRegistry } from './projection-registry.js';
import { buildLinkedProfile } from './services/linked-profile.service.js';

function mockRegistry(): ProjectionRegistry {
  return {
    profiles: {
      getByOwner: () => undefined,
    },
  } as unknown as ProjectionRegistry;
}

describe('buildLinkedProfile', () => {
  it('returns null for invalid owner', async () => {
    const result = await buildLinkedProfile(mockRegistry(), 'not-an-address');

    assert.equal(result, null);
  });

  it('returns null when no passport or off-chain data exists for owner', async () => {
    const result = await buildLinkedProfile(
      mockRegistry(),
      '0x00000000000000000000000000000000000000000000000000000000000000aa'
    );

    assert.equal(result, null);
  });
});