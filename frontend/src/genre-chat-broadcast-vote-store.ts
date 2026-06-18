import { useSyncExternalStore } from 'react';

import {
  expandedGenreAudienceSize,
  genreBroadcastsForChat,
  genreVoteMajorityNeeded,
  type GenreChatBroadcast,
} from './genre-chat-broadcasts.js';
import type { GlobalChatRoom } from './global-chats.js';

export type GenreBroadcastVoteChoice = 'skip' | 'watch';

export type GenreBroadcastVoteSnapshot = {
  chatId: string;
  streamIndex: number;
  broadcasts: GenreChatBroadcast[];
  activeBroadcast: GenreChatBroadcast | null;
  skipVotes: number;
  watchVotes: number;
  selfVote: GenreBroadcastVoteChoice | null;
  audienceSize: number;
  majorityNeeded: number;
  slotEndsAt: number;
  slotRemainingMs: number;
  isExpanded: boolean;
};

const BROADCAST_SLOT_MS = 10 * 60 * 1000;
const TICK_MS = 1000;
const CROWD_VOTE_INTERVAL_MS = 9000;

type VoteSession = {
  chatId: string;
  activeMembers: number;
  streamIndex: number;
  skipVotes: number;
  watchVotes: number;
  selfVotes: Record<string, GenreBroadcastVoteChoice>;
  ambientSkip: number;
  ambientWatch: number;
  slotEndsAt: number;
  isExpanded: boolean;
  crowdTimer: number | null;
  tickTimer: number | null;
};

const sessions = new Map<string, VoteSession>();
const listeners = new Set<() => void>();
const snapshotCache = new Map<string, GenreBroadcastVoteSnapshot>();

function snapshotKey(chatId: string, voterId: string): string {
  return chatId + '::' + voterId;
}

function invalidateSnapshots(): void {
  snapshotCache.clear();
}

