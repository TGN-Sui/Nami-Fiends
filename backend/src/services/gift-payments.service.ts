import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import {
  giftRevenueSplitPercents,
  isConfiguredWalletAddress,
  paymentConfig,
} from '../payment-config.js';
import { createSuiClient } from '../sui.js';
import { readJsonFile, writeJsonFile } from '../storage.js';
import type { MembershipCryptoAsset } from './membership-payments.service.js';
import { getPublicPaymentConfig } from './membership-payments.service.js';
import {
  DEFAULT_OFFICIAL_GIFT_CATALOG,
  findGiftCatalogEntry,
  getGiftCatalog,
  type GiftCatalogEntry,
  type GiftTier,
} from './gift-catalog.service.js';

export type { GiftCatalogEntry, GiftTier } from './gift-catalog.service.js';
export {
  DEFAULT_OFFICIAL_GIFT_CATALOG as OFFICIAL_GIFT_CATALOG,
  getGiftCatalog,
  findGiftCatalogEntry,
} from './gift-catalog.service.js';

export type GiftPaymentRail = 'goon_wallet' | 'card' | 'paypal' | 'other';

export type GiftTargetType = 'member' | 'stream';

export type GiftPaymentStatus =
  | 'created'
  | 'pending_provider'
  | 'paid'
  | 'failed'
  | 'expired';

export type GiftRevenueSplit = {
  creatorPercent: number;
  channelOwnerPercent: number;
  platformPercent: number;
  creatorAmountUsd: number;
  channelOwnerAmountUsd: number;
  platformAmountUsd: number;
  channelOwnerRolledToPlatform: boolean;
};

export type GiftPaymentIntent = {
  id: string;
  giftId: string;
  senderOwner: string;
  senderMemberId: string;
  senderMemberName: string;
  targetType: GiftTargetType;
  targetMemberId: string;
  targetMemberName: string;
  streamKey: string | null;
  streamTitle: string | null;
  channelOwnerMemberId: string | null;
  amountUsd: number;
  goonAmount: number;
  rail: GiftPaymentRail;
  cryptoAsset: MembershipCryptoAsset | null;
  status: GiftPaymentStatus;
  createdAtMs: number;
  updatedAtMs: number;
  paidAtMs: number | null;
  provider: 'stripe' | 'paypal' | 'sui_chain' | 'goon_wallet' | 'mock' | null;
  providerRef: string | null;
  txDigest: string | null;
  receiptUrl: string | null;
};

export type GiftFulfillment = {
  id: string;
  intentId: string;
  giftId: string;
  giftLabel: string;
  giftTier: GiftTier;
  giftEmoji: string;
  giftIconUrl: string | null;
  animationClass: string;
  senderOwner: string;
  senderMemberId: string;
  senderMemberName: string;
  targetType: GiftTargetType;
  targetMemberId: string;
  targetMemberName: string;
  streamKey: string | null;
  streamTitle: string | null;
  channelOwnerMemberId: string | null;
  amountUsd: number;
  goonAmount: number;
  rail: GiftPaymentRail;
  revenueSplit: GiftRevenueSplit;
  txDigest: string | null;
  createdAtMs: number;
};

type GiftStore = {
  intents: GiftPaymentIntent[];
  fulfillments: GiftFulfillment[];
};

const GIFTS_PATH = 'data/projections/gift-payments.json';

function emptyStore(): GiftStore {
  return { intents: [], fulfillments: [] };
}

async function readStore(): Promise<GiftStore> {
  return readJsonFile<GiftStore>(GIFTS_PATH, emptyStore());
}

async function writeStore(store: GiftStore): Promise<void> {
  await writeJsonFile(GIFTS_PATH, store);
}

