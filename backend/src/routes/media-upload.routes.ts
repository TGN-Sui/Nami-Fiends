import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  readUploadedMediaFile,
  saveAvatarUpload,
  saveChannelCoverUpload,
} from '../services/media-upload.service.js';
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

export async function handleAvatarUploadPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';
    const walletAuth = readWalletAuth(body);

    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    await assertWalletAuth(owner, {
      owner,
      signature: walletAuth.signature ?? '',
      timestampMs: walletAuth.timestampMs ?? 0,
    });

    const result = await saveAvatarUpload({ owner, contentType, dataBase64 });
    sendJson(response, 201, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    console.error('[nami-media] avatar upload failed', error);
    sendJson(response, 400, {
      error: 'avatar_upload_failed',
      message,
    });
  }
}

export async function handleChannelCoverUploadPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const channelId = typeof body.channelId === 'string' ? body.channelId : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';
    const walletAuth = readWalletAuth(body);

    if (!owner.startsWith('0x') || !channelId.trim()) {
      sendJson(response, 400, { error: 'invalid_payload' });
      return;
    }

    await assertWalletAuth(owner, {
      owner,
      signature: walletAuth.signature ?? '',
      timestampMs: walletAuth.timestampMs ?? 0,
    });

    const result = await saveChannelCoverUpload({ owner, channelId, contentType, dataBase64 });
    sendJson(response, 201, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    console.error('[nami-media] channel cover upload failed', error);
    sendJson(response, 400, {
      error: 'channel_cover_upload_failed',
      message,
    });
  }
}

export async function handleMediaFileGet(
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string,
  filename: string
): Promise<void> {
  const file = await readUploadedMediaFile(owner, filename);

  if (!file) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  response.writeHead(200, {
    'content-type': file.contentType,
    'content-length': file.buffer.byteLength,
    'cache-control': 'public, max-age=3600',
    'access-control-allow-origin': '*',
  });
  response.end(file.buffer);
}