import type { IncomingMessage, ServerResponse } from 'node:http';

import type { ProjectionRegistry } from '../projection-registry.js';
import {
  assertCanPublishSuperBanner,
  recordSuperBannerSend,
} from '../services/hub-super-banner-gate.service.js';
import {
  listActiveHubSuperBanners,
  publishHubSuperBanner,
} from '../services/hub-super-banners.service.js';
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

export async function handleHubSuperBannersActiveGet(
  _request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const campaigns = await listActiveHubSuperBanners();
  sendJson(response, 200, { campaigns });
}

export async function handleHubSuperBannersActivatePost(
  _registry: ProjectionRegistry,
  _request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  sendJson(response, 403, {
    error: 'super_banner_activate_requires_payment',
    message: 'Super Banner entitlement unlocks only after promotion payment fulfillment.',
  });
}

export async function handleHubSuperBannersPublishPost(
  registry: ProjectionRegistry,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const channelId = typeof body.channelId === 'string' ? body.channelId : '';

    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    if (!channelId.trim()) {
      sendJson(response, 400, { error: 'invalid_channel_id' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    await assertCanPublishSuperBanner({
      registry,
      channelId,
      owner,
    });

    const campaign = await publishHubSuperBanner({
      channelId,
      coverUrl: typeof body.coverUrl === 'string' ? body.coverUrl : '',
      headline: typeof body.headline === 'string' ? body.headline : '',
      body: typeof body.body === 'string' ? body.body : '',
    });

    await recordSuperBannerSend(channelId);

    sendJson(response, 200, { campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    if (
      message === 'channel_not_found' ||
      message === 'not_channel_owner' ||
      message === 'super_banner_not_entitled' ||
      message === 'super_banner_entitlement_expired' ||
      message === 'super_banner_daily_limit'
    ) {
      sendJson(response, 403, { error: message });
      return;
    }

    if (
      message === 'invalid_super_banner_copy' ||
      message === 'invalid_channel_id' ||
      message === 'invalid_super_banner_cover'
    ) {
      sendJson(response, 400, { error: message });
      return;
    }

    console.error('[nami-hub-super-banners] publish failed', error);
    sendJson(response, 500, { error: 'hub_super_banner_publish_failed', message });
  }
}