function emit(): void {
  invalidateSnapshots();

  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function ensureSession(chat: GlobalChatRoom): VoteSession {
  const existing = sessions.get(chat.id);

  if (existing) {
    existing.activeMembers = chat.activeMembers;
    return existing;
  }

  const session: VoteSession = {
    chatId: chat.id,
    activeMembers: chat.activeMembers,
    streamIndex: 0,
    skipVotes: 0,
    watchVotes: 0,
    selfVotes: {},
    ambientSkip: 0,
    ambientWatch: 0,
    slotEndsAt: Date.now() + BROADCAST_SLOT_MS,
    isExpanded: false,
    crowdTimer: null,
    tickTimer: null,
  };

  sessions.set(chat.id, session);
  return session;
}

function broadcastsForSession(session: VoteSession, chat: GlobalChatRoom): GenreChatBroadcast[] {
  return genreBroadcastsForChat(chat);
}

function activeBroadcastForSession(session: VoteSession, chat: GlobalChatRoom): GenreChatBroadcast | null {
  const broadcasts = broadcastsForSession(session, chat);

  if (broadcasts.length === 0) {
    return null;
  }

  return broadcasts[session.streamIndex % broadcasts.length] ?? null;
}

function resetVoteCounts(session: VoteSession): void {
  session.skipVotes = 0;
  session.watchVotes = 0;
  session.selfVotes = {};
  session.ambientSkip = 0;
  session.ambientWatch = 0;
}

function syncAggregateVotes(session: VoteSession): void {
  let skip = session.ambientSkip;
  let watch = session.ambientWatch;

  for (const vote of Object.values(session.selfVotes)) {
    if (vote === 'skip') {
      skip += 1;
    } else {
      watch += 1;
    }
  }

  session.skipVotes = skip;
  session.watchVotes = watch;
}

function audienceSizeForSession(session: VoteSession): number {
  return expandedGenreAudienceSize(session.activeMembers);
}

function majorityNeededForSession(session: VoteSession): number {
  return genreVoteMajorityNeeded(audienceSizeForSession(session));
}

function advanceBroadcast(session: VoteSession, chat: GlobalChatRoom): void {
  const broadcasts = broadcastsForSession(session, chat);

  if (broadcasts.length === 0) {
    return;
  }

  session.streamIndex = (session.streamIndex + 1) % broadcasts.length;
  resetVoteCounts(session);
  session.slotEndsAt = Date.now() + BROADCAST_SLOT_MS;
}

function extendBroadcastSlot(session: VoteSession): void {
  session.slotEndsAt = Date.now() + BROADCAST_SLOT_MS;
}

function evaluateMajoritySkip(session: VoteSession, chat: GlobalChatRoom): boolean {
  if (session.skipVotes >= majorityNeededForSession(session)) {
    advanceBroadcast(session, chat);
    return true;
  }

  return false;
}

function evaluateSlotExpiry(session: VoteSession, chat: GlobalChatRoom): void {
  if (Date.now() < session.slotEndsAt) {
    return;
  }

  if (session.watchVotes > session.skipVotes) {
    extendBroadcastSlot(session);
    return;
  }

  advanceBroadcast(session, chat);
}

function stopTimers(session: VoteSession): void {
  if (session.crowdTimer !== null) {
    window.clearInterval(session.crowdTimer);
    session.crowdTimer = null;
  }

  if (session.tickTimer !== null) {
    window.clearInterval(session.tickTimer);
    session.tickTimer = null;
  }
}

function startTimers(session: VoteSession, chat: GlobalChatRoom): void {
  const broadcasts = broadcastsForSession(session, chat);

  if (broadcasts.length === 0) {
    stopTimers(session);
    return;
  }

  if (session.tickTimer === null) {
    session.tickTimer = window.setInterval(() => {
      evaluateSlotExpiry(session, chat);
      emit();
    }, TICK_MS);
  }

  if (session.crowdTimer === null) {
    session.crowdTimer = window.setInterval(() => {
      const currentBroadcasts = broadcastsForSession(session, chat);

      if (currentBroadcasts.length === 0) {
        stopTimers(session);
        emit();
        return;
      }

      const audience = audienceSizeForSession(session);
      const selfCount = Object.keys(session.selfVotes).length;
      const ambientTotal = session.ambientSkip + session.ambientWatch;

      if (selfCount + ambientTotal >= audience) {
        return;
      }

      const seed = session.chatId.charCodeAt(0) + session.streamIndex + ambientTotal;
      const pickSkip = seed % 3 !== 0;

      if (pickSkip) {
        session.ambientSkip += 1;
      } else {
        session.ambientWatch += 1;
      }

      syncAggregateVotes(session);
      evaluateMajoritySkip(session, chat);
      emit();
    }, CROWD_VOTE_INTERVAL_MS);
  }
}

export function setGenreBroadcastExpanded(chat: GlobalChatRoom, expanded: boolean): void {
  const session = ensureSession(chat);
  session.activeMembers = chat.activeMembers;
  session.isExpanded = expanded;

  if (expanded) {
    startTimers(session, chat);
  } else {
    stopTimers(session);
  }

  emit();
}

export function castGenreBroadcastVote(
  chat: GlobalChatRoom,
  voterId: string,
  choice: GenreBroadcastVoteChoice
): void {
  const session = ensureSession(chat);

  if (broadcastsForSession(session, chat).length === 0) {
    return;
  }

  const previous = session.selfVotes[voterId];

  if (previous === choice) {
    return;
  }

  session.selfVotes[voterId] = choice;
  syncAggregateVotes(session);
  evaluateMajoritySkip(session, chat);
  emit();
}

function buildSnapshot(chat: GlobalChatRoom, voterId: string): GenreBroadcastVoteSnapshot {
  const session = ensureSession(chat);
  const selfVote = session.selfVotes[voterId] ?? null;

  return {
    chatId: chat.id,
    streamIndex: session.streamIndex,
    broadcasts: broadcastsForSession(session, chat),
    activeBroadcast: activeBroadcastForSession(session, chat),
    skipVotes: session.skipVotes,
    watchVotes: session.watchVotes,
    selfVote,
    audienceSize: audienceSizeForSession(session),
    majorityNeeded: majorityNeededForSession(session),
    slotEndsAt: session.slotEndsAt,
    slotRemainingMs: Math.max(0, session.slotEndsAt - Date.now()),
    isExpanded: session.isExpanded,
  };
}

function getSnapshot(chat: GlobalChatRoom, voterId: string): GenreBroadcastVoteSnapshot {
  const key = snapshotKey(chat.id, voterId);
  const cached = snapshotCache.get(key);

  if (cached) {
    return cached;
  }

  const snapshot = buildSnapshot(chat, voterId);
  snapshotCache.set(key, snapshot);
  return snapshot;
}

export function readGenreBroadcastVoteSnapshot(
  chat: GlobalChatRoom,
  voterId: string
): GenreBroadcastVoteSnapshot {
  return getSnapshot(chat, voterId);
}

export function useGenreBroadcastVote(chat: GlobalChatRoom, voterId: string): GenreBroadcastVoteSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(chat, voterId),
    () => getSnapshot(chat, voterId)
  );
}

export function formatBroadcastCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

export function notifyGenreBroadcastVoteListenersForTests(): void {
  emit();
}

export function resetGenreBroadcastVoteStoreForTests(): void {
  for (const session of sessions.values()) {
    stopTimers(session);
  }

  sessions.clear();
  snapshotCache.clear();
  listeners.clear();
}