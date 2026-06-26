import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  getChatOverlayRewardsCatalog,
  syncChatOverlayRewardsCatalog,
} from '../services/chat-overlay-rewards.service.js';
import { isOfficialOwnerAddress } from '../services/officials-auth.service.js';
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

export function handleChatOverlayRewardsOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleChatOverlayRewardsGet(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const catalog = await getChatOverlayRewardsCatalog();
  sendJson(response, 200, { catalog });
}

export async function handleChatOverlayRewardsSync(
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

    const rewards = Array.isArray(body.rewards) ? body.rewards : [];
    const catalog = await syncChatOverlayRewardsCatalog({ owner, rewards });
    sendJson(response, 200, { catalog });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sync chat overlay rewards.';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    if (message === 'invalid_art_value' || message === 'invalid_file_size') {
      sendJson(response, 400, {
        error: 'chat_overlay_rewards_sync_failed',
        message,
      });
      return;
    }

    if (message === 'quilt_publish_failed') {
      sendJson(response, 502, {
        error: 'quilt_publish_failed',
        message,
      });
      return;
    }

    sendJson(response, 400, {
      error: 'chat_overlay_rewards_sync_failed',
      message,
    });
  }
}