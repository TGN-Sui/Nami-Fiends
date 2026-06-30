import type { IncomingMessage, ServerResponse } from 'node:http';

import { syncGiftCatalog } from '../services/gift-catalog.service.js';
import {
  confirmGiftCryptoPayment,
  confirmMockGiftPayment,
  createGiftPaymentIntent,
  fulfillGoonWalletGift,
  getGiftPaymentIntent,
  giftPublicConfig,
  handleGiftPayPalWebhook,
  handleGiftStripeWebhook,
  listRecentGiftFulfillments,
  type GiftPaymentRail,
  type GiftTargetType,
} from '../services/gift-payments.service.js';
import type { MembershipCryptoAsset } from '../services/membership-payments.service.js';
import { isOfficialOwnerAddress } from '../services/officials-auth.service.js';
import { assertWalletAuthFromBody } from '../services/wallet-auth.service.js';

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

function isGiftRail(value: unknown): value is GiftPaymentRail {
  return value === 'goon_wallet' || value === 'card' || value === 'paypal' || value === 'other';
}

function isGiftTargetType(value: unknown): value is GiftTargetType {
  return value === 'member' || value === 'stream';
}

function isCryptoAsset(value: unknown): value is MembershipCryptoAsset {
  return value === 'sui' || value === 'usdc' || value === 'goon';
}

export async function handleGiftOptions(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  sendJson(response, 204, {});
}

export async function handleGiftCatalogGet(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  sendJson(response, 200, await giftPublicConfig());
}