function roundUsd(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function computeGiftRevenueSplit(
  amountUsd: number,
  hasChannelOwner: boolean
): GiftRevenueSplit {
  const percents = giftRevenueSplitPercents();
  const creatorPercent = percents.creator;
  const channelOwnerPercent = hasChannelOwner ? percents.channelOwner : 0;
  const platformPercent = hasChannelOwner
    ? percents.platform
    : percents.channelOwner + percents.platform;

  const creatorAmountUsd = roundUsd((amountUsd * creatorPercent) / 100);
  const channelOwnerAmountUsd = hasChannelOwner
    ? roundUsd((amountUsd * percents.channelOwner) / 100)
    : 0;
  const platformAmountUsd = roundUsd(amountUsd - creatorAmountUsd - channelOwnerAmountUsd);

  return {
    creatorPercent,
    channelOwnerPercent,
    platformPercent,
    creatorAmountUsd,
    channelOwnerAmountUsd,
    platformAmountUsd,
    channelOwnerRolledToPlatform: !hasChannelOwner,
  };
}

function amountBaseUnits(amountUsd: number, decimals: number): bigint {
  const factor = 10 ** decimals;
  return BigInt(Math.round(amountUsd * factor));
}

function goonAmountBaseUnits(goonAmount: number): bigint {
  return BigInt(Math.round(goonAmount * 10 ** paymentConfig.goonDecimals));
}

function suiAmountMist(amountUsd: number): bigint {
  const suiAmount = amountUsd / paymentConfig.suiUsdPrice;
  return BigInt(Math.ceil(suiAmount * 1_000_000_000));
}

export type CreateGiftIntentInput = {
  senderOwner: string;
  senderMemberId: string;
  senderMemberName: string;
  giftId: string;
  targetType: GiftTargetType;
  targetMemberId: string;
  targetMemberName: string;
  streamKey?: string | null;
  streamTitle?: string | null;
  channelOwnerMemberId?: string | null;
  rail: GiftPaymentRail;
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

export type GoonWalletCheckoutPayload = {
  treasuryAddress: string;
  goonAmount: number;
  amountBaseUnits: string;
  coinType: string;
  paymentMemo: string;
};

export type GiftIntentResponse = {
  intent: GiftPaymentIntent;
  card?: CardCheckoutPayload;
  paypal?: PayPalCheckoutPayload;
  crypto?: CryptoCheckoutPayload;
  goonWallet?: GoonWalletCheckoutPayload;
};

async function createStripeCheckoutSession(
  intent: GiftPaymentIntent,
  gift: GiftCatalogEntry,
  successUrl: string,
  cancelUrl: string
): Promise<CardCheckoutPayload> {
  if (!paymentConfig.stripeSecretKey.trim()) {
    const sessionId = 'mock_gift_cs_' + intent.id;
    const checkoutUrl =
      successUrl +
      (successUrl.includes('?') ? '&' : '?') +
      'gift_payment_id=' +
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
    'metadata[gift_id]': intent.giftId,
    'metadata[sender_owner]': intent.senderOwner,
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': 'Nami Gift — ' + gift.label,
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
    throw new Error('Stripe gift checkout session failed: ' + errorText);
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
  intent: GiftPaymentIntent,
  gift: GiftCatalogEntry,
  returnUrl: string,
  cancelUrl: string
): Promise<PayPalCheckoutPayload> {
  if (!paymentConfig.paypalClientId.trim() || !paymentConfig.paypalClientSecret.trim()) {
    const orderId = 'mock_gift_pp_' + intent.id;
    const approvalUrl =
      returnUrl +
      (returnUrl.includes('?') ? '&' : '?') +
      'gift_payment_id=' +
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
          description: 'Nami Gift — ' + gift.label + ' for ' + intent.targetMemberName,
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
    throw new Error('PayPal gift order failed: ' + (await response.text()));
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

function buildCryptoPayload(intent: GiftPaymentIntent): CryptoCheckoutPayload {
  const asset = intent.cryptoAsset;

  if (!asset) {
    throw new Error('Crypto asset is required for Other gift payments.');
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

  const base = goonAmountBaseUnits(intent.goonAmount);
  return {
    treasuryAddress: paymentConfig.treasuryAddress,
    asset,
    amountUsd: intent.amountUsd,
    amountLabel: intent.goonAmount.toFixed(2) + ' GOON',
    amountBaseUnits: base.toString(),
    coinType: paymentConfig.goonCoinType,
    paymentMemo: intent.id,
  };
}

function buildGoonWalletPayload(intent: GiftPaymentIntent): GoonWalletCheckoutPayload {
  if (!isConfiguredWalletAddress(paymentConfig.treasuryAddress)) {
    throw new Error('Payment treasury address is not configured on the server.');
  }

  const base = goonAmountBaseUnits(intent.goonAmount);

  return {
    treasuryAddress: paymentConfig.treasuryAddress,
    goonAmount: intent.goonAmount,
    amountBaseUnits: base.toString(),
    coinType: paymentConfig.goonCoinType,
    paymentMemo: intent.id,
  };
}

export async function createGiftPaymentIntent(
  input: CreateGiftIntentInput
): Promise<GiftIntentResponse> {
  const publicConfig = getPublicPaymentConfig();
  const gift = await findGiftCatalogEntry(input.giftId);

  if (!gift) {
    throw new Error('Unknown gift id: ' + input.giftId);
  }

  if (input.rail === 'card' && !publicConfig.cardEnabled) {
    throw new Error('Card checkout is not available on this build.');
  }

  if (input.rail === 'paypal' && !publicConfig.paypalEnabled) {
    throw new Error('PayPal checkout is not available on this build.');
  }

  if ((input.rail === 'other' || input.rail === 'goon_wallet') && !publicConfig.cryptoEnabled) {
    throw new Error('Wallet checkout is not available on this build.');
  }

  if (input.targetType === 'stream' && !input.streamKey?.trim()) {
    throw new Error('Stream gifts require a streamKey.');
  }

  const now = Date.now();

  const intent: GiftPaymentIntent = {
    id: randomUUID(),
    giftId: gift.id,
    senderOwner: input.senderOwner,
    senderMemberId: input.senderMemberId,
    senderMemberName: input.senderMemberName,
    targetType: input.targetType,
    targetMemberId: input.targetMemberId,
    targetMemberName: input.targetMemberName,
    streamKey: input.targetType === 'stream' ? (input.streamKey ?? null) : null,
    streamTitle: input.targetType === 'stream' ? (input.streamTitle ?? null) : null,
    channelOwnerMemberId: input.channelOwnerMemberId?.trim() ? input.channelOwnerMemberId.trim() : null,
    amountUsd: gift.priceUsd,
    goonAmount: gift.goonAmount,
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

  const response: GiftIntentResponse = { intent };

  if (input.rail === 'card') {
    const card = await createStripeCheckoutSession(intent, gift, successUrl, cancelUrl);
    intent.status = 'pending_provider';
    intent.provider = card.mode === 'stripe' ? 'stripe' : 'mock';
    intent.providerRef = card.sessionId;
    intent.updatedAtMs = Date.now();
    response.card = card;
  } else if (input.rail === 'paypal') {
    const paypal = await createPayPalOrder(intent, gift, successUrl, cancelUrl);
    intent.status = 'pending_provider';
    intent.provider = paypal.mode === 'paypal' ? 'paypal' : 'mock';
    intent.providerRef = paypal.orderId;
    intent.updatedAtMs = Date.now();
    response.paypal = paypal;
  } else if (input.rail === 'other') {
    response.crypto = buildCryptoPayload(intent);
    intent.status = 'pending_provider';
    intent.provider = 'sui_chain';
    intent.updatedAtMs = Date.now();
  } else {
    response.goonWallet = buildGoonWalletPayload(intent);
    intent.status = 'pending_provider';
    intent.provider = 'goon_wallet';
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

export async function getGiftPaymentIntent(paymentId: string): Promise<GiftPaymentIntent | null> {
  const store = await readStore();
  return store.intents.find((intent) => intent.id === paymentId) ?? null;
}

function fulfillmentFromIntent(
  intent: GiftPaymentIntent,
  gift: GiftCatalogEntry,
  txDigest: string | null
): GiftFulfillment {
  return {
    id: randomUUID(),
    intentId: intent.id,
    giftId: gift.id,
    giftLabel: gift.label,
    giftTier: gift.tier,
    giftEmoji: gift.emoji,
    giftIconUrl: gift.iconUrl,
    animationClass: gift.animationClass,
    senderOwner: intent.senderOwner,
    senderMemberId: intent.senderMemberId,
    senderMemberName: intent.senderMemberName,
    targetType: intent.targetType,
    targetMemberId: intent.targetMemberId,
    targetMemberName: intent.targetMemberName,
    streamKey: intent.streamKey,
    streamTitle: intent.streamTitle,
    channelOwnerMemberId: intent.channelOwnerMemberId,
    amountUsd: intent.amountUsd,
    goonAmount: intent.goonAmount,
    rail: intent.rail,
    revenueSplit: computeGiftRevenueSplit(intent.amountUsd, Boolean(intent.channelOwnerMemberId)),
    txDigest,
    createdAtMs: Date.now(),
  };
}

async function markGiftIntentPaid(
  paymentId: string,
  patch: Partial<Pick<GiftPaymentIntent, 'provider' | 'providerRef' | 'txDigest' | 'receiptUrl'>>
): Promise<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment } | null> {
  const store = await readStore();
  const index = store.intents.findIndex((intent) => intent.id === paymentId);

  if (index < 0) {
    return null;
  }

  const intent = store.intents[index]!;
  const gift = await findGiftCatalogEntry(intent.giftId);

  if (!gift) {
    throw new Error('Gift catalog entry missing for intent ' + intent.id);
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
  const fulfillment = fulfillmentFromIntent(paidIntent, gift, paidIntent.txDigest);
  store.fulfillments.unshift(fulfillment);

  await writeStore(store);

  return { intent: paidIntent, fulfillment };
}

export async function confirmMockGiftPayment(
  paymentId: string
): Promise<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment } | null> {
  const intent = await getGiftPaymentIntent(paymentId);

  if (!intent || intent.status === 'paid') {
    if (!intent) {
      return null;
    }

    const store = await readStore();
    const fulfillment = store.fulfillments.find((row) => row.intentId === intent.id) ?? null;

    return fulfillment ? { intent, fulfillment } : null;
  }

  return markGiftIntentPaid(paymentId, {
    provider: intent.provider ?? 'mock',
    providerRef: intent.providerRef,
    receiptUrl: null,
  });
}

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

async function verifyGoonTreasuryReceipt(
  intent: GiftPaymentIntent,
  txDigest: string
): Promise<void> {
  const client = createSuiClient();
  const tx = await client.getTransactionBlock({
    digest: txDigest,
    options: { showBalanceChanges: true, showEffects: true },
  });

  if (tx.effects?.status?.status !== 'success') {
    throw new Error('On-chain transaction did not succeed.');
  }

  const treasury = paymentConfig.treasuryAddress.toLowerCase();
  const expected = goonAmountBaseUnits(intent.goonAmount);
  const changes = tx.balanceChanges ?? [];

  const received = changes.find(
    (change) =>
      ownerAddress(change.owner) === treasury &&
      change.coinType === paymentConfig.goonCoinType &&
      BigInt(change.amount) >= expected
  );

  if (!received) {
    throw new Error('Treasury did not receive the expected GOON amount.');
  }
}

async function verifyCryptoTreasuryReceipt(
  intent: GiftPaymentIntent,
  txDigest: string
): Promise<void> {
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
  const asset = intent.cryptoAsset;

  if (!asset) {
    throw new Error('Crypto asset missing on gift intent.');
  }

  if (asset === 'sui') {
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

    return;
  }

  const coinType = asset === 'usdc' ? paymentConfig.usdcCoinType : paymentConfig.goonCoinType;
  const expected =
    asset === 'usdc'
      ? amountBaseUnits(intent.amountUsd, paymentConfig.usdcDecimals)
      : goonAmountBaseUnits(intent.goonAmount);

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

export async function fulfillGoonWalletGift(
  paymentId: string,
  txDigest: string,
  sender: string
): Promise<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment } | null> {
  const intent = await getGiftPaymentIntent(paymentId);

  if (!intent) {
    return null;
  }

  if (intent.rail !== 'goon_wallet') {
    throw new Error('Gift intent is not a GOON wallet checkout.');
  }

  if (intent.senderOwner.toLowerCase() !== sender.toLowerCase()) {
    throw new Error('Connected wallet does not match gift sender.');
  }

  await verifyGoonTreasuryReceipt(intent, txDigest);

  return markGiftIntentPaid(paymentId, {
    provider: 'goon_wallet',
    providerRef: txDigest,
    txDigest,
    receiptUrl: null,
  });
}

export async function confirmGiftCryptoPayment(
  paymentId: string,
  txDigest: string,
  sender: string
): Promise<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment } | null> {
  const intent = await getGiftPaymentIntent(paymentId);

  if (!intent) {
    return null;
  }

  if (intent.rail !== 'other' || !intent.cryptoAsset) {
    throw new Error('Gift intent is not a crypto checkout.');
  }

  if (intent.senderOwner.toLowerCase() !== sender.toLowerCase()) {
    throw new Error('Connected wallet does not match gift sender.');
  }

  await verifyCryptoTreasuryReceipt(intent, txDigest);

  return markGiftIntentPaid(paymentId, {
    provider: 'sui_chain',
    providerRef: txDigest,
    txDigest,
    receiptUrl: null,
  });
}

function parseStripeSignatureHeader(header: string): { timestamp: string; signatures: string[] } {
  const parts = header.split(',').map((part) => part.trim());
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');

    if (key === 't') {
      timestamp = value ?? '';
    }

    if (key === 'v1' && value) {
      signatures.push(value);
    }
  }

  return { timestamp, signatures };
}

export async function handleGiftStripeWebhook(
  rawBody: string,
  signatureHeader: string | null
): Promise<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment } | null> {
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

    return paymentId ? confirmMockGiftPayment(paymentId) : null;
  }

  if (!signatureHeader) {
    throw new Error('Missing Stripe signature header.');
  }

  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);
  const signedPayload = timestamp + '.' + rawBody;
  const expected = createHmac('sha256', paymentConfig.stripeWebhookSecret)
    .update(signedPayload)
    .digest('hex');

  const verified = signatures.some((signature) => {
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });

  if (!verified) {
    throw new Error('Invalid Stripe webhook signature.');
  }

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

  return markGiftIntentPaid(paymentId, {
    provider: 'stripe',
    providerRef: event.data.object.id ?? null,
    receiptUrl: null,
  });
}

export async function handleGiftPayPalWebhook(
  rawBody: string
): Promise<{ intent: GiftPaymentIntent; fulfillment: GiftFulfillment } | null> {
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

  return markGiftIntentPaid(paymentId, {
    provider: 'paypal',
    providerRef: payload.resource?.id ?? null,
    receiptUrl: null,
  });
}

export type RecentGiftsQuery = {
  memberId?: string;
  streamKey?: string;
  limit?: number;
};

export async function listRecentGiftFulfillments(
  query: RecentGiftsQuery
): Promise<GiftFulfillment[]> {
  const store = await readStore();
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);

  let rows = store.fulfillments;

  if (query.memberId) {
    rows = rows.filter((row) => row.targetMemberId === query.memberId);
  }

  if (query.streamKey) {
    rows = rows.filter(
      (row) => row.targetType === 'stream' && row.streamKey === query.streamKey
    );
  }

  return rows.slice(0, limit);
}

export async function giftPublicConfig(): Promise<{
  revenueSplit: ReturnType<typeof giftRevenueSplitPercents>;
  catalog: GiftCatalogEntry[];
}> {
  return {
    revenueSplit: giftRevenueSplitPercents(),
    catalog: await getGiftCatalog(),
  };
}