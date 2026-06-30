import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  filterOfficialsSyncInput,
  resolveOfficialsSyncScope,
} from '../services/officials-auth.service.js';
import {
  getOfficialsSubmissions,
  syncOfficialsSubmissions,
} from '../services/officials-submissions.service.js';
import { assertRateLimit } from '../services/rate-limit.service.js';

type JsonRecord = Record<string, unknown>;

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = `${JSON.stringify(body, null, 2)}\n`;

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, X-Nami-Officials-Sync',
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

export function handleOfficialsSubmissionsOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleOfficialsSubmissionsGet(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const projection = await getOfficialsSubmissions();
  sendJson(response, 200, { submissions: projection });
}

export async function handleOfficialsSubmissionsSync(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    assertRateLimit(request, 'officials-sync');
    const body = await readJsonBody(request);
    const { scope, owner } = await resolveOfficialsSyncScope(request, body);
    const syncEmail = typeof body.syncEmail === 'string' ? body.syncEmail : '';
    const rawInput: {
      suggestions?: unknown[];
      gameTickets?: unknown[];
      partnerBanners?: unknown[];
      nodenameClaims?: unknown[];
      ownerProvisionedChannels?: unknown[];
    } = {};

    if (Array.isArray(body.suggestions)) {
      rawInput.suggestions = body.suggestions;
    }

    if (Array.isArray(body.gameTickets)) {
      rawInput.gameTickets = body.gameTickets;
    }

    if (Array.isArray(body.partnerBanners)) {
      rawInput.partnerBanners = body.partnerBanners;
    }

    if (Array.isArray(body.nodenameClaims)) {
      rawInput.nodenameClaims = body.nodenameClaims;
    }

    if (Array.isArray(body.ownerProvisionedChannels)) {
      rawInput.ownerProvisionedChannels = body.ownerProvisionedChannels;
    }

    const input = filterOfficialsSyncInput(rawInput, scope, owner, syncEmail);
    const projection = await syncOfficialsSubmissions(input);

    sendJson(response, 200, { submissions: projection });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sync officials submissions.';

    if (
      message === 'officials_sync_auth_required' ||
      message === 'officials_sync_auth_invalid'
    ) {
      sendJson(response, 401, { error: message });
      return;
    }

    if (message === 'rate_limit_exceeded') {
      sendJson(response, 429, { error: message });
      return;
    }

    sendJson(response, 400, {
      error: 'invalid_request',
      message,
    });
  }
}