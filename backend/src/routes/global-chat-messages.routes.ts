import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  appendGlobalChatMessage,
  listGlobalChatMessages,
} from '../services/global-chat-messages.service.js';
import { assertRateLimit } from '../services/rate-limit.service.js';
import { assertWalletAuthFromBody } from '../services/wallet-auth.service.js';

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

export function handleGlobalChatMessagesOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleGlobalChatMessagesGet(
  request: IncomingMessage,
  response: ServerResponse,
  roomId: string
): Promise<void> {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const sinceMs = Number(url.searchParams.get('sinceMs') ?? '0');
    const limit = Number(url.searchParams.get('limit') ?? '120');

    const messages = await listGlobalChatMessages({
      roomId,
      sinceMs: Number.isFinite(sinceMs) ? sinceMs : 0,
      limit: Number.isFinite(limit) ? limit : 120,
    });

    sendJson(response, 200, { roomId, messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'global_chat_list_failed';

    if (message === 'global_chat_room_not_allowed') {
      sendJson(response, 404, { error: message });
      return;
    }

    console.error('[nami-global-chat] list failed', error);
    sendJson(response, 500, { error: 'global_chat_list_failed', message });
  }
}

export async function handleGlobalChatMessagesPost(
  request: IncomingMessage,
  response: ServerResponse,
  roomId: string
): Promise<void> {
  try {
    assertRateLimit(request, 'global-chat-post');
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const author = typeof body.author === 'string' ? body.author : '';
    const messageBody = typeof body.body === 'string' ? body.body : '';

    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'global_chat_owner_invalid' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    const message = await appendGlobalChatMessage({
      roomId,
      owner,
      author,
      body: messageBody,
      ...(typeof body.signal === 'string' ? { signal: body.signal as 'Green' | 'Yellow' | 'Red' | 'Black' } : {}),
    });

    sendJson(response, 201, { message });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'global_chat_post_failed';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    if (message === 'rate_limit_exceeded') {
      sendJson(response, 429, { error: message });
      return;
    }

    if (message === 'global_chat_author_reserved') {
      sendJson(response, 403, { error: message });
      return;
    }

    if (
      message === 'global_chat_room_not_allowed' ||
      message === 'global_chat_author_invalid' ||
      message === 'global_chat_body_invalid' ||
      message === 'global_chat_owner_invalid'
    ) {
      sendJson(response, 400, { error: message });
      return;
    }

    console.error('[nami-global-chat] post failed', error);
    sendJson(response, 500, { error: 'global_chat_post_failed', message });
  }
}