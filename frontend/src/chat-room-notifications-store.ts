import { useSyncExternalStore } from 'react';

import {
  fetchChatUnreadSummary,
  isChatFavoritesApiAvailable,
  markChatRoomRead,
} from './chat-favorites-api.js';
import { memberPublicChatHostMemberId } from './chat-room-registry.js';
import { memberPublicChatId } from './member-public-chat.js';
import { getSelfMember, readSignedInOwner } from './member-access.js';
import { pushVisitorChatNotification } from './nami-notifications-store.js';
import { createWalletAuthPayload } from './wallet-auth.js';

export type ChatRoomUnreadMap = Record<string, number>;

const listeners = new Set<() => void>();
let unreadByRoom: ChatRoomUnreadMap = {};
let pollHandle: ReturnType<typeof setInterval> | null = null;
const seenVisitorMessageAt = new Map<string, number>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ChatRoomUnreadMap {
  return unreadByRoom;
}

export function useChatRoomUnreadMap(): ChatRoomUnreadMap {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function totalChatRoomUnread(unread: ChatRoomUnreadMap): number {
  return Object.values(unread).reduce((sum, count) => sum + count, 0);
}

async function refreshUnread(roomIds: string[]): Promise<void> {
  const owner = readSignedInOwner();
  const selfMember = getSelfMember();

  if (!isChatFavoritesApiAvailable() || !owner?.startsWith('0x') || roomIds.length === 0) {
    unreadByRoom = {};
    emit();
    return;
  }

  try {
    const summaries = await fetchChatUnreadSummary({
      owner,
      memberId: selfMember.id,
      roomIds,
    });

    const next: ChatRoomUnreadMap = {};

    for (const summary of summaries) {
      next[summary.roomId] = summary.unread;

      const hostMemberId = memberPublicChatHostMemberId(summary.roomId);
      const ownRoomId = memberPublicChatId(selfMember.id);

      if (
        hostMemberId === selfMember.id &&
        summary.roomId === ownRoomId &&
        summary.unread > 0 &&
        summary.latestAtMs
      ) {
        const seenAt = seenVisitorMessageAt.get(summary.roomId) ?? 0;

        if (summary.latestAtMs > seenAt) {
          seenVisitorMessageAt.set(summary.roomId, summary.latestAtMs);
          pushVisitorChatNotification({
            bodyPreview: summary.latestPreview ?? 'New visitor message',
            roomId: summary.roomId,
          });
        }
      }
    }

    unreadByRoom = next;
    emit();
  } catch (error) {
    console.warn('[nami-chat-unread] refresh failed', error);
  }
}

export function startChatRoomUnreadPolling(roomIds: string[]): () => void {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }

  void refreshUnread(roomIds);

  pollHandle = setInterval(() => {
    void refreshUnread(roomIds);
  }, 4000);

  return () => {
    if (pollHandle) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
  };
}

export async function markFavoriteRoomRead(roomId: string): Promise<void> {
  unreadByRoom = {
    ...unreadByRoom,
    [roomId]: 0,
  };

  emit();

  const owner = readSignedInOwner();

  if (!isChatFavoritesApiAvailable() || !owner?.startsWith('0x')) {
    return;
  }

  try {
    const auth = await createWalletAuthPayload(owner);

    await markChatRoomRead({
      owner,
      roomId,
      ...(auth ? { auth } : {}),
    });
  } catch (error) {
    console.warn('[nami-chat-unread] mark read failed', error);
  }
}

