import { useSyncExternalStore } from 'react';

import {
  fetchSharedGlobalChatMessages,
  isGlobalChatMessagesApiAvailable,
  postSharedGlobalChatMessage,
  type SharedGlobalChatMessage,
} from './global-chat-messages-api.js';
import type { ConductSignal } from './uiMockData.js';

const POLL_INTERVAL_MS = 4000;

const listeners = new Set<() => void>();
let syncVersion = 0;
const roomCache = new Map<string, SharedGlobalChatMessage[]>();
const pollHandles = new Map<string, ReturnType<typeof setInterval>>();
const refreshInFlight = new Set<string>();

function emit(): void {
  syncVersion += 1;
  listeners.forEach((listener) => listener());
}

export function useSharedGlobalChatSyncSignal(): number {
  return useSyncExternalStore(
    subscribeSharedGlobalChatMessages,
    () => syncVersion,
    () => 0
  );
}

export function subscribeSharedGlobalChatMessages(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function readSharedGlobalChatMessages(roomId: string): SharedGlobalChatMessage[] {
  return roomCache.get(roomId) ?? [];
}

function mergeMessages(
  current: SharedGlobalChatMessage[],
  incoming: SharedGlobalChatMessage[]
): SharedGlobalChatMessage[] {
  const map = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    map.set(message.id, message);
  }

  return [...map.values()].sort((left, right) => left.createdAtMs - right.createdAtMs);
}

export async function refreshSharedGlobalChatMessages(roomId: string): Promise<void> {
  if (!isGlobalChatMessagesApiAvailable() || refreshInFlight.has(roomId)) {
    return;
  }

  refreshInFlight.add(roomId);

  try {
    const latestCreatedAtMs = readSharedGlobalChatMessages(roomId).at(-1)?.createdAtMs ?? 0;
    const sinceMs = latestCreatedAtMs > 0 ? latestCreatedAtMs - 1 : 0;
    const incoming = await fetchSharedGlobalChatMessages(roomId, sinceMs);

    if (incoming.length === 0 && roomCache.has(roomId)) {
      return;
    }

    const merged =
      sinceMs > 0
        ? mergeMessages(readSharedGlobalChatMessages(roomId), incoming)
        : mergeMessages([], incoming);

    roomCache.set(roomId, merged);
    emit();
  } catch (error) {
    console.warn('[nami-global-chat] refresh failed for ' + roomId, error);
  } finally {
    refreshInFlight.delete(roomId);
  }
}

export function startSharedGlobalChatPolling(roomId: string): () => void {
  if (!isGlobalChatMessagesApiAvailable()) {
    return () => undefined;
  }

  void refreshSharedGlobalChatMessages(roomId);

  const existing = pollHandles.get(roomId);

  if (existing) {
    clearInterval(existing);
  }

  const handle = setInterval(() => {
    void refreshSharedGlobalChatMessages(roomId);
  }, POLL_INTERVAL_MS);

  pollHandles.set(roomId, handle);

  return () => {
    const active = pollHandles.get(roomId);

    if (active) {
      clearInterval(active);
      pollHandles.delete(roomId);
    }
  };
}

export async function sendSharedGlobalChatMessage(input: {
  roomId: string;
  author: string;
  body: string;
  signal: ConductSignal;
  memberId?: string;
}): Promise<SharedGlobalChatMessage | null> {
  if (!isGlobalChatMessagesApiAvailable()) {
    return null;
  }

  const message = await postSharedGlobalChatMessage(input);

  if (message) {
    roomCache.set(input.roomId, mergeMessages(readSharedGlobalChatMessages(input.roomId), [message]));
    emit();
  }

  return message;
}