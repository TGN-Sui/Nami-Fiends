import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  getMemberPreferences,
  upsertMemberPreferences,
} from '../services/member-preferences.service.js';

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

export async function handleMemberPreferencesGet(
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string
): Promise<void> {
  const preferences = await getMemberPreferences(owner);

  if (!preferences) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { preferences });
}

export async function handleMemberPreferencesUpsert(
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

    const patch: Parameters<typeof upsertMemberPreferences>[0] = { owner };

    if (body.avatarUrl === null) {
      patch.avatarUrl = null;
    } else if (typeof body.avatarUrl === 'string') {
      patch.avatarUrl = body.avatarUrl;
    }

    if (typeof body.streamingOnline === 'boolean') {
      patch.streamingOnline = body.streamingOnline;
    }

    const preferences = await upsertMemberPreferences(patch);

    sendJson(response, 200, { preferences });
  } catch (error) {
    console.error('[nami-preferences] upsert failed', error);
    sendJson(response, 500, {
      error: 'preferences_upsert_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}