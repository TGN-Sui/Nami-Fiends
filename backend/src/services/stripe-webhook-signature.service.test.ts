import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';

import {
  assertStripeWebhookTimestampFresh,
  verifyStripeWebhookSignature,
} from './stripe-webhook-signature.service.js';

describe('stripe-webhook-signature.service', () => {
  it('rejects webhook timestamps outside the tolerance window', () => {
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600);

    assert.throws(
      () => assertStripeWebhookTimestampFresh(staleTimestamp),
      /tolerance window/
    );
  });

  it('verifies a fresh Stripe signature', () => {
    const secret = 'whsec_test_secret';
    const rawBody = '{"id":"evt_test"}';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', secret)
      .update(timestamp + '.' + rawBody)
      .digest('hex');
    const header = 't=' + timestamp + ',v1=' + signature;

    assert.doesNotThrow(() => verifyStripeWebhookSignature(rawBody, header, secret));
  });
});