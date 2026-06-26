import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  getMemberCosmeticEquips,
  syncMemberCosmeticEquip,
} from '../services/member-cosmetic-equips.service.js';
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

export function handleMemberCosmeticEquipsOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleMemberCosmeticEquipsGet(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const equips = await getMemberCosmeticEquips();
  sendJson(response, 200, { equips });
}

export async function handleMemberCosmeticEquipSync(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const memberId = typeof body.memberId === 'string' ? body.memberId : '';
    const chatOverlayDisplay =
      typeof body.chatOverlayDisplay === 'string' ? body.chatOverlayDisplay : '';
    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    const equips = await syncMemberCosmeticEquip({ memberId, chatOverlayDisplay });
    sendJson(response, 200, { equips });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sync cosmetic equip.';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    if (
      message === 'invalid_member_id' ||
      message === 'invalid_overlay_id' ||
      message === 'overlay_not_found' ||
      message === 'overlay_disabled'
    ) {
      sendJson(response, 400, { error: message });
      return;
    }

    sendJson(response, 400, {
      error: 'member_cosmetic_equip_sync_failed',
      message,
    });
  }
}