import { randomUUID } from 'node:crypto';

import { config } from '../config.js';
import { paymentConfig } from '../payment-config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';
import { assertChannelOwnerWallet } from './channel-ownership.service.js';
import { activateSuperBannerEntitlement } from './hub-super-banner-gate.service.js';
import { getPublicPaymentConfig } from './membership-payments.service.js';

export type PromotionProduct = 'super-banner' | 'hub-featured' | 'partner-carousel';
export type PromotionDuration = '24h' | '72h' | 'weekly';
export type PromotionPaymentRail = 'card' | 'paypal' | 'other';

export type PromotionPaymentStatus =
  | 'created'
  | 'pending_provider'
  | 'paid'
  | 'failed'
  | 'expired';

export type PromotionPaymentIntent = {
  id: string;
  owner: string;
  channelId: string;
  product: PromotionProduct;
  duration: PromotionDuration;
  amountUsd: number;
  rail: PromotionPaymentRail;
  status: PromotionPaymentStatus;
  createdAtMs: number;
  updatedAtMs: number;
  paidAtMs: number | null;
  provider: 'stripe' | 'paypal' | 'mock' | null;
  providerRef: string | null;
  receiptUrl: string | null;
};

type PromotionPaymentStore = {
  intents: PromotionPaymentIntent[];
};

const STORE_PATH = `${config.dataDir}/projections/promotion-payments.json`;

const PROMOTION_DURATION_PRICES_USD: Record<
  PromotionProduct,
  Record<PromotionDuration, number>
> = {
  'super-banner': { '24h': 49, '72h': 49, weekly: 49 },
  'hub-featured': { '24h': 79, '72h': 199, weekly: 399 },
  'partner-carousel': { '24h': 99, '72h': 249, weekly: 499 },
};

function emptyStore(): PromotionPaymentStore {
  return { intents: [] };
}

async function readStore(): Promise<PromotionPaymentStore> {
  return readJsonFile<PromotionPaymentStore>(STORE_PATH, emptyStore());
}

async function writeStore(store: PromotionPaymentStore): Promise<void> {
  await writeJsonFile(STORE_PATH, store);
}

function isPromotionProduct(value: unknown): value is PromotionProduct {
  return value === 'super-banner' || value === 'hub-featured' || value === 'partner-carousel';
}

function isPromotionDuration(value: unknown): value is PromotionDuration {
  return value === '24h' || value === '72h' || value === 'weekly';
}

function isPromotionRail(value: unknown): value is PromotionPaymentRail {
  return value === 'card' || value === 'paypal' || value === 'other';
}

function durationToMs(duration: PromotionDuration): number {
  if (duration === '24h') {
    return 24 * 60 * 60 * 1000;
  }

  if (duration === '72h') {
    return 72 * 60 * 60 * 1000;
  }

  return 7 * 24 * 60 * 60 * 1000;
}

function promotionLabel(intent: PromotionPaymentIntent): string {
  return (
    'Nami promotion · ' +
    intent.product +
    ' · ' +
    intent.duration +
    ' · ' +
    intent.channelId
  );
}

