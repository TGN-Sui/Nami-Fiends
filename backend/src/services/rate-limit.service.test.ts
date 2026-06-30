import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import { describe, it } from 'node:test';

import { assertRateLimit, resetRateLimitsForTests } from './rate-limit.service.js';

function fakeRequest(ip: string): IncomingMessage {
  return {
    headers: {},
    socket: { remoteAddress: ip },
  } as IncomingMessage;
}

describe('rate-limit.service', () => {
  it('blocks requests after the configured threshold', () => {
    resetRateLimitsForTests();
    const request = fakeRequest('203.0.113.10');

    assertRateLimit(request, 'probe-route', 2, 60_000);
    assertRateLimit(request, 'probe-route', 2, 60_000);

    assert.throws(
      () => assertRateLimit(request, 'probe-route', 2, 60_000),
      /rate_limit_exceeded/
    );
  });
});