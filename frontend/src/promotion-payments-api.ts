import { readIndexerUrl } from './protocol-env.js';
import type { PromotionDuration, PromotionProduct } from './channel-owner-promotions-store.js';

export type PromotionPaymentIntent = {
  id: string;
  owner: string;
  channelId: string;
  product: PromotionProduct;
  duration: PromotionDuration;
  amountUsd: number;
  rail: 'card' | 'paypal' | 'other';
  status: 'created' | 'pending_provider' | 'paid' | 'failed' | 'expired';
  createdAtMs: number;
  updatedAtMs: number;
  paidAtMs: number | null;
  provider: 'stripe' | 'paypal' | 'mock' | null;
  providerRef: string | null;
  receiptUrl: string | null;
};

export type PromotionPaymentIntentResponse = {
  intent: PromotionPaymentIntent;
  card?: {
    mode: 'stripe' | 'mock';
    checkoutUrl: string | null;
    sessionId: string;
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
    throw new Error(payload.message ?? payload.error ?? 'Promotion payment request failed.');
  }

  return payload;
}

export function isPromotionPaymentApiAvailable(): boolean {
  return paymentsBaseUrl() !== null;
}

export async function createPromotionPaymentIntent(input: {
  owner: string;
  channelId: string;
  product: PromotionProduct;
  duration: PromotionDuration;
}): Promise<PromotionPaymentIntentResponse> {
  const successUrl =
    window.location.origin + window.location.pathname + '?payment=success&promotion=1';
  const cancelUrl =
    window.location.origin + window.location.pathname + '?payment=cancel&promotion=1';

  return paymentFetch<PromotionPaymentIntentResponse>('/api/payments/promotions/intents', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      rail: 'card',
      successUrl,
      cancelUrl,
    }),
  });
}

export async function fetchPromotionPaymentIntent(
  paymentId: string,
): Promise<PromotionPaymentIntent | null> {
  const base = paymentsBaseUrl();

  if (!base) {
    return null;
  }

  const response = await fetch(
    base + '/api/payments/promotions/intents/' + encodeURIComponent(paymentId),
  );

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json()) as {
    intent?: PromotionPaymentIntent;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Promotion payment lookup failed.');
  }

  return payload.intent ?? null;
}

export async function confirmMockPromotionPayment(
  paymentId: string,
): Promise<PromotionPaymentIntent> {
  const payload = await paymentFetch<{ intent: PromotionPaymentIntent }>(
    '/api/payments/promotions/intents/' + encodeURIComponent(paymentId) + '/mock/confirm',
    { method: 'POST', body: '{}' },
  );

  return payload.intent;
}