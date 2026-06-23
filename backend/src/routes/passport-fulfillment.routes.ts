import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  completePassportFulfillment,
  getPassportFulfillmentForClaim,
  getPendingPassportFulfillmentForEmail,
  listPendingPassportFulfillments,
  queuePassportFulfillmentsFromClaims,
  retrySuinsProvision,
  type QueuePassportFulfillmentInput,
} from '../services/passport-fulfillment.service.js';

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

function parseQueueClaims(value: unknown): QueuePassportFulfillmentInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (entry === null || typeof entry !== 'object') {
      return [];
    }

    const row = entry as JsonRecord;
    const claimId = typeof row.claimId === 'string' ? row.claimId : '';
    const email = typeof row.email === 'string' ? row.email : '';
    const nodename = typeof row.nodename === 'string' ? row.nodename : '';

    if (!claimId || !email || !nodename) {
      return [];
    }

    return [
      {
        claimId,
        email,
        nodename,
        preferredName:
          typeof row.preferredName === 'string' ? row.preferredName : nodename,
        submitterAddress:
          typeof row.submitterAddress === 'string' ? row.submitterAddress : null,
        archetype: typeof row.archetype === 'number' ? row.archetype : 0,
      },
    ];
  });
}

export async function handlePassportFulfillmentPendingGet(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const fulfillments = await listPendingPassportFulfillments();
  sendJson(response, 200, { fulfillments });
}

export async function handlePassportFulfillmentClaimGet(
  _request: IncomingMessage,
  response: ServerResponse,
  claimId: string
): Promise<void> {
  const fulfillment = await getPassportFulfillmentForClaim(claimId);

  if (!fulfillment) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { fulfillment });
}

export async function handlePassportFulfillmentEmailGet(
  _request: IncomingMessage,
  response: ServerResponse,
  email: string
): Promise<void> {
  const fulfillment = await getPendingPassportFulfillmentForEmail(email);

  if (!fulfillment) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { fulfillment });
}

export async function handlePassportFulfillmentQueuePost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const claims = parseQueueClaims(body.claims);

    if (claims.length === 0) {
      sendJson(response, 400, { error: 'invalid_claims' });
      return;
    }

    const fulfillments = await queuePassportFulfillmentsFromClaims(claims);
    sendJson(response, 200, { fulfillments });
  } catch (error) {
    console.error('[nami-passport-fulfillment] queue failed', error);
    sendJson(response, 500, {
      error: 'queue_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function handlePassportFulfillmentRetrySuinsPost(
  _request: IncomingMessage,
  response: ServerResponse,
  fulfillmentId: string
): Promise<void> {
  try {
    const fulfillment = await retrySuinsProvision(fulfillmentId);

    if (!fulfillment) {
      sendJson(response, 404, { error: 'not_found' });
      return;
    }

    sendJson(response, 200, { fulfillment });
  } catch (error) {
    console.error('[nami-passport-fulfillment] suins retry failed', error);
    sendJson(response, 500, {
      error: 'suins_retry_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function handlePassportFulfillmentComplete(
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

    const fulfillment = await completePassportFulfillment(fulfillmentId, txDigest);

    if (!fulfillment) {
      sendJson(response, 404, { error: 'not_found' });
      return;
    }

    sendJson(response, 200, { fulfillment });
  } catch (error) {
    console.error('[nami-passport-fulfillment] complete failed', error);
    sendJson(response, 500, {
      error: 'fulfillment_complete_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}