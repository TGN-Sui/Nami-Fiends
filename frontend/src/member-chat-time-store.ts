import { useEffect, useSyncExternalStore } from 'react';

import { currentBoostWeekId } from './channel-boost-store.js';

const STORAGE_KEY = 'nami.member.chat-time';
const CHAT_TIME_TICK_MS = 30_000;
const ACTIVE_CHAT_WINDOW_MS = 5 * 60 * 1000;

export type MemberChatPresence = {
  chatId: string;
  chatTitle: string;
  surfaceLabel: string;
  channelId?: string;
  isActiveNow: boolean;
  hoursThisWeek: number;
};

export type ChatTimeTarget = {
  chatId: string;
  chatTitle: string;
  surfaceLabel: string;
  channelId?: string;
};

export type ChatTimeRecord = ChatTimeTarget & {
  totalMs: number;
  weekKey: string;
  weekMs: number;
  lastSeenAtMs: number;
};

type ChatTimeRegistry = Record<string, ChatTimeRecord[]>;

const listeners = new Set<() => void>();
let storeVersion = 0;
let activeChatSession: { memberId: string; chatId: string } | null = null;

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-member-chat-time-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function currentWeekKey(now = Date.now()): string {
  return String(currentBoostWeekId(new Date(now)));
}

function readRegistry(): ChatTimeRegistry {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as ChatTimeRegistry;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function writeRegistry(registry: ChatTimeRegistry): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  emit();
}

export function setActiveMemberChat(memberId: string, chatId: string | null): void {
  activeChatSession = chatId ? { memberId, chatId } : null;
  emit();
}

export function readActiveMemberChatId(memberId: string): string | null {
  if (activeChatSession?.memberId === memberId) {
    return activeChatSession.chatId;
  }

  return null;
}

export function readMemberChatTimeRecords(memberId: string): ChatTimeRecord[] {
  return readRegistry()[memberId] ?? [];
}

export function recordMemberChatTime(
  memberId: string,
  target: ChatTimeTarget,
  deltaMs: number,
  now = Date.now()
): void {
  if (deltaMs <= 0) {
    return;
  }

  const registry = readRegistry();
  const entries = [...(registry[memberId] ?? [])];
  const weekKey = currentWeekKey(now);
  const existingIndex = entries.findIndex((entry) => entry.chatId === target.chatId);

  if (existingIndex >= 0) {
    const existing = entries[existingIndex]!;
    const weekMs = existing.weekKey === weekKey ? existing.weekMs + deltaMs : deltaMs;

    entries[existingIndex] = {
      ...existing,
      chatTitle: target.chatTitle,
      surfaceLabel: target.surfaceLabel,
      ...(target.channelId ? { channelId: target.channelId } : {}),
      totalMs: existing.totalMs + deltaMs,
      weekKey,
      weekMs,
      lastSeenAtMs: now,
    };
  } else {
    entries.push({
      chatId: target.chatId,
      chatTitle: target.chatTitle,
      surfaceLabel: target.surfaceLabel,
      ...(target.channelId ? { channelId: target.channelId } : {}),
      totalMs: deltaMs,
      weekKey,
      weekMs: deltaMs,
      lastSeenAtMs: now,
    });
  }

  registry[memberId] = entries;
  writeRegistry(registry);
}

export function memberChatPresenceForMember(
  memberId: string,
  now = Date.now()
): MemberChatPresence[] {
  const activeChatId = readActiveMemberChatId(memberId);

  return readMemberChatTimeRecords(memberId)
    .map((record) => ({
      chatId: record.chatId,
      chatTitle: record.chatTitle,
      surfaceLabel: record.surfaceLabel,
      ...(record.channelId ? { channelId: record.channelId } : {}),
      isActiveNow:
        record.chatId === activeChatId || now - record.lastSeenAtMs <= ACTIVE_CHAT_WINDOW_MS,
      hoursThisWeek: record.weekMs / (60 * 60 * 1000),
    }))
    .filter((entry) => entry.hoursThisWeek > 0)
    .sort((left, right) => right.hoursThisWeek - left.hoursThisWeek);
}

export function useMemberChatTimeVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function useMemberChatTimeTracker(memberId: string, target: ChatTimeTarget | null): void {
  useEffect(() => {
    if (!target) {
      return;
    }

    setActiveMemberChat(memberId, target.chatId);
    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      recordMemberChatTime(memberId, target, CHAT_TIME_TICK_MS);
    }, CHAT_TIME_TICK_MS);

    return () => {
      window.clearInterval(intervalId);

      const elapsed = Date.now() - startedAt;
      const remainder = elapsed % CHAT_TIME_TICK_MS;

      if (remainder >= 1_000) {
        recordMemberChatTime(memberId, target, remainder);
      }

      setActiveMemberChat(memberId, null);
    };
  }, [memberId, target?.chatId, target?.chatTitle, target?.surfaceLabel, target?.channelId]);
}

export function resetMemberChatTimeStoreForTests(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  activeChatSession = null;
  storeVersion = 0;
}