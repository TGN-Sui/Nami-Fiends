import type { IncomingMessage, ServerResponse } from 'node:http';

import type { ProjectionRegistry } from '../projection-registry.js';
import { buildLinkedProfile } from '../services/linked-profile.service.js';
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

export function handleLinkedProfileOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleLinkedProfileGet(
  registry: ProjectionRegistry,
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string
): Promise<void> {
  const linked = await buildLinkedProfile(registry, owner);

  if (!linked) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { linkedProfile: linked });
}

export async function handleLinkedProfileSync(
  registry: ProjectionRegistry,
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

    const walletAuth = readWalletAuthFromBody(body);

    await assertWalletAuth(owner, {
      owner,
      signature: walletAuth.signature ?? '',
      timestampMs: walletAuth.timestampMs ?? 0,
      signerAddress: walletAuth.signerAddress,
    });

    const linked = await buildLinkedProfile(registry, owner, { verifiedRequest: true });

    if (!linked) {
      sendJson(response, 404, { error: 'not_found' });
      return;
    }

    sendJson(response, 200, { linkedProfile: linked });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    console.error('[nami-linked-profile] sync failed', error);
    sendJson(response, 500, {
      error: 'linked_profile_sync_failed',
      message,
    });
  }
}