export async function handleGiftCatalogSync(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';

    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    if (!isOfficialOwnerAddress(owner)) {
      sendJson(response, 403, { error: 'official_owner_required' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    const entries = Array.isArray(body.entries) ? body.entries : [];
    const catalog = await syncGiftCatalog({ owner, entries });
    const config = await giftPublicConfig();

    sendJson(response, 200, {
      catalog: config.catalog,
      updatedAtMs: catalog.updatedAtMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'gift_catalog_sync_failed';

    if (message === 'invalid_gift_icon') {
      sendJson(response, 400, { error: message });
      return;
    }

    if (message.startsWith('wallet_auth_')) {
      sendJson(response, 401, { error: 'wallet_auth_invalid', message });
      return;
    }

    sendJson(response, 500, { error: 'gift_catalog_sync_failed', message });
  }
}

export async function handleGiftIntentCreate(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const senderOwner = typeof body.senderOwner === 'string' ? body.senderOwner : '';
    const senderMemberId = typeof body.senderMemberId === 'string' ? body.senderMemberId : '';
    const senderMemberName =
      typeof body.senderMemberName === 'string' ? body.senderMemberName : '';
    const giftId = typeof body.giftId === 'string' ? body.giftId : '';
    const targetType = body.targetType;
    const targetMemberId = typeof body.targetMemberId === 'string' ? body.targetMemberId : '';
    const targetMemberName =
      typeof body.targetMemberName === 'string' ? body.targetMemberName : '';
    const rail = body.rail;
    const cryptoAssetRaw = body.cryptoAsset;

    if (!senderOwner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_sender_owner' });
      return;
    }

    if (!senderMemberId || !targetMemberId) {
      sendJson(response, 400, { error: 'invalid_member_ids' });
      return;
    }

    if (!giftId) {
      sendJson(response, 400, { error: 'invalid_gift_id' });
      return;
    }

    if (!isGiftTargetType(targetType)) {
      sendJson(response, 400, { error: 'invalid_target_type' });
      return;
    }

    if (!isGiftRail(rail)) {
      sendJson(response, 400, { error: 'invalid_rail' });
      return;
    }

    let cryptoAsset: MembershipCryptoAsset | null = null;

    if (rail === 'other') {
      const normalized = cryptoAssetRaw === 'usdc-sui' ? 'usdc' : cryptoAssetRaw;

      if (!isCryptoAsset(normalized)) {
        sendJson(response, 400, { error: 'invalid_crypto_asset' });
        return;
      }

      cryptoAsset = normalized;
    }

    await assertWalletAuthFromBody(senderOwner, body);

    const intentInput: Parameters<typeof createGiftPaymentIntent>[0] = {
      senderOwner,
      senderMemberId,
      senderMemberName: senderMemberName || 'Member',
      giftId,
      targetType,
      targetMemberId,
      targetMemberName: targetMemberName || 'Member',
      rail,
      cryptoAsset,
    };

    if (typeof body.streamKey === 'string') {
      intentInput.streamKey = body.streamKey;
    }

    if (typeof body.streamTitle === 'string') {
      intentInput.streamTitle = body.streamTitle;
    }

    if (typeof body.channelOwnerMemberId === 'string') {
      intentInput.channelOwnerMemberId = body.channelOwnerMemberId;
    }

    if (typeof body.successUrl === 'string') {
      intentInput.successUrl = body.successUrl;
    }

    if (typeof body.cancelUrl === 'string') {
      intentInput.cancelUrl = body.cancelUrl;
    }

    const result = await createGiftPaymentIntent(intentInput);

    sendJson(response, 201, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message.startsWith('wallet_auth_invalid')) {
      sendJson(response, 401, { error: 'wallet_auth_invalid', message });
      return;
    }

    console.error('[nami-gifts] create intent failed', error);
    sendJson(response, 500, {
      error: 'gift_intent_failed',
      message,
    });
  }
}

export async function handleGiftIntentGet(
  _request: IncomingMessage,
  response: ServerResponse,
  paymentId: string
): Promise<void> {
  const intent = await getGiftPaymentIntent(paymentId);

  if (!intent) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { intent });
}

export async function handleGiftIntentMockConfirm(
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

  const result = await confirmMockGiftPayment(paymentId);

  if (!result) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, result);
}

export async function handleGiftIntentGoonFulfill(
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

    await assertWalletAuthFromBody(sender, body);

    const result = await fulfillGoonWalletGift(paymentId, txDigest, sender);
    sendJson(response, 200, result);
  } catch (error) {
    console.error('[nami-gifts] goon fulfill failed', error);
    sendJson(response, 400, {
      error: 'gift_goon_fulfill_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function handleGiftIntentCryptoConfirm(
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

    await assertWalletAuthFromBody(sender, body);

    const result = await confirmGiftCryptoPayment(paymentId, txDigest, sender);
    sendJson(response, 200, result);
  } catch (error) {
    console.error('[nami-gifts] crypto confirm failed', error);
    sendJson(response, 400, {
      error: 'gift_crypto_confirm_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function handleGiftRecentGet(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const memberId = url.searchParams.get('memberId');
  const streamKey = url.searchParams.get('streamKey');
  const limit = Number(url.searchParams.get('limit') ?? '20');

  const gifts = await listRecentGiftFulfillments({
    ...(memberId ? { memberId } : {}),
    ...(streamKey ? { streamKey } : {}),
    limit: Number.isFinite(limit) ? limit : 20,
  });

  sendJson(response, 200, { gifts });
}

export async function handleGiftStripeWebhookPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const rawBody = await readRawBody(request);
    const signature = request.headers['stripe-signature'];
    const result = await handleGiftStripeWebhook(
      rawBody,
      typeof signature === 'string' ? signature : null
    );

    sendJson(response, 200, { received: true, result });
  } catch (error) {
    console.error('[nami-gifts] stripe webhook failed', error);
    sendJson(response, 400, {
      error: 'stripe_webhook_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function handleGiftPayPalWebhookPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const rawBody = await readRawBody(request);
    const result = await handleGiftPayPalWebhook(rawBody);
    sendJson(response, 200, { received: true, result });
  } catch (error) {
    console.error('[nami-gifts] paypal webhook failed', error);
    sendJson(response, 400, {
      error: 'paypal_webhook_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}