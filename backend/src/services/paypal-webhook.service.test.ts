import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

describe('paypal-webhook.service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_SECRET;
    delete process.env.PAYPAL_WEBHOOK_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('reports webhook verification unavailable when PayPal is not configured', async () => {
    const { isPayPalWebhookConfigured, verifyPayPalWebhookSignature } = await import(
      './paypal-webhook.service.js'
    );

    assert.equal(isPayPalWebhookConfigured(), false);

    await assert.rejects(
      () =>
        verifyPayPalWebhookSignature('{}', {
          transmissionId: 'id',
          transmissionTime: 'time',
          transmissionSig: 'sig',
          certUrl: 'https://example.com/cert',
          authAlgo: 'SHA256withRSA',
        }),
      /PayPal webhook is not configured/,
    );
  });
});