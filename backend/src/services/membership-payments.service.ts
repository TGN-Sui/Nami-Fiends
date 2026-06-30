import { randomUUID } from 'node:crypto';

import {
  isConfiguredSecret,
  isConfiguredWalletAddress,
  paymentConfig,
} from '../payment-config.js';
import { createSuiClient } from '../sui.js';
import { readJsonFile, writeJsonFile } from '../storage.js';
import { activateMembershipFromPaymentIntent } from './membership-subscriptions.service.js';
import { verifyStripeWebhookSignature } from './stripe-webhook-signature.service.js';

export type MembershipPaymentRail = 'card' | 'paypal' | 'other';

export type MembershipCryptoAsset = 'sui' | 'usdc' | 'goon';

export type MembershipPaymentStatus =
  | 'created'
  | 'pending_provider'
  | 'paid'
  | 'failed'
  | 'expired';

export type MembershipPaymentIntent = {
  id: string;
  owner: string;
  tier: string;
  billingCycle: 'monthly' | 'annual';
  amountUsd: number;
  rail: MembershipPaymentRail;
  cryptoAsset: MembershipCryptoAsset | null;
  status: MembershipPaymentStatus;
  createdAtMs: number;
  updatedAtMs: number;
  paidAtMs: number | null;
  provider: 'stripe' | 'paypal' | 'sui_chain' | 'mock' | null;
  providerRef: string | null;
  txDigest: string | null;
  receiptUrl: string | null;
};

type PaymentStore = {
  intents: MembershipPaymentIntent[];
};

const PAYMENTS_PATH = 'data/projections/membership-payments.json';

const TIER_PRICES_USD: Record<string, { monthly: number; annual: number }> = {
  Adventurer: { monthly: 3, annual: 27 },
  Pro: { monthly: 9.99, annual: 89 },
  Elite: { monthly: 19.99, annual: 179 },
};

function emptyStore(): PaymentStore {
  return { intents: [] };
}

async function readStore(): Promise<PaymentStore> {
  return readJsonFile<PaymentStore>(PAYMENTS_PATH, emptyStore());
}

async function writeStore(store: PaymentStore): Promise<void> {
  await writeJsonFile(PAYMENTS_PATH, store);
}

function tierAmountUsd(tier: string, billingCycle: 'monthly' | 'annual'): number {
  const prices = TIER_PRICES_USD[tier];

  if (!prices) {
    throw new Error('Unknown membership tier: ' + tier);
  }

  return billingCycle === 'annual' ? prices.annual : prices.monthly;
}

function amountBaseUnits(amountUsd: number, decimals: number): bigint {
  const factor = 10 ** decimals;
  return BigInt(Math.round(amountUsd * factor));
}

function suiAmountMist(amountUsd: number): bigint {
  const suiAmount = amountUsd / paymentConfig.suiUsdPrice;
  return BigInt(Math.ceil(suiAmount * 1_000_000_000));
}

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

export function getPublicPaymentConfig(): PublicPaymentConfig {
  const treasuryConfigured = isConfiguredWalletAddress(paymentConfig.treasuryAddress);
  const stripeConfigured =
    isConfiguredSecret(paymentConfig.stripeSecretKey) &&
    isConfiguredSecret(paymentConfig.stripePublishableKey);
  const paypalConfigured =
    isConfiguredSecret(paymentConfig.paypalClientId) &&
    isConfiguredSecret(paymentConfig.paypalClientSecret);

  return {
    treasuryAddress: treasuryConfigured ? paymentConfig.treasuryAddress : null,
    usdcCoinType: paymentConfig.usdcCoinType,
    goonCoinType: paymentConfig.goonCoinType,
    stripePublishableKey: stripeConfigured ? paymentConfig.stripePublishableKey : null,
    paypalClientId: paypalConfigured ? paymentConfig.paypalClientId : null,
    cardEnabled:
      paymentConfig.cardCheckoutEnabled &&
      (stripeConfigured || paymentConfig.allowMockProviders),
    paypalEnabled: paypalConfigured || paymentConfig.allowMockProviders,
    cryptoEnabled: treasuryConfigured,
    mockProviders: paymentConfig.allowMockProviders,
  };
}

