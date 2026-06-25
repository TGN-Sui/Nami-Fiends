import { useSyncExternalStore } from 'react';

import type { GlobalChatRoom } from './global-chats.js';
import {
  canMemberOpenAnotherTemporaryChat,
  isUserOwnedTemporaryChat,
  MAX_MEMBER_TEMPORARY_GLOBAL_CHATS,
} from './global-chat-room-limits.js';

const STORAGE_KEY = 'nami.user.temporary-global-chats';

const listeners = new Set<() => void>();
let cachedChats: GlobalChatRoom[] | null = null;

function emit(): void {
  cachedChats = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStoredChats(): GlobalChatRoom[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is GlobalChatRoom =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.id === 'string' &&
        entry.kind === 'temporary' &&
        entry.closesOnExit === true
    );
  } catch {
    return [];
  }
}

function writeStoredChats(chats: GlobalChatRoom[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  emit();
}

function getSnapshot(): GlobalChatRoom[] {
  if (!cachedChats) {
    cachedChats = readStoredChats();
  }

  return cachedChats;
}

export function useMemberTemporaryGlobalChats(): GlobalChatRoom[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function readMemberTemporaryGlobalChats(): GlobalChatRoom[] {
  return readStoredChats();
}

export type CreateTemporaryGlobalChatResult =
  | { ok: true; chat: GlobalChatRoom }
  | { ok: false; reason: 'cap_reached' | 'invalid_title' };

export function createMemberTemporaryGlobalChat(input: {
  title: string;
  voiceEnabled: boolean;
  creatorName: string;
}): CreateTemporaryGlobalChatResult {
  const title = input.title.trim();

  if (!title) {
    return { ok: false, reason: 'invalid_title' };
  }

  const existing = readStoredChats();

  if (!canMemberOpenAnotherTemporaryChat(existing, input.creatorName)) {
    return { ok: false, reason: 'cap_reached' };
  }

  const created: GlobalChatRoom = {
    id: 'temp-' + Date.now(),
    title,
    kind: 'temporary',
    createdBy: input.creatorName,
    creatorVerified: true,
    activeMembers: 1,
    voiceEnabled: input.voiceEnabled,
    isOfficial: false,
    closesOnExit: true,
  };

  writeStoredChats([created, ...existing]);

  return { ok: true, chat: created };
}

export function removeMemberTemporaryGlobalChat(chatId: string): void {
  writeStoredChats(readStoredChats().filter((chat) => chat.id !== chatId));
}

export function resetMemberTemporaryGlobalChatsForTests(chats: GlobalChatRoom[] = []): void {
  writeStoredChats(chats);
}

export function memberTemporaryChatCapMessage(
  memberName: string,
  chats: readonly GlobalChatRoom[] = readStoredChats(),
  maxRooms = MAX_MEMBER_TEMPORARY_GLOBAL_CHATS
): string {
  const openCount = chats.filter((chat) => isUserOwnedTemporaryChat(chat, memberName)).length;

  return (
    'Elite members can keep up to ' +
    maxRooms +
    ' open lounges. You have ' +
    openCount +
    ' — end one before creating another.'
  );
}