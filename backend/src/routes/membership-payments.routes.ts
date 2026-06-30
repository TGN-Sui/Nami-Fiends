import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  confirmCryptoPayment,
  confirmMockProviderPayment,
  createMembershipPaymentIntent,
  getMembershipPaymentIntent,
  getPublicPaymentConfig,
  handlePayPalWebhook,
  handleStripeWebhook,
  type MembershipCryptoAsset,
  type MembershipPaymentRail,
} from '../services/membership-payments.service.js';
import { assertRateLimit } from '../services/rate-limit.service.js';

type JsonRecord = Record<string, unknown>;

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = `${JSON.stringify(body, null, 2)}\n`;

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Stripe-Signature',
  });
  response.end(payload);
}

async function readJsonBody(request: IncomingMessage): Promise<JsonRecord> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();

  if (raw.length === 0) {
    return {};
  }

  return JSON.parse(raw) as JsonRecord;
}

async function readRawBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

function isPaymentRail(value: unknown): value is MembershipPaymentRail {
  return value === 'card' || value === 'paypal' || value === 'other';
}

function isCryptoAsset(value: unknown): value is MembershipCryptoAsset {
  return value === 'sui' || value === 'usdc' || value === 'goon';
}

export async function handlePaymentOptions(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  sendJson(response, 204, {});
}

export async function handlePaymentConfigGet(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  sendJson(response, 200, getPublicPaymentConfig());
}

export async function handlePaymentIntentCreate(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    assertRateLimit(request, 'membership-payment-intent');
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const tier = typeof body.tier === 'string' ? body.tier : '';
    const billingCycle = body.billingCycle === 'annual' ? 'annual' : 'monthly';
    const rail = body.rail;
    const cryptoAssetRaw = body.cryptoAsset;

    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    if (!tier) {
      sendJson(response, 400, { error: 'invalid_tier' });
      return;
    }

    if (!isPaymentRail(rail)) {
      sendJson(response, 400, { error: 'invalid_rail' });
      return;
    }

    let cryptoAsset: MembershipCryptoAsset | null = null;

    if (rail === 'other') {
      const normalized =
        cryptoAssetRaw === 'usdc-sui' ? 'usdc' : cryptoAssetRaw;

      if (!isCryptoAsset(normalized)) {
        sendJson(response, 400, { error: 'invalid_crypto_asset' });
        return;
      }

      cryptoAsset = normalized;
    }

    const intentInput: Parameters<typeof createMembershipPaymentIntent>[0] = {
      owner,
      tier,
      billingCycle,
      rail,
      cryptoAsset,
    };

    if (typeof body.successUrl === 'string') {
      intentInput.successUrl = body.successUrl;
    }

    if (typeof body.cancelUrl === 'string') {
      intentInput.cancelUrl = body.cancelUrl;
    }

    const result = await createMembershipPaymentIntent(intentInput);

    sendJson(response, 201, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'rate_limit_exceeded') {
      sendJson(response, 429, { error: message });
      return;
    }

    console.error('[nami-payments] create intent failed', error);
    sendJson(response, 500, {
      error: 'payment_intent_failed',
      message,
    });
  }
}

export async function handlePaymentIntentGet(
  _request: IncomingMessage,
  response: ServerResponse,
  paymentId: string
): Promise<void> {
  const intent = await getMembershipPaymentIntent(paymentId);

  if (!intent) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { intent });
}

export async function handlePaymentIntentMockConfirm(
  _request: IncomingMessage,
  response: ServerResponse,
  paymentId: string
): Promise<void> {
  try {
    const { assertMockProvidersAllowed } = await import('../services/payment-mock-guard.js');
    assertMockProvidersAllowed();
  } catch {
    sendJson(response, 403, { error: 'mock_payments_disabled' });
    return;
  }

  const intent = await confirmMockProviderPayment(paymentId);

  if (!intent) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { intent });
}

export async function handlePaymentIntentCryptoConfirm(
  request: IncomingMessage,
  response: ServerResponse,
  paymentId: string
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const txDigest = typeof body.txDigest === 'string' ? body.txDigest : '';
    const sender = typeof body.sender === 'string' ? body.sender : '';

    if (!txDigest || !sender.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_payload' });
      return;
    }

    const { assertWalletAuthFromBody } = await import('../services/wallet-auth.service.js');
    await assertWalletAuthFromBody(sender, body);

    const intent = await confirmCryptoPayment(paymentId, txDigest, sender);
    sendJson(response, 200, { intent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    if (message === 'tx_digest_already_used') {
      sendJson(response, 409, { error: message });
      return;
    }

    console.error('[nami-payments] crypto confirm failed', error);
    sendJson(response, 400, {
      error: 'crypto_confirm_failed',
      message,
    });
  }
}

export async function handleStripeWebhookPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const rawBody = await readRawBody(request);
    const signature = request.headers['stripe-signature'];
    const intent = await handleStripeWebhook(
      rawBody,
      typeof signature === 'string' ? signature : null
    );

    sendJson(response, 200, { received: true, intent });
  } catch (error) {
    console.error('[nami-payments] stripe webhook failed', error);
    sendJson(response, 400, {
      error: 'stripe_webhook_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function handlePayPalWebhookPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const rawBody = await readRawBody(request);
    const { readPayPalWebhookHeaders } = await import('../services/paypal-webhook.service.js');
    const intent = await handlePayPalWebhook(rawBody, readPayPalWebhookHeaders(request));
    sendJson(response, 200, { received: true, intent });
  } catch (error) {
    console.error('[nami-payments] paypal webhook failed', error);
    sendJson(response, 400, {
      error: 'paypal_webhook_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}