import { readIndexerUrl } from './protocol-env.js';

import type { MembershipBillingCycle, MembershipCheckoutRail, MembershipCryptoAsset, PaidMembershipTier } from './membership-plans-store.js';

export type PublicPaymentConfig = {
  treasuryAddress: string | null;
  usdcCoinType: string | null;
  goonCoinType: string | null;
  stripePublishableKey: string | null;
  paypalClientId: string | null;
  cardEnabled: boolean;
  paypalEnabled: boolean;
  cryptoEnabled: boolean;
  mockProviders: boolean;
};

export type MembershipPaymentIntent = {
  id: string;
  owner: string;
  tier: string;
  billingCycle: MembershipBillingCycle;
  amountUsd: number;
  rail: MembershipCheckoutRail;
  cryptoAsset: 'sui' | 'usdc' | 'goon' | null;
  status: 'created' | 'pending_provider' | 'paid' | 'failed' | 'expired';
  createdAtMs: number;
  updatedAtMs: number;
  paidAtMs: number | null;
  provider: 'stripe' | 'paypal' | 'sui_chain' | 'mock' | null;
  providerRef: string | null;
  txDigest: string | null;
  receiptUrl: string | null;
};

export type PaymentIntentResponse = {
  intent: MembershipPaymentIntent;
  card?: {
    mode: 'stripe' | 'mock';
    checkoutUrl: string | null;
    sessionId: string;
  };
  paypal?: {
    mode: 'paypal' | 'mock';
    approvalUrl: string | null;
    orderId: string;
  };
  crypto?: {
    treasuryAddress: string;
    asset: 'sui' | 'usdc' | 'goon';
    amountUsd: number;
    amountLabel: string;
    amountBaseUnits: string;
    coinType: string | null;
    paymentMemo: string;
  };
};

function paymentsBaseUrl(): string | null {
  return readIndexerUrl();
}

async function paymentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = paymentsBaseUrl();

  if (!base) {
    throw new Error('Payment API is not configured. Set VITE_NAMI_INDEXER_URL.');
  }

  const response = await fetch(base + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as T & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Payment request failed.');
  }

  return payload;
}

export async function fetchPaymentConfig(): Promise<PublicPaymentConfig> {
  return paymentFetch<PublicPaymentConfig>('/api/payments/membership/config');
}

export async function createMembershipPaymentIntent(input: {
  owner: string;
  tier: PaidMembershipTier;
  billingCycle: MembershipBillingCycle;
  rail: MembershipCheckoutRail;
  cryptoAsset?: MembershipCryptoAsset | null;
}): Promise<PaymentIntentResponse> {
  const successUrl = window.location.origin + window.location.pathname + '?payment=success';
  const cancelUrl = window.location.origin + window.location.pathname + '?payment=cancel';

  return paymentFetch<PaymentIntentResponse>('/api/payments/membership/intents', {
    method: 'POST',
    body: JSON.stringify({
      owner: input.owner,
      tier: input.tier,
      billingCycle: input.billingCycle,
      rail: input.rail,
      cryptoAsset: input.cryptoAsset ?? null,
      successUrl,
      cancelUrl,
    }),
  });
}

export async function fetchMembershipPaymentIntent(
  paymentId: string
): Promise<MembershipPaymentIntent> {
  const payload = await paymentFetch<{ intent: MembershipPaymentIntent }>(
    '/api/payments/membership/intents/' + encodeURIComponent(paymentId)
  );

  return payload.intent;
}

export async function confirmMockMembershipPayment(
  paymentId: string
): Promise<MembershipPaymentIntent> {
  const payload = await paymentFetch<{ intent: MembershipPaymentIntent }>(
    '/api/payments/membership/intents/' + encodeURIComponent(paymentId) + '/mock/confirm',
    { method: 'POST', body: '{}' }
  );

  return payload.intent;
}

export async function confirmCryptoMembershipPayment(input: {
  paymentId: string;
  txDigest: string;
  sender: string;
}): Promise<MembershipPaymentIntent> {
  const payload = await paymentFetch<{ intent: MembershipPaymentIntent }>(
    '/api/payments/membership/intents/' + encodeURIComponent(input.paymentId) + '/crypto/confirm',
    {
      method: 'POST',
      body: JSON.stringify({
        txDigest: input.txDigest,
        sender: input.sender,
      }),
    }
  );

  return payload.intent;
}

export function isPaymentApiAvailable(): boolean {
  return paymentsBaseUrl() !== null;
}