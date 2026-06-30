import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  confirmMockPromotionPayment,
  createPromotionPaymentIntent,
  getPromotionPaymentIntent,
  type PromotionDuration,
  type PromotionProduct,
} from '../services/promotion-payments.service.js';

type JsonRecord = Record<string, unknown>;

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = `${JSON.stringify(body, null, 2)}\n`;

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
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

function isPromotionProduct(value: unknown): value is PromotionProduct {
  return value === 'super-banner' || value === 'hub-featured' || value === 'partner-carousel';
}

function isPromotionDuration(value: unknown): value is PromotionDuration {
  return value === '24h' || value === '72h' || value === 'weekly';
}

export async function handlePromotionPaymentIntentCreate(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const channelId = typeof body.channelId === 'string' ? body.channelId : '';
    const product = body.product;
    const duration = body.duration;
    const rail = body.rail === 'card' ? 'card' : null;

    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    if (!channelId.trim()) {
      sendJson(response, 400, { error: 'invalid_channel_id' });
      return;
    }

    if (!isPromotionProduct(product) || !isPromotionDuration(duration) || rail !== 'card') {
      sendJson(response, 400, { error: 'invalid_promotion_checkout' });
      return;
    }

    const successUrl = typeof body.successUrl === 'string' ? body.successUrl : null;
    const cancelUrl = typeof body.cancelUrl === 'string' ? body.cancelUrl : null;

    const payload = await createPromotionPaymentIntent({
      owner,
      channelId,
      product,
      duration,
      rail,
      ...(successUrl ? { successUrl } : {}),
      ...(cancelUrl ? { cancelUrl } : {}),
    });

    sendJson(response, 200, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'channel_not_found' || message === 'not_channel_owner') {
      sendJson(response, 403, { error: message });
      return;
    }

    console.error('[nami-promotion-payments] create failed', error);
    sendJson(response, 500, { error: 'promotion_payment_create_failed', message });
  }
}

export async function handlePromotionPaymentIntentGet(
  _request: IncomingMessage,
  response: ServerResponse,
  paymentId: string,
): Promise<void> {
  const intent = await getPromotionPaymentIntent(paymentId);

  if (!intent) {
    sendJson(response, 404, { error: 'payment_intent_not_found' });
    return;
  }

  sendJson(response, 200, { intent });
}

export async function handlePromotionPaymentMockConfirmPost(
  _request: IncomingMessage,
  response: ServerResponse,
  paymentId: string,
): Promise<void> {
  try {
    const { assertMockProvidersAllowed } = await import('../services/payment-mock-guard.js');
    assertMockProvidersAllowed();
  } catch {
    sendJson(response, 403, { error: 'mock_payments_disabled' });
    return;
  }

  const intent = await confirmMockPromotionPayment(paymentId);

  if (!intent) {
    sendJson(response, 404, { error: 'payment_intent_not_found' });
    return;
  }

  sendJson(response, 200, { intent });
}