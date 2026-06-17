import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  getMembershipSubscription,
  syncMembershipSubscription,
} from '../services/membership-subscriptions.service.js';

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

export async function handleMembershipSubscriptionGet(
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string
): Promise<void> {
  const subscription = await getMembershipSubscription(owner);

  if (!subscription) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { subscription });
}

export async function handleMembershipSubscriptionSync(
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

    const patch: Parameters<typeof syncMembershipSubscription>[0] = { owner };

    if (typeof body.activeTier === 'string') {
      patch.activeTier = body.activeTier;
    }

    if (body.billingCycle === 'annual' || body.billingCycle === 'monthly') {
      patch.billingCycle = body.billingCycle;
    }

    if (
      body.status === 'active' ||
      body.status === 'pending-upgrade' ||
      body.status === 'pending-downgrade' ||
      body.status === 'pending-cancel' ||
      body.status === 'cancelled'
    ) {
      patch.status = body.status;
    }

    if (body.pendingTier === null) {
      patch.pendingTier = null;
    } else if (typeof body.pendingTier === 'string') {
      patch.pendingTier = body.pendingTier;
    }

    if (
      body.adventurerSource === 'paid' ||
      body.adventurerSource === 'x-claim' ||
      body.adventurerSource === null
    ) {
      patch.adventurerSource = body.adventurerSource;
    }

    if (typeof body.renewsAtMs === 'number') {
      patch.renewsAtMs = body.renewsAtMs;
    }

    const subscription = await syncMembershipSubscription(patch);

    sendJson(response, 200, { subscription });
  } catch (error) {
    console.error('[nami-membership] sync failed', error);
    sendJson(response, 500, {
      error: 'subscription_sync_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}