async function createStripeCheckoutSession(
  intent: PromotionPaymentIntent,
  successUrl: string,
  cancelUrl: string,
): Promise<{ mode: 'stripe' | 'mock'; checkoutUrl: string | null; sessionId: string }> {
  if (!paymentConfig.stripeSecretKey.trim()) {
    const sessionId = 'mock_cs_' + intent.id;
    const checkoutUrl =
      successUrl +
      (successUrl.includes('?') ? '&' : '?') +
      'payment_id=' +
      encodeURIComponent(intent.id) +
      '&mock_session=' +
      encodeURIComponent(sessionId);

    return { mode: 'mock', checkoutUrl, sessionId };
  }

  const body = new URLSearchParams({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: intent.id,
    'metadata[payment_id]': intent.id,
    'metadata[payment_kind]': 'promotion',
    'metadata[product]': intent.product,
    'metadata[channel_id]': intent.channelId,
    'metadata[owner]': intent.owner,
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': promotionLabel(intent),
    'line_items[0][price_data][unit_amount]': String(Math.round(intent.amountUsd * 100)),
    'line_items[0][quantity]': '1',
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + paymentConfig.stripeSecretKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error('Stripe promotion checkout failed: ' + (await response.text()));
  }

  const session = (await response.json()) as { id: string; url: string | null };

  return { mode: 'stripe', checkoutUrl: session.url, sessionId: session.id };
}

async function fulfillPromotionIntent(intent: PromotionPaymentIntent): Promise<void> {
  if (intent.product === 'super-banner') {
    await activateSuperBannerEntitlement({
      channelId: intent.channelId,
      owner: intent.owner,
      ttlMs: durationToMs(intent.duration),
    });
  }
}

async function markPromotionPaid(
  paymentId: string,
  patch: Partial<Pick<PromotionPaymentIntent, 'provider' | 'providerRef' | 'receiptUrl'>>,
): Promise<PromotionPaymentIntent | null> {
  const store = await readStore();
  const index = store.intents.findIndex((intent) => intent.id === paymentId);

  if (index < 0) {
    return null;
  }

  const intent = store.intents[index]!;
  const now = Date.now();

  store.intents[index] = {
    ...intent,
    ...patch,
    status: 'paid',
    paidAtMs: now,
    updatedAtMs: now,
  };

  const paidIntent = store.intents[index]!;
  await writeStore(store);

  try {
    await fulfillPromotionIntent(paidIntent);
  } catch (error) {
    console.error('[nami-promotion-payments] fulfillment failed', error);
  }

  return paidIntent;
}

export type CreatePromotionPaymentIntentInput = {
  owner: string;
  channelId: string;
  product: PromotionProduct;
  duration: PromotionDuration;
  rail: PromotionPaymentRail;
  successUrl?: string;
  cancelUrl?: string;
};

export type PromotionPaymentIntentResponse = {
  intent: PromotionPaymentIntent;
  card?: {
    mode: 'stripe' | 'mock';
    checkoutUrl: string | null;
    sessionId: string;
  };
};

export async function createPromotionPaymentIntent(
  input: CreatePromotionPaymentIntentInput,
): Promise<PromotionPaymentIntentResponse> {
  const publicConfig = getPublicPaymentConfig();

  if (input.rail === 'card' && !publicConfig.cardEnabled) {
    throw new Error('Card checkout is not available on this build.');
  }

  if (input.rail !== 'card') {
    throw new Error('Promotion checkout currently supports card rail only.');
  }

  await assertChannelOwnerWallet(input.channelId, input.owner, null);

  const amountUsd = PROMOTION_DURATION_PRICES_USD[input.product][input.duration];
  const now = Date.now();

  const intent: PromotionPaymentIntent = {
    id: randomUUID(),
    owner: input.owner,
    channelId: input.channelId,
    product: input.product,
    duration: input.duration,
    amountUsd,
    rail: input.rail,
    status: 'created',
    createdAtMs: now,
    updatedAtMs: now,
    paidAtMs: null,
    provider: null,
    providerRef: null,
    receiptUrl: null,
  };

  const store = await readStore();
  store.intents.unshift(intent);
  await writeStore(store);

  const successUrl = input.successUrl ?? paymentConfig.defaultSuccessUrl;
  const cancelUrl = input.cancelUrl ?? paymentConfig.defaultCancelUrl;
  const card = await createStripeCheckoutSession(intent, successUrl, cancelUrl);

  intent.status = 'pending_provider';
  intent.provider = card.mode === 'stripe' ? 'stripe' : 'mock';
  intent.providerRef = card.sessionId;
  intent.updatedAtMs = Date.now();

  const updatedStore = await readStore();
  const index = updatedStore.intents.findIndex((row) => row.id === intent.id);

  if (index >= 0) {
    updatedStore.intents[index] = intent;
    await writeStore(updatedStore);
  }

  return { intent, card };
}

export async function getPromotionPaymentIntent(
  paymentId: string,
): Promise<PromotionPaymentIntent | null> {
  const store = await readStore();
  return store.intents.find((intent) => intent.id === paymentId) ?? null;
}

export async function confirmMockPromotionPayment(
  paymentId: string,
): Promise<PromotionPaymentIntent | null> {
  const { assertMockProvidersAllowed } = await import('./payment-mock-guard.js');
  assertMockProvidersAllowed();

  const intent = await getPromotionPaymentIntent(paymentId);

  if (!intent || intent.status === 'paid') {
    return intent;
  }

  return markPromotionPaid(paymentId, {
    provider: intent.provider ?? 'mock',
    providerRef: intent.providerRef,
    receiptUrl: null,
  });
}

export async function tryMarkPromotionPaidFromStripe(paymentId: string): Promise<PromotionPaymentIntent | null> {
  const intent = await getPromotionPaymentIntent(paymentId);

  if (!intent || intent.status === 'paid') {
    return intent;
  }

  return markPromotionPaid(paymentId, {
    provider: 'stripe',
    providerRef: intent.providerRef,
    receiptUrl: null,
  });
}