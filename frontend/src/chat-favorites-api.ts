import { readIndexerUrl } from './protocol-env.js';
import type { WalletAuthPayload } from './wallet-auth.js';

export type ChatFavoritesRecord = {
  owner: string;
  memberId: string;
  roomIds: string[];
  activeRoomId: string;
  updatedAtMs: number;
};

export type ChatRoomUnreadSummary = {
  roomId: string;
  unread: number;
  latestPreview: string | null;
  latestAtMs: number | null;
};

export const CHAT_FAVORITE_LIMITS = {
  maxRooms: 8,
  maxGenreRooms: 2,
} as const;

function apiBaseUrl(): string | null {
  return readIndexerUrl();
}

async function chatFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = apiBaseUrl();

  if (!base) {
    return null;
  }

  const response = await fetch(base + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as T & { error?: string; message?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Chat favorites request failed.');
  }

  return payload;
}

export function isChatFavoritesApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchChatFavorites(
  owner: string,
  memberId: string
): Promise<{ favorites: ChatFavoritesRecord; persisted: boolean } | null> {
  const payload = await chatFetch<{ favorites: ChatFavoritesRecord; persisted: boolean }>(
    '/api/chats/favorites?owner=' +
      encodeURIComponent(owner) +
      '&memberId=' +
      encodeURIComponent(memberId)
  );

  return payload;
}

export async function saveChatFavorites(input: {
  owner: string;
  memberId: string;
  roomIds: string[];
  activeRoomId: string;
  auth?: WalletAuthPayload;
}): Promise<ChatFavoritesRecord | null> {
  const payload = await chatFetch<{ favorites: ChatFavoritesRecord }>('/api/chats/favorites', {
    method: 'POST',
    body: JSON.stringify({
      owner: input.owner,
      memberId: input.memberId,
      roomIds: input.roomIds,
      activeRoomId: input.activeRoomId,
      ...(input.auth ? { auth: input.auth } : {}),
    }),
  });

  return payload?.favorites ?? null;
}

export async function fetchChatUnreadSummary(input: {
  owner: string;
  memberId: string;
  roomIds: string[];
}): Promise<ChatRoomUnreadSummary[]> {
  const payload = await chatFetch<{ rooms: ChatRoomUnreadSummary[] }>(
    '/api/chats/unread?owner=' +
      encodeURIComponent(input.owner) +
      '&memberId=' +
      encodeURIComponent(input.memberId) +
      '&roomIds=' +
      encodeURIComponent(input.roomIds.join(','))
  );

  return payload?.rooms ?? [];
}

export async function markChatRoomRead(input: {
  owner: string;
  roomId: string;
  auth?: WalletAuthPayload;
}): Promise<void> {
  await chatFetch<{ roomId: string }>('/api/chats/rooms/' + encodeURIComponent(input.roomId) + '/read', {
    method: 'POST',
    body: JSON.stringify({
      owner: input.owner,
      ...(input.auth ? { auth: input.auth } : {}),
    }),
  });
}