import { config as baseConfig } from './config.js';

function readString(name: string, fallback = ''): string {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : fallback;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

function readNumber(name: string, fallback: number): number {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const paypalMode = readString('NAMI_PAYPAL_MODE', 'sandbox');

export function isConfiguredWalletAddress(value: string): boolean {
  const trimmed = value.trim();

  return (
    trimmed.startsWith('0x') &&
    trimmed.length > 10 &&
    !trimmed.includes('YOUR_') &&
    !trimmed.includes('your-')
  );
}

export function isConfiguredSecret(value: string): boolean {
  const trimmed = value.trim();

  return trimmed !== '' && !trimmed.includes('YOUR_') && !trimmed.includes('your-');
}

export const paymentConfig = {
  treasuryAddress: readString('NAMI_PAYMENT_TREASURY_ADDRESS'),
  usdcCoinType: readString(
    'NAMI_USDC_COIN_TYPE',
    '0x5d4b302506645c37ff133b98c4b50a5ae14864ca6ad8b9ee1c073dfa07d1f4b0::coin::COIN'
  ),
  goonCoinType: readString(
    'NAMI_GOON_COIN_TYPE',
    '0xc31be4b73d3352373c9e2d99e8620944f414b24407495b1d0c9f5628e2e86104::goon::GOON'
  ),
  usdcDecimals: readNumber('NAMI_USDC_DECIMALS', 6),
  goonDecimals: readNumber('NAMI_GOON_DECIMALS', 9),
  suiUsdPrice: readNumber('NAMI_SUI_USD_PRICE', 2.5),

  stripeSecretKey: readString('STRIPE_SECRET_KEY'),
  stripePublishableKey: readString('STRIPE_PUBLISHABLE_KEY'),
  stripeWebhookSecret: readString('STRIPE_WEBHOOK_SECRET'),

  paypalClientId: readString('PAYPAL_CLIENT_ID'),
  paypalClientSecret: readString('PAYPAL_CLIENT_SECRET'),
  paypalApiBase:
    paypalMode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com',

  defaultSuccessUrl: readString('NAMI_PAYMENT_SUCCESS_URL', 'http://localhost:5173/?payment=success'),
  defaultCancelUrl: readString('NAMI_PAYMENT_CANCEL_URL', 'http://localhost:5173/?payment=cancel'),
  allowMockProviders: baseConfig.testLaunch
    ? false
    : readBoolean('NAMI_PAYMENT_ALLOW_MOCK', true),

  httpPort: baseConfig.httpPort,
} as const;