import { useSyncExternalStore } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import type { GlobalChatRoom } from './global-chats.js';

const STORAGE_KEY = 'nami.owner.moderated-global-chats';

let moderationVersion = 0;

function dispatchModerationChange(): void {
  moderationVersion += 1;
  window.dispatchEvent(new CustomEvent('nami-global-chat-moderation-changed'));
}

function readModeratedChatIds(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return [];
  }
}

function writeModeratedChatIds(chatIds: string[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chatIds));
  dispatchModerationChange();
}

export function isGlobalChatModerated(chatId: string): boolean {
  return readModeratedChatIds().includes(chatId);
}

export function canOfficialOwnerModerateGlobalChat(
  chat: GlobalChatRoom,
  actorOwner: string | null
): boolean {
  if (!isOfficialOwner(actorOwner)) {
    return false;
  }

  if (chat.isOfficial || !chat.closesOnExit) {
    return false;
  }

  return chat.kind === 'temporary';
}

export function moderateDeleteGlobalChat(
  chatId: string,
  actorOwner: string | null
): { ok: true } | { ok: false; reason: string } {
  if (!isOfficialOwner(actorOwner)) {
    return { ok: false, reason: 'Only the official Nami owner can delete community chats.' };
  }

  const moderated = readModeratedChatIds();

  if (!moderated.includes(chatId)) {
    writeModeratedChatIds([chatId, ...moderated]);
  }

  return { ok: true };
}

export function restoreModeratedGlobalChat(
  chatId: string,
  actorOwner: string | null
): { ok: true } | { ok: false; reason: string } {
  if (!isOfficialOwner(actorOwner)) {
    return { ok: false, reason: 'Only the official Nami owner can restore moderated chats.' };
  }

  writeModeratedChatIds(readModeratedChatIds().filter((entry) => entry !== chatId));
  return { ok: true };
}

export function filterModeratedGlobalChats(chats: GlobalChatRoom[]): GlobalChatRoom[] {
  const moderated = new Set(readModeratedChatIds());

  return chats.filter((chat) => !moderated.has(chat.id));
}

function subscribeModerationStore(onStoreChange: () => void): () => void {
  const handleChange = (): void => {
    onStoreChange();
  };

  window.addEventListener('nami-global-chat-moderation-changed', handleChange);

  return () => {
    window.removeEventListener('nami-global-chat-moderation-changed', handleChange);
  };
}

export function useGlobalChatModerationStore(): number {
  return useSyncExternalStore(subscribeModerationStore, () => moderationVersion, () => moderationVersion);
}