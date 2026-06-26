import type { IncomingMessage, ServerResponse } from 'node:http';

import { isOfficialOwnerAddress } from '../services/officials-auth.service.js';
import {
  getPlatformOwnerAssets,
  syncPlatformOwnerAssets,
} from '../services/platform-owner-assets.service.js';
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

export function handlePlatformOwnerAssetsOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handlePlatformOwnerAssetsGet(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const projection = await getPlatformOwnerAssets();
  sendJson(response, 200, { assets: projection });
}

export async function handlePlatformOwnerAssetsSync(
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

    if (!isOfficialOwnerAddress(owner)) {
      sendJson(response, 403, { error: 'official_owner_required' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    const assets =
      typeof body.assets === 'object' && body.assets !== null
        ? (body.assets as Record<string, string>)
        : {};

    const projection = await syncPlatformOwnerAssets({ owner, assets });
    sendJson(response, 200, { assets: projection });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sync platform owner assets.';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    sendJson(response, 400, {
      error: 'platform_owner_assets_sync_failed',
      message,
    });
  }
}