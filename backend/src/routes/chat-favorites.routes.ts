import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  defaultFavoriteRoomIds,
  getChatFavorites,
  upsertChatFavorites,
} from '../services/chat-favorites.service.js';
import {
  assertWalletAuth,
  readWalletAuthFromBody,
  type WalletAuthPayload,
} from '../services/wallet-auth.service.js';
import { markChatRoomRead, summarizeChatUnread } from '../services/chat-read-state.service.js';

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

export async function handleChatFavoritesGet(
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string,
  memberId: string
): Promise<void> {
  if (!owner.startsWith('0x')) {
    sendJson(response, 400, { error: 'invalid_owner' });
    return;
  }

  const normalizedMemberId = memberId.trim();

  if (!normalizedMemberId) {
    sendJson(response, 400, { error: 'invalid_member_id' });
    return;
  }

  const favorites = await getChatFavorites(owner);

  if (!favorites) {
    const roomIds = defaultFavoriteRoomIds(normalizedMemberId);

    sendJson(response, 200, {
      favorites: {
        owner: owner.toLowerCase(),
        memberId: normalizedMemberId,
        roomIds,
        activeRoomId: roomIds[0]!,
        updatedAtMs: 0,
      },
      persisted: false,
    });
    return;
  }

  sendJson(response, 200, { favorites, persisted: true });
}

export async function handleChatFavoritesUpsert(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const memberId = typeof body.memberId === 'string' ? body.memberId : '';
    const activeRoomId = typeof body.activeRoomId === 'string' ? body.activeRoomId : '';
    const roomIds = Array.isArray(body.roomIds)
      ? body.roomIds.filter((entry): entry is string => typeof entry === 'string')
      : [];

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

    const favorites = await upsertChatFavorites({
      owner,
      memberId,
      roomIds,
      activeRoomId,
    });

    sendJson(response, 200, { favorites });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'chat_favorites_upsert_failed';

    if (
      message === 'wallet_auth_required' ||
      message === 'wallet_auth_invalid' ||
      message === 'invalid_owner' ||
      message === 'invalid_member_id' ||
      message.startsWith('chat_favorites_')
    ) {
      sendJson(response, 400, { error: message });
      return;
    }

    console.error('[nami-chat-favorites] upsert failed', error);
    sendJson(response, 500, { error: 'chat_favorites_upsert_failed', message });
  }
}

export async function handleChatUnreadGet(
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string,
  memberId: string,
  roomIds: string[]
): Promise<void> {
  if (!owner.startsWith('0x')) {
    sendJson(response, 400, { error: 'invalid_owner' });
    return;
  }

  const normalizedMemberId = memberId.trim();

  if (!normalizedMemberId || roomIds.length === 0) {
    sendJson(response, 400, { error: 'invalid_unread_query' });
    return;
  }

  const rooms = await summarizeChatUnread({
    owner,
    memberId: normalizedMemberId,
    roomIds,
  });

  sendJson(response, 200, { rooms });
}

export async function handleChatRoomRead(
  request: IncomingMessage,
  response: ServerResponse,
  roomId: string
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

    await markChatRoomRead(owner, roomId);

    sendJson(response, 200, { roomId, readAtMs: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'chat_room_read_failed';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 400, { error: message });
      return;
    }

    console.error('[nami-chat-read] mark read failed', error);
    sendJson(response, 500, { error: 'chat_room_read_failed', message });
  }
}

export function handleChatFavoritesOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}