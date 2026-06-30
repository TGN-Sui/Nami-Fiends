import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

describe('payment-mock-guard', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NAMI_TEST_LAUNCH = 'true';
    process.env.NAMI_PAYMENT_ALLOW_MOCK = 'false';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('blocks mock providers on test launch', async () => {
    const { assertMockProvidersAllowed } = await import('./payment-mock-guard.js');

    assert.throws(() => assertMockProvidersAllowed(), /mock_payments_disabled/);
  });
});