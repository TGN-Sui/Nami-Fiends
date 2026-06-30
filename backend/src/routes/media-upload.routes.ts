import type { IncomingMessage, ServerResponse } from 'node:http';

import { config } from '../config.js';
import {
  readUploadedMediaFile,
  saveAvatarUpload,
  saveChannelCoverUpload,
  saveStudioLogoUpload,
} from '../services/media-upload.service.js';
import { assertRateLimit } from '../services/rate-limit.service.js';
import {
  assertWalletAuthFromBody,
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

export async function handleAvatarUploadPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    assertRateLimit(request, 'media-avatar-upload');
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';
    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    const result = await saveAvatarUpload({ owner, contentType, dataBase64 });
    sendJson(response, 201, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    if (message === 'rate_limit_exceeded') {
      sendJson(response, 429, { error: message });
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
    assertRateLimit(request, 'media-channel-cover-upload');
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const channelId = typeof body.channelId === 'string' ? body.channelId : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';
    if (!owner.startsWith('0x') || !channelId.trim()) {
      sendJson(response, 400, { error: 'invalid_payload' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    const { assertChannelOwnerWallet } = await import('../services/channel-ownership.service.js');
    await assertChannelOwnerWallet(channelId, owner);

    const result = await saveChannelCoverUpload({ owner, channelId, contentType, dataBase64 });
    sendJson(response, 201, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    if (message === 'channel_not_found' || message === 'not_channel_owner') {
      sendJson(response, 403, { error: message });
      return;
    }

    if (message === 'rate_limit_exceeded') {
      sendJson(response, 429, { error: message });
      return;
    }

    console.error('[nami-media] channel cover upload failed', error);
    sendJson(response, 400, {
      error: 'channel_cover_upload_failed',
      message,
    });
  }
}

export async function handleStudioLogoUploadPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    assertRateLimit(request, 'media-studio-logo-upload');
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const studioId = typeof body.studioId === 'string' ? body.studioId : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';
    if (!owner.startsWith('0x') || !studioId.trim()) {
      sendJson(response, 400, { error: 'invalid_payload' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    const { assertStudioOwnerWallet } = await import('../services/studio-preferences.service.js');
    await assertStudioOwnerWallet(studioId, owner);

    const result = await saveStudioLogoUpload({ owner, studioId, contentType, dataBase64 });
    sendJson(response, 201, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    if (message === 'not_studio_owner') {
      sendJson(response, 403, { error: message });
      return;
    }

    if (message === 'rate_limit_exceeded') {
      sendJson(response, 429, { error: message });
      return;
    }

    console.error('[nami-media] studio logo upload failed', error);
    sendJson(response, 400, {
      error: 'studio_logo_upload_failed',
      message,
    });
  }
}

function isLegacyBorderArtFilename(filename: string): boolean {
  return filename.startsWith('border-art-');
}

export async function handleMediaFileGet(
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string,
  filename: string
): Promise<void> {
  if (isLegacyBorderArtFilename(filename) && config.walrus.borderArtRequired) {
    sendJson(response, 410, {
      error: 'border_art_legacy_media_retired',
      message:
        'Border art is served from Walrus aggregator URLs. Re-publish the catalog quilt or migrate legacy files.',
    });
    return;
  }

  const file = await readUploadedMediaFile(owner, filename);

  if (!file) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  const cacheControl = isLegacyBorderArtFilename(filename)
    ? 'public, max-age=300, stale-while-revalidate=60'
    : 'public, max-age=3600';

  response.writeHead(200, {
    'content-type': file.contentType,
    'content-length': file.buffer.byteLength,
    'cache-control': cacheControl,
    'access-control-allow-origin': '*',
    ...(isLegacyBorderArtFilename(filename)
      ? { 'x-nami-legacy-media': 'border-art' }
      : {}),
  });
  response.end(file.buffer);
}