export type CreatePaymentIntentInput = {
  owner: string;
  tier: string;
  billingCycle: 'monthly' | 'annual';
  rail: MembershipPaymentRail;
  cryptoAsset?: MembershipCryptoAsset | null;
  successUrl?: string;
  cancelUrl?: string;
};

export type CardCheckoutPayload = {
  mode: 'stripe' | 'mock';
  checkoutUrl: string | null;
  sessionId: string;
};

export type PayPalCheckoutPayload = {
  mode: 'paypal' | 'mock';
  approvalUrl: string | null;
  orderId: string;
};

export type CryptoCheckoutPayload = {
  treasuryAddress: string;
  asset: MembershipCryptoAsset;
  amountUsd: number;
  amountLabel: string;
  amountBaseUnits: string;
  coinType: string | null;
  paymentMemo: string;
};

export type PaymentIntentResponse = {
  intent: MembershipPaymentIntent;
  card?: CardCheckoutPayload;
  paypal?: PayPalCheckoutPayload;
  crypto?: CryptoCheckoutPayload;
};

async function createStripeCheckoutSession(
  intent: MembershipPaymentIntent,
  successUrl: string,
  cancelUrl: string
): Promise<CardCheckoutPayload> {
  if (!paymentConfig.stripeSecretKey.trim()) {
    const sessionId = 'mock_cs_' + intent.id;
    const checkoutUrl =
      successUrl +
      (successUrl.includes('?') ? '&' : '?') +
      'payment_id=' +
      encodeURIComponent(intent.id) +
      '&mock_session=' +
      encodeURIComponent(sessionId);

    return {
      mode: 'mock',
      checkoutUrl,
      sessionId,
    };
  }

  const body = new URLSearchParams({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: intent.id,
    'metadata[payment_id]': intent.id,
    'metadata[tier]': intent.tier,
    'metadata[owner]': intent.owner,
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]':
      'Nami ' + intent.tier + ' (' + intent.billingCycle + ')',
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
    const errorText = await response.text();
    throw new Error('Stripe checkout session failed: ' + errorText);
  }

  const session = (await response.json()) as { id: string; url: string | null };

  return {
    mode: 'stripe',
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

async function getPayPalAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    paymentConfig.paypalClientId + ':' + paymentConfig.paypalClientSecret
  ).toString('base64');

  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const response = await fetch(paymentConfig.paypalApiBase + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + credentials,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error('PayPal OAuth failed: ' + (await response.text()));
  }

  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

async function createPayPalOrder(
  intent: MembershipPaymentIntent,
  returnUrl: string,
  cancelUrl: string
): Promise<PayPalCheckoutPayload> {
  if (!paymentConfig.paypalClientId.trim() || !paymentConfig.paypalClientSecret.trim()) {
    const orderId = 'mock_pp_' + intent.id;
    const approvalUrl =
      returnUrl +
      (returnUrl.includes('?') ? '&' : '?') +
      'payment_id=' +
      encodeURIComponent(intent.id) +
      '&mock_paypal_order=' +
      encodeURIComponent(orderId);

    return {
      mode: 'mock',
      approvalUrl,
      orderId,
    };
  }

  const token = await getPayPalAccessToken();
  const response = await fetch(paymentConfig.paypalApiBase + '/v2/checkout/orders', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: intent.id,
          custom_id: intent.id,
          amount: {
            currency_code: 'USD',
            value: intent.amountUsd.toFixed(2),
          },
          description: 'Nami ' + intent.tier + ' (' + intent.billingCycle + ')',
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: 'Nami',
        user_action: 'PAY_NOW',
      },
    }),
  });

  if (!response.ok) {
    throw new Error('PayPal order failed: ' + (await response.text()));
  }

  const order = (await response.json()) as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };

  const approval = order.links.find((link) => link.rel === 'approve');

  return {
    mode: 'paypal',
    approvalUrl: approval?.href ?? null,
    orderId: order.id,
  };
}

