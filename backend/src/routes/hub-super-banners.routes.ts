import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  listActiveHubSuperBanners,
  publishHubSuperBanner,
} from '../services/hub-super-banners.service.js';
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

export async function handleHubSuperBannersActiveGet(
  _request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const campaigns = await listActiveHubSuperBanners();
  sendJson(response, 200, { campaigns });
}

export async function handleHubSuperBannersPublishPost(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';

    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    const walletAuth = readWalletAuthFromBody(body);

    await assertWalletAuth(owner, walletAuth);

    const campaign = await publishHubSuperBanner({
      channelId: typeof body.channelId === 'string' ? body.channelId : '',
      coverUrl: typeof body.coverUrl === 'string' ? body.coverUrl : '',
      headline: typeof body.headline === 'string' ? body.headline : '',
      body: typeof body.body === 'string' ? body.body : '',
    });

    sendJson(response, 200, { campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    if (message === 'invalid_super_banner_copy' || message === 'invalid_channel_id') {
      sendJson(response, 400, { error: message });
      return;
    }

    console.error('[nami-hub-super-banners] publish failed', error);
    sendJson(response, 500, { error: 'hub_super_banner_publish_failed', message });
  }
}