import {
  isMemberPublicChatRoomId,
  memberPublicChatHostMemberId,
} from '../chat-rooms.js';
import { readJsonFile, writeJsonFile } from '../storage.js';
import { listGlobalChatMessages } from './global-chat-messages.service.js';

export type ChatRoomUnread = {
  roomId: string;
  unread: number;
  latestPreview: string | null;
  latestAtMs: number | null;
};

type ChatReadStateRecord = {
  owner: string;
  rooms: Record<string, number>;
  updatedAtMs: number;
};

type ChatReadStateStore = {
  states: ChatReadStateRecord[];
};

const READ_STATE_PATH = 'data/projections/chat-read-state.json';

function emptyStore(): ChatReadStateStore {
  return { states: [] };
}

async function readStore(): Promise<ChatReadStateStore> {
  return readJsonFile<ChatReadStateStore>(READ_STATE_PATH, emptyStore());
}

async function writeStore(store: ChatReadStateStore): Promise<void> {
  await writeJsonFile(READ_STATE_PATH, store);
}

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

async function readState(owner: string): Promise<ChatReadStateRecord> {
  const store = await readStore();
  const normalized = normalizeOwner(owner);
  const existing = store.states.find((row) => row.owner === normalized);

  if (existing) {
    return existing;
  }

  return {
    owner: normalized,
    rooms: {},
    updatedAtMs: Date.now(),
  };
}

async function writeState(record: ChatReadStateRecord): Promise<void> {
  const store = await readStore();
  const index = store.states.findIndex((row) => row.owner === record.owner);

  if (index >= 0) {
    store.states[index] = record;
  } else {
    store.states.push(record);
  }

  await writeStore(store);
}

export async function markChatRoomRead(owner: string, roomId: string): Promise<void> {
  const record = await readState(owner);

  record.rooms[roomId] = Date.now();
  record.updatedAtMs = Date.now();

  await writeState(record);
}

async function countUnreadInRoom(input: {
  roomId: string;
  memberId: string;
  lastReadAtMs: number;
}): Promise<ChatRoomUnread> {
  const messages = await listGlobalChatMessages({
    roomId: input.roomId,
    sinceMs: input.lastReadAtMs,
    limit: 200,
  });

  const hostMemberId = memberPublicChatHostMemberId(input.roomId);
  const relevant = messages.filter((message) => {
    if (message.memberId && message.memberId === input.memberId) {
      return false;
    }

    if (hostMemberId && hostMemberId === input.memberId) {
      return true;
    }

    return message.createdAtMs > input.lastReadAtMs;
  });

  const latest = relevant.at(-1) ?? messages.at(-1);

  return {
    roomId: input.roomId,
    unread: relevant.length,
    latestPreview: latest ? latest.body.slice(0, 120) : null,
    latestAtMs: latest?.createdAtMs ?? null,
  };
}

export async function summarizeChatUnread(input: {
  owner: string;
  memberId: string;
  roomIds: string[];
}): Promise<ChatRoomUnread[]> {
  const record = await readState(input.owner);
  const summaries: ChatRoomUnread[] = [];

  for (const roomId of input.roomIds) {
    const lastReadAtMs = record.rooms[roomId] ?? 0;
    summaries.push(
      await countUnreadInRoom({
        roomId,
        memberId: input.memberId,
        lastReadAtMs,
      })
    );
  }

  return summaries;
}

export function shouldNotifyHostForMessage(roomId: string, senderMemberId: string | undefined): boolean {
  if (!isMemberPublicChatRoomId(roomId)) {
    return false;
  }

  const hostMemberId = memberPublicChatHostMemberId(roomId);

  if (!hostMemberId || !senderMemberId) {
    return Boolean(hostMemberId && senderMemberId && hostMemberId !== senderMemberId);
  }

  return hostMemberId !== senderMemberId;
}