function buildCryptoPayload(intent: MembershipPaymentIntent): CryptoCheckoutPayload {
  const asset = intent.cryptoAsset;

  if (!asset) {
    throw new Error('Crypto asset is required for Other payments.');
  }

  if (!isConfiguredWalletAddress(paymentConfig.treasuryAddress)) {
    throw new Error('Payment treasury address is not configured on the server.');
  }

  if (asset === 'sui') {
    const mist = suiAmountMist(intent.amountUsd);
    return {
      treasuryAddress: paymentConfig.treasuryAddress,
      asset,
      amountUsd: intent.amountUsd,
      amountLabel: (Number(mist) / 1_000_000_000).toFixed(4) + ' SUI',
      amountBaseUnits: mist.toString(),
      coinType: null,
      paymentMemo: intent.id,
    };
  }

  if (asset === 'usdc') {
    const base = amountBaseUnits(intent.amountUsd, paymentConfig.usdcDecimals);
    return {
      treasuryAddress: paymentConfig.treasuryAddress,
      asset,
      amountUsd: intent.amountUsd,
      amountLabel: intent.amountUsd.toFixed(2) + ' USDC',
      amountBaseUnits: base.toString(),
      coinType: paymentConfig.usdcCoinType,
      paymentMemo: intent.id,
    };
  }

  const base = amountBaseUnits(intent.amountUsd, paymentConfig.goonDecimals);
  return {
    treasuryAddress: paymentConfig.treasuryAddress,
    asset,
    amountUsd: intent.amountUsd,
    amountLabel: intent.amountUsd.toFixed(2) + ' GOON',
    amountBaseUnits: base.toString(),
    coinType: paymentConfig.goonCoinType,
    paymentMemo: intent.id,
  };
}

export async function createMembershipPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResponse> {
  const publicConfig = getPublicPaymentConfig();

  if (input.rail === 'card' && !publicConfig.cardEnabled) {
    throw new Error('Card checkout is not available on this build.');
  }

  if (input.rail === 'paypal' && !publicConfig.paypalEnabled) {
    throw new Error('PayPal checkout is not available on this build.');
  }

  if (input.rail === 'other' && !publicConfig.cryptoEnabled) {
    throw new Error('Crypto checkout is not available on this build.');
  }

  const amountUsd = tierAmountUsd(input.tier, input.billingCycle);
  const now = Date.now();

  const intent: MembershipPaymentIntent = {
    id: randomUUID(),
    owner: input.owner,
    tier: input.tier,
    billingCycle: input.billingCycle,
    amountUsd,
    rail: input.rail,
    cryptoAsset: input.rail === 'other' ? input.cryptoAsset ?? null : null,
    status: 'created',
    createdAtMs: now,
    updatedAtMs: now,
    paidAtMs: null,
    provider: null,
    providerRef: null,
    txDigest: null,
    receiptUrl: null,
  };

  const store = await readStore();
  store.intents.unshift(intent);
  await writeStore(store);

  const successUrl = input.successUrl ?? paymentConfig.defaultSuccessUrl;
  const cancelUrl = input.cancelUrl ?? paymentConfig.defaultCancelUrl;

  const response: PaymentIntentResponse = { intent };

  if (input.rail === 'card') {
    const card = await createStripeCheckoutSession(intent, successUrl, cancelUrl);
    intent.status = 'pending_provider';
    intent.provider = card.mode === 'stripe' ? 'stripe' : 'mock';
    intent.providerRef = card.sessionId;
    intent.updatedAtMs = Date.now();
    response.card = card;
  } else if (input.rail === 'paypal') {
    const paypal = await createPayPalOrder(intent, successUrl, cancelUrl);
    intent.status = 'pending_provider';
    intent.provider = paypal.mode === 'paypal' ? 'paypal' : 'mock';
    intent.providerRef = paypal.orderId;
    intent.updatedAtMs = Date.now();
    response.paypal = paypal;
  } else {
    response.crypto = buildCryptoPayload(intent);
    intent.status = 'pending_provider';
    intent.provider = 'sui_chain';
    intent.updatedAtMs = Date.now();
  }

  const updatedStore = await readStore();
  const index = updatedStore.intents.findIndex((row) => row.id === intent.id);

  if (index >= 0) {
    updatedStore.intents[index] = intent;
    await writeStore(updatedStore);
  }

  response.intent = intent;
  return response;
}

