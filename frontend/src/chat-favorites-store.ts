import { useSyncExternalStore } from 'react';

import {
  fetchChatFavorites,
  isChatFavoritesApiAvailable,
  saveChatFavorites,
  type ChatFavoritesRecord,
} from './chat-favorites-api.js';
import {
  defaultFavoriteRoomIds,
  isGenreChatRoomId,
  validateFavoriteSelection,
} from './chat-room-registry.js';
import { memberPublicChatId } from './member-public-chat.js';
import { getSelfMember, readSignedInOwner } from './member-access.js';
import { createWalletAuthPayload } from './wallet-auth.js';

const LOCAL_FAVORITES_KEY = 'nami.user.chat-favorites';

type ChatFavoritesSnapshot = {
  roomIds: string[];
  activeRoomId: string;
  hydrated: boolean;
  persisted: boolean;
};

const listeners = new Set<() => void>();
let snapshot: ChatFavoritesSnapshot = {
  roomIds: defaultFavoriteRoomIds(getSelfMember().id),
  activeRoomId: defaultFavoriteRoomIds(getSelfMember().id)[0]!,
  hydrated: false,
  persisted: false,
};

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ChatFavoritesSnapshot {
  return snapshot;
}

function readLocalFavorites(memberId: string): ChatFavoritesRecord | null {
  try {
    const stored = window.localStorage.getItem(LOCAL_FAVORITES_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<ChatFavoritesRecord>;

    if (!Array.isArray(parsed.roomIds) || typeof parsed.activeRoomId !== 'string') {
      return null;
    }

    const validationError = validateFavoriteSelection(parsed.roomIds, memberId);

    if (validationError) {
      return null;
    }

    return {
      owner: typeof parsed.owner === 'string' ? parsed.owner : '',
      memberId,
      roomIds: parsed.roomIds,
      activeRoomId: parsed.activeRoomId,
      updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : 0,
    };
  } catch {
    return null;
  }
}

function writeLocalFavorites(record: ChatFavoritesRecord): void {
  window.localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(record));
}

function applyFavorites(record: ChatFavoritesRecord, persisted: boolean): void {
  snapshot = {
    roomIds: record.roomIds,
    activeRoomId: record.activeRoomId,
    hydrated: true,
    persisted,
  };

  emit();
}

export function useChatFavorites(): ChatFavoritesSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export async function hydrateChatFavorites(): Promise<void> {
  const selfMember = getSelfMember();
  const owner = readSignedInOwner();
  const fallback = readLocalFavorites(selfMember.id) ?? {
    owner: owner ?? '',
    memberId: selfMember.id,
    roomIds: defaultFavoriteRoomIds(selfMember.id),
    activeRoomId: defaultFavoriteRoomIds(selfMember.id)[0]!,
    updatedAtMs: 0,
  };

  if (!isChatFavoritesApiAvailable() || !owner?.startsWith('0x')) {
    applyFavorites(fallback, false);
    return;
  }

  try {
    const payload = await fetchChatFavorites(owner, selfMember.id);

    if (!payload) {
      applyFavorites(fallback, false);
      return;
    }

    applyFavorites(payload.favorites, payload.persisted);
    writeLocalFavorites(payload.favorites);
  } catch (error) {
    console.warn('[nami-chat-favorites] hydrate failed', error);
    applyFavorites(fallback, false);
  }
}

async function persistFavorites(record: ChatFavoritesRecord): Promise<void> {
  writeLocalFavorites(record);
  applyFavorites(record, false);

  const owner = readSignedInOwner();

  if (!isChatFavoritesApiAvailable() || !owner?.startsWith('0x')) {
    return;
  }

  try {
    const auth = await createWalletAuthPayload(owner);
    const saved = await saveChatFavorites({
      owner,
      memberId: record.memberId,
      roomIds: record.roomIds,
      activeRoomId: record.activeRoomId,
      ...(auth ? { auth } : {}),
    });

    if (saved) {
      applyFavorites(saved, true);
      writeLocalFavorites(saved);
    }
  } catch (error) {
    console.warn('[nami-chat-favorites] persist failed', error);
  }
}

export function setActiveFavoriteRoom(roomId: string): void {
  if (!snapshot.roomIds.includes(roomId)) {
    return;
  }

  void persistFavorites({
    owner: readSignedInOwner() ?? '',
    memberId: getSelfMember().id,
    roomIds: snapshot.roomIds,
    activeRoomId: roomId,
    updatedAtMs: Date.now(),
  });
}

export function updateFavoriteRooms(roomIds: string[]): { ok: true } | { ok: false; reason: string } {
  const memberId = getSelfMember().id;
  const validationError = validateFavoriteSelection(roomIds, memberId);

  if (validationError) {
    return { ok: false, reason: validationError };
  }

  const activeRoomId = roomIds.includes(snapshot.activeRoomId)
    ? snapshot.activeRoomId
    : roomIds[0]!;

  void persistFavorites({
    owner: readSignedInOwner() ?? '',
    memberId,
    roomIds,
    activeRoomId,
    updatedAtMs: Date.now(),
  });

  return { ok: true };
}

export function toggleGenreFavorite(
  roomId: string
): { ok: true; swappedFrom?: string } | { ok: false; reason: string } {
  const current = snapshot.roomIds;
  const isFavorited = current.includes(roomId);
  const ownRoomId = memberPublicChatId(getSelfMember().id);

  if (isFavorited) {
    const next = current.filter((entry) => entry !== roomId);

    if (!next.includes(ownRoomId)) {
      return { ok: false, reason: 'Your My Chat room must stay pinned.' };
    }

    const result = updateFavoriteRooms(next);

    if (!result.ok) {
      return result;
    }

    return { ok: true };
  }

  const genreFavorites = current.filter((entry) => isGenreChatRoomId(entry));

  if (genreFavorites.length >= 2) {
    const activeId = snapshot.activeRoomId;
    const swapOut = genreFavorites.find((entry) => entry !== activeId) ?? genreFavorites[0]!;
    const withoutSwap = current.filter((entry) => entry !== swapOut);
    const result = updateFavoriteRooms([...withoutSwap, roomId]);

    if (!result.ok) {
      return result;
    }

    return { ok: true, swappedFrom: swapOut };
  }

  const result = updateFavoriteRooms([...current, roomId]);

  if (!result.ok) {
    return result;
  }

  return { ok: true };
}