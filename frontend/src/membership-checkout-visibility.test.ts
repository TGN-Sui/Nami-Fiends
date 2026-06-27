import { describe, expect, it } from 'vitest';

import {
  defaultCheckoutRail,
  membershipCheckoutMethodsSummary,
  resolveVisibleCheckoutRails,
} from './membership-checkout-visibility.js';
import type { PublicPaymentConfig } from './membership-payments-api.js';

const baseConfig: PublicPaymentConfig = {
  treasuryAddress: '0xabc',
  usdcCoinType: 'usdc',
  goonCoinType: 'goon',
  stripePublishableKey: 'pk_test',
  paypalClientId: 'paypal',
  cardEnabled: true,
  paypalEnabled: true,
  cryptoEnabled: true,
  mockProviders: false,
};

describe('membership-checkout-visibility', () => {
  it('hides card when card checkout is disabled on the server', () => {
    expect(
      resolveVisibleCheckoutRails({
        ...baseConfig,
        cardEnabled: false,
      })
    ).toEqual(['paypal', 'other']);
  });

  it('defaults to crypto when card is hidden', () => {
    expect(
      defaultCheckoutRail({
        ...baseConfig,
        cardEnabled: false,
      })
    ).toBe('other');
  });

  it('summarizes visible payment methods for checkout copy', () => {
    expect(
      membershipCheckoutMethodsSummary({
        ...baseConfig,
        cardEnabled: false,
        paypalEnabled: false,
      })
    ).toBe('wallet crypto (SUI, USDC, $GOON)');
  });
});