export async function getMembershipPaymentIntent(
  paymentId: string
): Promise<MembershipPaymentIntent | null> {
  const store = await readStore();
  return store.intents.find((intent) => intent.id === paymentId) ?? null;
}

async function markIntentPaid(
  paymentId: string,
  patch: Partial<Pick<MembershipPaymentIntent, 'provider' | 'providerRef' | 'txDigest' | 'receiptUrl'>>
): Promise<MembershipPaymentIntent | null> {
  const store = await readStore();
  const index = store.intents.findIndex((intent) => intent.id === paymentId);

  if (index < 0) {
    return null;
  }

  const intent = store.intents[index]!;

  if (intent.status === 'paid') {
    return intent;
  }

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
    await activateMembershipFromPaymentIntent(paidIntent);
  } catch (error) {
    console.error('[nami-payments] subscription activation failed', error);
  }

  return paidIntent;
}

export async function confirmMockProviderPayment(paymentId: string): Promise<MembershipPaymentIntent | null> {
  const { assertMockProvidersAllowed } = await import('./payment-mock-guard.js');
  assertMockProvidersAllowed();

  const intent = await getMembershipPaymentIntent(paymentId);

  if (!intent || intent.status === 'paid') {
    return intent;
  }

  return markIntentPaid(paymentId, {
    provider: intent.provider ?? 'mock',
    providerRef: intent.providerRef,
    receiptUrl: null,
  });
}

export async function confirmCryptoPayment(
  paymentId: string,
  txDigest: string,
  sender: string
): Promise<MembershipPaymentIntent | null> {
  const intent = await getMembershipPaymentIntent(paymentId);

  if (!intent) {
    return null;
  }

  if (intent.rail !== 'other' || !intent.cryptoAsset) {
    throw new Error('Payment intent is not a crypto checkout.');
  }

  if (intent.owner.toLowerCase() !== sender.toLowerCase()) {
    throw new Error('Connected wallet does not match checkout owner.');
  }

  const client = createSuiClient();
  const tx = await client.getTransactionBlock({
    digest: txDigest,
    options: { showBalanceChanges: true, showEffects: true },
  });

  if (tx.effects?.status?.status !== 'success') {
    throw new Error('On-chain transaction did not succeed.');
  }

  const treasury = paymentConfig.treasuryAddress.toLowerCase();
  const changes = tx.balanceChanges ?? [];

  function ownerAddress(owner: unknown): string | null {
    if (typeof owner !== 'object' || owner === null) {
      return null;
    }

    const addressOwner = (owner as { AddressOwner?: string }).AddressOwner;

    if (typeof addressOwner === 'string') {
      return addressOwner.toLowerCase();
    }

    return null;
  }

  if (intent.cryptoAsset === 'sui') {
    const expected = suiAmountMist(intent.amountUsd);
    const received = changes.find(
      (change) =>
        ownerAddress(change.owner) === treasury &&
        change.coinType === '0x2::sui::SUI' &&
        BigInt(change.amount) >= expected
    );

    if (!received) {
      throw new Error('Treasury did not receive the expected SUI amount.');
    }
  } else {
    const coinType = intent.cryptoAsset === 'usdc' ? paymentConfig.usdcCoinType : paymentConfig.goonCoinType;
    const decimals = intent.cryptoAsset === 'usdc' ? paymentConfig.usdcDecimals : paymentConfig.goonDecimals;
    const expected = amountBaseUnits(intent.amountUsd, decimals);

    const received = changes.find(
      (change) =>
        ownerAddress(change.owner) === treasury &&
        change.coinType === coinType &&
        BigInt(change.amount) >= expected
    );

    if (!received) {
      throw new Error('Treasury did not receive the expected token amount.');
    }
  }

  const { assertTxDigestUnused, recordTxDigestUse } = await import('./crypto-tx-dedup.service.js');
  await assertTxDigestUnused(txDigest, paymentId);

  const paid = await markIntentPaid(paymentId, {
    provider: 'sui_chain',
    providerRef: txDigest,
    txDigest,
    receiptUrl: null,
  });

  if (paid) {
    await recordTxDigestUse(txDigest, paymentId);
  }

  return paid;
}

