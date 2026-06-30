import { isAllowedChatRoomId } from '../chat-rooms.js';
import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

export type GlobalChatConductSignal = 'Green' | 'Yellow' | 'Red' | 'Black';

export type StoredGlobalChatMessage = {
  id: string;
  roomId: string;
  author: string;
  body: string;
  time: string;
  signal: GlobalChatConductSignal;
  createdAtMs: number;
  memberId?: string;
};

export type GlobalChatMessagesProjection = {
  rooms: Record<string, StoredGlobalChatMessage[]>;
  updatedAtMs: number;
};

const PROJECTION_PATH = 'data/projections/global-chat-messages.json';
const MAX_MESSAGES_PER_ROOM = 500;
const MAX_BODY_LENGTH = 2000;
const MAX_AUTHOR_LENGTH = 64;

function emptyProjection(): GlobalChatMessagesProjection {
  return {
    rooms: {},
    updatedAtMs: Date.now(),
  };
}

export function isAllowedGlobalChatRoomId(roomId: string): boolean {
  return isAllowedChatRoomId(roomId);
}

async function readProjection(): Promise<GlobalChatMessagesProjection> {
  const stored = await readJsonFile<GlobalChatMessagesProjection>(PROJECTION_PATH, emptyProjection());

  return {
    rooms:
      typeof stored.rooms === 'object' && stored.rooms !== null && !Array.isArray(stored.rooms)
        ? stored.rooms
        : {},
    updatedAtMs: typeof stored.updatedAtMs === 'number' ? stored.updatedAtMs : Date.now(),
  };
}

async function writeProjection(projection: GlobalChatMessagesProjection): Promise<void> {
  await writeJsonFile(PROJECTION_PATH, {
    ...projection,
    updatedAtMs: Date.now(),
  });
}

function formatMessageTime(createdAtMs: number): string {
  const date = new Date(createdAtMs);

  return (
    date.getHours().toString().padStart(2, '0') +
    ':' +
    date.getMinutes().toString().padStart(2, '0')
  );
}

function normalizeSignal(value: unknown): GlobalChatConductSignal {
  if (value === 'Yellow' || value === 'Red' || value === 'Black') {
    return value;
  }

  return 'Green';
}

export async function listGlobalChatMessages(input: {
  roomId: string;
  sinceMs?: number;
  limit?: number;
}): Promise<StoredGlobalChatMessage[]> {
  if (!isAllowedGlobalChatRoomId(input.roomId)) {
    throw new Error('global_chat_room_not_allowed');
  }

  const projection = await readProjection();
  const messages = projection.rooms[input.roomId] ?? [];
  const sinceMs = typeof input.sinceMs === 'number' && input.sinceMs > 0 ? input.sinceMs : 0;
  const limit = Math.min(Math.max(input.limit ?? 120, 1), 200);

  return messages
    .filter((message) => message.createdAtMs > sinceMs)
    .slice(-limit);
}

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

export function assertGlobalChatAuthorAllowed(owner: string, author: string): void {
  const normalizedAuthor = author.trim().toLowerCase();
  const officialNodename = (process.env.NAMI_OFFICIAL_NODENAME ?? '').trim().toLowerCase();
  const reserved =
    normalizedAuthor === 'fiend' ||
    (officialNodename.length > 0 && normalizedAuthor === officialNodename);

  if (!reserved) {
    return;
  }

  if (normalizeOwner(owner) !== normalizeOwner(config.officialOwner)) {
    throw new Error('global_chat_author_reserved');
  }
}

export async function appendGlobalChatMessage(input: {
  roomId: string;
  owner: string;
  author: string;
  body: string;
  signal?: GlobalChatConductSignal;
  memberId?: string;
}): Promise<StoredGlobalChatMessage> {
  if (!isAllowedGlobalChatRoomId(input.roomId)) {
    throw new Error('global_chat_room_not_allowed');
  }

  if (!input.owner.startsWith('0x')) {
    throw new Error('global_chat_owner_invalid');
  }

  const author = input.author.trim();

  if (author.length === 0 || author.length > MAX_AUTHOR_LENGTH) {
    throw new Error('global_chat_author_invalid');
  }

  assertGlobalChatAuthorAllowed(input.owner, author);

  const body = input.body.trim();

  if (body.length === 0 || body.length > MAX_BODY_LENGTH) {
    throw new Error('global_chat_body_invalid');
  }

  const projection = await readProjection();
  const createdAtMs = Date.now();
  const message: StoredGlobalChatMessage = {
    id: 'gc-' + input.roomId + '-' + createdAtMs + '-' + Math.random().toString(36).slice(2, 8),
    roomId: input.roomId,
    author,
    body,
    time: formatMessageTime(createdAtMs),
    signal: normalizeSignal(input.signal),
    createdAtMs,
    memberId: normalizeOwner(input.owner),
  };

  const roomMessages = [...(projection.rooms[input.roomId] ?? []), message].slice(-MAX_MESSAGES_PER_ROOM);

  await writeProjection({
    ...projection,
    rooms: {
      ...projection.rooms,
      [input.roomId]: roomMessages,
    },
  });

  return message;
}