import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  getOfficialsSubmissions,
  syncOfficialsSubmissions,
} from '../services/officials-submissions.service.js';

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
    const body = await readJsonBody(request);
    const input: {
      suggestions?: unknown[];
      gameTickets?: unknown[];
      partnerBanners?: unknown[];
      nodenameClaims?: unknown[];
    } = {};

    if (Array.isArray(body.suggestions)) {
      input.suggestions = body.suggestions;
    }

    if (Array.isArray(body.gameTickets)) {
      input.gameTickets = body.gameTickets;
    }

    if (Array.isArray(body.partnerBanners)) {
      input.partnerBanners = body.partnerBanners;
    }

    if (Array.isArray(body.nodenameClaims)) {
      input.nodenameClaims = body.nodenameClaims;
    }

    const projection = await syncOfficialsSubmissions(input);

    sendJson(response, 200, { submissions: projection });
  } catch (error) {
    sendJson(response, 400, {
      error: 'invalid_request',
      message: error instanceof Error ? error.message : 'Could not sync officials submissions.',
    });
  }
}