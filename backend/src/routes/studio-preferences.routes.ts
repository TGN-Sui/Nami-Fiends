import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  getStudioPreferences,
  upsertStudioPreferences,
} from '../services/studio-preferences.service.js';
import {
  assertWalletAuth,
  type WalletAuthPayload,
} from '../services/wallet-auth.service.js';

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

function readWalletAuth(body: JsonRecord): Partial<WalletAuthPayload> {
  const auth = body.auth;

  if (typeof auth !== 'object' || auth === null) {
    return {};
  }

  const record = auth as JsonRecord;
  const patch: Partial<WalletAuthPayload> = {};

  if (typeof record.signature === 'string') {
    patch.signature = record.signature;
  }

  if (typeof record.timestampMs === 'number') {
    patch.timestampMs = record.timestampMs;
  }

  return patch;
}

export async function handleStudioPreferencesGet(
  _request: IncomingMessage,
  response: ServerResponse,
  studioId: string
): Promise<void> {
  const preferences = await getStudioPreferences(studioId);

  if (!preferences) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { preferences });
}

export async function handleStudioPreferencesUpsert(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const studioId = typeof body.studioId === 'string' ? body.studioId : '';
    const walletAuth = readWalletAuth(body);

    if (!owner.startsWith('0x') || !studioId.trim()) {
      sendJson(response, 400, { error: 'invalid_payload' });
      return;
    }

    await assertWalletAuth(owner, {
      owner,
      signature: walletAuth.signature ?? '',
      timestampMs: walletAuth.timestampMs ?? 0,
    });

    const patch: Parameters<typeof upsertStudioPreferences>[0] = {
      studioId,
      owner,
    };

    if (body.logoUrl === null) {
      patch.logoUrl = null;
    } else if (typeof body.logoUrl === 'string') {
      patch.logoUrl = body.logoUrl;
    }

    const preferences = await upsertStudioPreferences(patch);
    sendJson(response, 200, { preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    console.error('[nami-studio-preferences] upsert failed', error);
    sendJson(response, 500, {
      error: 'studio_preferences_upsert_failed',
      message,
    });
  }
}