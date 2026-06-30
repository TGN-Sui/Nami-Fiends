import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  assertFulfillmentOperatorFromBody,
  assertOfficialOwnerFulfillmentAccess,
  fulfillmentPendingListRequiresAuth,
  readFulfillmentAuthErrorStatus,
} from '../services/fulfillment-auth.service.js';
import {
  completeMembershipFulfillment,
  getMembershipFulfillmentById,
  getPendingFulfillmentForOwner,
  listPendingMembershipFulfillments,
} from '../services/membership-fulfillment.service.js';
import { assertRateLimit } from '../services/rate-limit.service.js';

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

function handleFulfillmentAuthError(
  response: ServerResponse,
  error: unknown,
  logLabel: string
): void {
  const message = error instanceof Error ? error.message : 'fulfillment_request_failed';

  if (
    message === 'wallet_auth_required' ||
    message === 'wallet_auth_invalid' ||
    message === 'official_owner_required' ||
    message === 'fulfillment_operator_required' ||
    message === 'invalid_owner'
  ) {
    sendJson(response, readFulfillmentAuthErrorStatus(message), { error: message });
    return;
  }

  if (message === 'rate_limit_exceeded') {
    sendJson(response, 429, { error: message });
    return;
  }

  console.error(logLabel, error);
  sendJson(response, 500, {
    error: 'fulfillment_request_failed',
    message,
  });
}

export async function handleMembershipFulfillmentPendingGet(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (fulfillmentPendingListRequiresAuth()) {
    sendJson(response, 401, { error: 'fulfillment_auth_required' });
    return;
  }

  const fulfillments = await listPendingMembershipFulfillments();
  sendJson(response, 200, { fulfillments });
}

export async function handleMembershipFulfillmentPendingPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    assertRateLimit(request, 'membership-fulfillment-pending');
    const body = await readJsonBody(request);
    await assertOfficialOwnerFulfillmentAccess(body);
    const fulfillments = await listPendingMembershipFulfillments();
    sendJson(response, 200, { fulfillments });
  } catch (error) {
    handleFulfillmentAuthError(response, error, '[nami-fulfillment] pending list failed');
  }
}

export async function handleMembershipFulfillmentOwnerGet(
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string
): Promise<void> {
  const fulfillment = await getPendingFulfillmentForOwner(owner);

  if (!fulfillment) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { fulfillment });
}

export async function handleMembershipFulfillmentComplete(
  request: IncomingMessage,
  response: ServerResponse,
  fulfillmentId: string
): Promise<void> {
  try {
    assertRateLimit(request, 'membership-fulfillment-complete');
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';

    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    const fulfillment = await getMembershipFulfillmentById(fulfillmentId);

    if (!fulfillment) {
      sendJson(response, 404, { error: 'not_found' });
      return;
    }

    await assertFulfillmentOperatorFromBody(body, fulfillment.owner);

    const txDigest = typeof body.txDigest === 'string' ? body.txDigest : '';

    if (!txDigest) {
      sendJson(response, 400, { error: 'invalid_tx_digest' });
      return;
    }

    const completed = await completeMembershipFulfillment(fulfillmentId, txDigest);

    if (!completed) {
      sendJson(response, 404, { error: 'not_found' });
      return;
    }

    sendJson(response, 200, { fulfillment: completed });
  } catch (error) {
    handleFulfillmentAuthError(response, error, '[nami-fulfillment] complete failed');
  }
}