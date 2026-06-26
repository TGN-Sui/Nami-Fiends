import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  getChannelPreferences,
  upsertChannelPreferences,
} from '../services/channel-preferences.service.js';
import {
  assertWalletAuth,
  readWalletAuthFromBody,
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

export async function handleChannelPreferencesGet(
  _request: IncomingMessage,
  response: ServerResponse,
  channelId: string
): Promise<void> {
  const preferences = await getChannelPreferences(channelId);

  if (!preferences) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { preferences });
}

export async function handleChannelPreferencesUpsert(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const channelId = typeof body.channelId === 'string' ? body.channelId : '';

    if (!owner.startsWith('0x') || !channelId.trim()) {
      sendJson(response, 400, { error: 'invalid_payload' });
      return;
    }

    const walletAuth = readWalletAuthFromBody(body);

    await assertWalletAuth(owner, walletAuth);

    const patch: Parameters<typeof upsertChannelPreferences>[0] = {
      channelId,
      owner,
    };

    if (body.coverUrl === null) {
      patch.coverUrl = null;
    } else if (typeof body.coverUrl === 'string') {
      patch.coverUrl = body.coverUrl;
    }

    const preferences = await upsertChannelPreferences(patch);
    sendJson(response, 200, { preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    console.error('[nami-channel-preferences] upsert failed', error);
    sendJson(response, 500, {
      error: 'channel_preferences_upsert_failed',
      message,
    });
  }
}