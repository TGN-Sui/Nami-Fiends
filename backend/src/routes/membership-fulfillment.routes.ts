import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  completeMembershipFulfillment,
  getPendingFulfillmentForOwner,
  listPendingMembershipFulfillments,
} from '../services/membership-fulfillment.service.js';

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

export async function handleMembershipFulfillmentPendingGet(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const fulfillments = await listPendingMembershipFulfillments();
  sendJson(response, 200, { fulfillments });
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
    const body = await readJsonBody(request);
    const txDigest = typeof body.txDigest === 'string' ? body.txDigest : '';

    if (!txDigest) {
      sendJson(response, 400, { error: 'invalid_tx_digest' });
      return;
    }

    const fulfillment = await completeMembershipFulfillment(fulfillmentId, txDigest);

    if (!fulfillment) {
      sendJson(response, 404, { error: 'not_found' });
      return;
    }

    sendJson(response, 200, { fulfillment });
  } catch (error) {
    console.error('[nami-fulfillment] complete failed', error);
    sendJson(response, 500, {
      error: 'fulfillment_complete_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}