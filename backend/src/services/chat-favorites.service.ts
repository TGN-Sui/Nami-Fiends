import { validateFavoriteRoomIds } from '../chat-rooms.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

export type ChatFavoritesRecord = {
  owner: string;
  memberId: string;
  roomIds: string[];
  activeRoomId: string;
  updatedAtMs: number;
};

type ChatFavoritesStore = {
  favorites: ChatFavoritesRecord[];
};

const FAVORITES_PATH = 'data/projections/chat-favorites.json';

function emptyStore(): ChatFavoritesStore {
  return { favorites: [] };
}

async function readStore(): Promise<ChatFavoritesStore> {
  return readJsonFile<ChatFavoritesStore>(FAVORITES_PATH, emptyStore());
}

async function writeStore(store: ChatFavoritesStore): Promise<void> {
  await writeJsonFile(FAVORITES_PATH, store);
}

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

export function defaultFavoriteRoomIds(memberId: string): string[] {
  return ['genre-shooter', 'genre-moba', 'member-public-live-' + memberId];
}

export async function getChatFavorites(owner: string): Promise<ChatFavoritesRecord | null> {
  const store = await readStore();
  const normalized = normalizeOwner(owner);

  return store.favorites.find((row) => row.owner === normalized) ?? null;
}

export type UpsertChatFavoritesInput = {
  owner: string;
  memberId: string;
  roomIds: string[];
  activeRoomId: string;
};

export async function upsertChatFavorites(
  input: UpsertChatFavoritesInput
): Promise<ChatFavoritesRecord> {
  if (!input.owner.startsWith('0x')) {
    throw new Error('invalid_owner');
  }

  const memberId = input.memberId.trim();

  if (!memberId) {
    throw new Error('invalid_member_id');
  }

  const roomIds = validateFavoriteRoomIds(input.roomIds, memberId);
  const activeRoomId = input.activeRoomId.trim();

  if (!roomIds.includes(activeRoomId)) {
    throw new Error('chat_favorites_active_not_favorited');
  }

  const owner = normalizeOwner(input.owner);
  const store = await readStore();
  const index = store.favorites.findIndex((row) => row.owner === owner);
  const now = Date.now();

  const next: ChatFavoritesRecord = {
    owner,
    memberId,
    roomIds,
    activeRoomId,
    updatedAtMs: now,
  };

  if (index >= 0) {
    store.favorites[index] = next;
  } else {
    store.favorites.push(next);
  }

  await writeStore(store);

  return next;
}