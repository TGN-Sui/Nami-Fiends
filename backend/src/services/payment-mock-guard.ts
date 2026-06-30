import { paymentConfig } from '../payment-config.js';

export function assertMockProvidersAllowed(): void {
  if (!paymentConfig.allowMockProviders) {
    throw new Error('mock_payments_disabled');
  }
}