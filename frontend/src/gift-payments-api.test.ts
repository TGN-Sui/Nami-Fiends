import { describe, expect, it } from 'vitest';

import { formatGiftApiError } from './gift-payments-api.js';

describe('formatGiftApiError', () => {
  it('explains missing gift routes on the receiving server', () => {
    expect(formatGiftApiError({ error: 'not_found' }, 404)).toContain('/api/gifts');
  });

  it('prefers server message for wallet auth failures', () => {
    expect(
      formatGiftApiError(
        { error: 'wallet_auth_invalid', message: 'wallet_auth_invalid:missing_signature' },
        401
      )
    ).toBe('wallet_auth_invalid:missing_signature');
  });
});