export async function handleStripeWebhook(
  rawBody: string,
  signatureHeader: string | null
): Promise<MembershipPaymentIntent | null> {
  if (!paymentConfig.stripeWebhookSecret.trim()) {
    if (!paymentConfig.allowMockProviders) {
      throw new Error('Stripe webhook secret is not configured.');
    }

    const payload = JSON.parse(rawBody) as {
      type?: string;
      data?: { object?: { metadata?: { payment_id?: string }; client_reference_id?: string } };
    };

    if (payload.type !== 'checkout.session.completed') {
      return null;
    }

    const paymentId =
      payload.data?.object?.metadata?.payment_id ??
      payload.data?.object?.client_reference_id ??
      null;

    if (!paymentId) {
      return null;
    }

    const promotionPayments = await import('./promotion-payments.service.js');

    if (await promotionPayments.getPromotionPaymentIntent(paymentId)) {
      await promotionPayments.confirmMockPromotionPayment(paymentId);
      return null;
    }

    return confirmMockProviderPayment(paymentId);
  }

  if (!signatureHeader) {
    throw new Error('Missing Stripe signature header.');
  }

  verifyStripeWebhookSignature(rawBody, signatureHeader, paymentConfig.stripeWebhookSecret);

  const event = JSON.parse(rawBody) as {
    type: string;
    data: { object: { metadata?: { payment_id?: string }; client_reference_id?: string; id?: string } };
  };

  if (event.type !== 'checkout.session.completed') {
    return null;
  }

  const paymentId =
    event.data.object.metadata?.payment_id ?? event.data.object.client_reference_id ?? null;

  if (!paymentId) {
    return null;
  }

  const promotionPayments = await import('./promotion-payments.service.js');

  if (await promotionPayments.getPromotionPaymentIntent(paymentId)) {
    await promotionPayments.tryMarkPromotionPaidFromStripe(paymentId);
    return null;
  }

  return markIntentPaid(paymentId, {
    provider: 'stripe',
    providerRef: event.data.object.id ?? null,
    receiptUrl: null,
  });
}

export async function handlePayPalWebhook(
  rawBody: string,
  headers: import('./paypal-webhook.service.js').PayPalWebhookHeaders | null,
): Promise<MembershipPaymentIntent | null> {
  const { verifyPayPalWebhookSignature } = await import('./paypal-webhook.service.js');

  if (!headers) {
    throw new Error('Missing PayPal webhook transmission headers.');
  }

  await verifyPayPalWebhookSignature(rawBody, headers);

  const payload = JSON.parse(rawBody) as {
    event_type?: string;
    resource?: { custom_id?: string; id?: string };
  };

  if (payload.event_type !== 'CHECKOUT.ORDER.APPROVED' && payload.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return null;
  }

  const paymentId = payload.resource?.custom_id ?? null;

  if (!paymentId) {
    return null;
  }

  return markIntentPaid(paymentId, {
    provider: 'paypal',
    providerRef: payload.resource?.id ?? null,
    receiptUrl: null,
  });
}