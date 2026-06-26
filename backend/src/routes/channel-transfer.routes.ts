import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  cancelChannelTransfer,
  createChannelOwnershipTransfer,
  listPendingChannelTransfersForRecipient,
  respondToChannelTransfer,
  type ChannelTransferTargetKind,
} from '../services/channel-transfers.service.js';
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

function mapTransferError(error: unknown): { status: number; code: string } {
  const message = error instanceof Error ? error.message : 'unknown_error';

  if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
    return { status: 401, code: message };
  }

  if (
    message === 'channel_not_found' ||
    message === 'transfer_not_found' ||
    message === 'transfer_not_pending'
  ) {
    return { status: 404, code: message };
  }

  if (
    message === 'not_channel_owner' ||
    message === 'not_transfer_owner' ||
    message === 'transfer_recipient_mismatch'
  ) {
    return { status: 403, code: message };
  }

  return { status: 400, code: message };
}

export function handleChannelTransfersOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleChannelTransfersPendingPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';

    if (!owner.startsWith('0x')) {
      sendJson(response, 401, { error: 'wallet_auth_required' });
      return;
    }

    const walletAuth = readWalletAuthFromBody(body);

    await assertWalletAuth(owner, {
      owner,
      signature: walletAuth.signature ?? '',
      timestampMs: walletAuth.timestampMs ?? 0,
      signerAddress: walletAuth.signerAddress,
    });

    const query: Parameters<typeof listPendingChannelTransfersForRecipient>[0] = {
      owner,
      syncEmail: typeof body.syncEmail === 'string' ? body.syncEmail : '',
      linkedXHandle: typeof body.linkedXHandle === 'string' ? body.linkedXHandle : '',
    };

    if (typeof body.transferId === 'string' && body.transferId.trim() !== '') {
      query.transferId = body.transferId;
    }

    const transfers = await listPendingChannelTransfersForRecipient(query);

    sendJson(response, 200, { transfers });
  } catch (error) {
    const mapped = mapTransferError(error);
    sendJson(response, mapped.status, { error: mapped.code });
  }
}

export async function handleChannelTransfersCreatePost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const channelId = typeof body.channelId === 'string' ? body.channelId : '';
    const targetKind = body.targetKind as ChannelTransferTargetKind;

    if (!owner.startsWith('0x') || !channelId.trim()) {
      sendJson(response, 400, { error: 'invalid_payload' });
      return;
    }

    const walletAuth = readWalletAuthFromBody(body);

    await assertWalletAuth(owner, {
      owner,
      signature: walletAuth.signature ?? '',
      timestampMs: walletAuth.timestampMs ?? 0,
      signerAddress: walletAuth.signerAddress,
    });

    const createInput: Parameters<typeof createChannelOwnershipTransfer>[0] = {
      channelId,
      fromOwner: owner,
      targetKind,
    };

    if (typeof body.targetEmail === 'string' && body.targetEmail.trim() !== '') {
      createInput.targetEmail = body.targetEmail;
    }

    if (typeof body.targetWallet === 'string' && body.targetWallet.trim() !== '') {
      createInput.targetWallet = body.targetWallet;
    }

    if (typeof body.targetXHandle === 'string' && body.targetXHandle.trim() !== '') {
      createInput.targetXHandle = body.targetXHandle;
    }

    const transfer = await createChannelOwnershipTransfer(createInput);

    sendJson(response, 200, { transfer });
  } catch (error) {
    const mapped = mapTransferError(error);
    sendJson(response, mapped.status, { error: mapped.code });
  }
}

export async function handleChannelTransfersRespondPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const transferId = typeof body.transferId === 'string' ? body.transferId : '';
    const decision = body.decision === 'decline' ? 'decline' : 'accept';

    if (!owner.startsWith('0x') || !transferId.trim()) {
      sendJson(response, 400, { error: 'invalid_payload' });
      return;
    }

    const walletAuth = readWalletAuthFromBody(body);

    await assertWalletAuth(owner, {
      owner,
      signature: walletAuth.signature ?? '',
      timestampMs: walletAuth.timestampMs ?? 0,
      signerAddress: walletAuth.signerAddress,
    });

    const transfer = await respondToChannelTransfer({
      transferId,
      responderOwner: owner,
      syncEmail: typeof body.syncEmail === 'string' ? body.syncEmail : '',
      linkedXHandle: typeof body.linkedXHandle === 'string' ? body.linkedXHandle : '',
      decision,
    });

    sendJson(response, 200, { transfer });
  } catch (error) {
    const mapped = mapTransferError(error);
    sendJson(response, mapped.status, { error: mapped.code });
  }
}

export async function handleChannelTransfersCancelPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const transferId = typeof body.transferId === 'string' ? body.transferId : '';

    if (!owner.startsWith('0x') || !transferId.trim()) {
      sendJson(response, 400, { error: 'invalid_payload' });
      return;
    }

    const walletAuth = readWalletAuthFromBody(body);

    await assertWalletAuth(owner, {
      owner,
      signature: walletAuth.signature ?? '',
      timestampMs: walletAuth.timestampMs ?? 0,
      signerAddress: walletAuth.signerAddress,
    });

    const transfer = await cancelChannelTransfer({
      transferId,
      fromOwner: owner,
    });

    sendJson(response, 200, { transfer });
  } catch (error) {
    const mapped = mapTransferError(error);
    sendJson(response, mapped.status, { error: mapped.code });
  }
}