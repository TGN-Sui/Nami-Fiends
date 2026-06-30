import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import { describe, it } from 'node:test';

import { resolveOfficialsSyncScope } from './officials-auth.service.js';

function fakeRequest(): IncomingMessage {
  return { headers: {} } as IncomingMessage;
}

describe('officials-auth.service', () => {
  it('never grants open-scope merge without wallet auth', async () => {
    await assert.rejects(
      () =>
        resolveOfficialsSyncScope(fakeRequest(), {
          suggestions: [{ id: 'probe', status: 'submitted' }],
        } as { owner?: unknown; auth?: unknown }),
      /officials_sync_auth_required/
    );
  });
});