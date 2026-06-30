import { readIndexerUrl } from './protocol-env.js';
import { createWalletAuthPayload } from './wallet-auth.js';
import type { ConductSignal } from './uiMockData.js';

export type SharedGlobalChatMessage = {
  id: string;
  roomId: string;
  author: string;
  body: string;
  time: string;
  signal: ConductSignal;
  createdAtMs: number;
  memberId?: string;
};

function apiBaseUrl(): string | null {
  return readIndexerUrl();
}

async function globalChatFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
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

  const payload = (await response.json()) as T & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Global chat request failed.');
  }

  return payload;
}

export function isGlobalChatMessagesApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchSharedGlobalChatMessages(
  roomId: string,
  sinceMs = 0,
  limit = 120
): Promise<SharedGlobalChatMessage[]> {
  const payload = await globalChatFetch<{ messages: SharedGlobalChatMessage[] }>(
    '/api/global-chats/' +
      encodeURIComponent(roomId) +
      '/messages?sinceMs=' +
      encodeURIComponent(String(sinceMs)) +
      '&limit=' +
      encodeURIComponent(String(limit))
  );

  return payload?.messages ?? [];
}

export async function postSharedGlobalChatMessage(input: {
  roomId: string;
  owner: string;
  author: string;
  body: string;
  signal: ConductSignal;
}): Promise<SharedGlobalChatMessage | null> {
  const auth = await createWalletAuthPayload(input.owner);

  const payload = await globalChatFetch<{ message: SharedGlobalChatMessage }>(
    '/api/global-chats/' + encodeURIComponent(input.roomId) + '/messages',
    {
      method: 'POST',
      body: JSON.stringify({
        owner: input.owner,
        auth,
        author: input.author,
        body: input.body,
        signal: input.signal,
      }),
    }
  );

  return payload?.message ?? null;
}