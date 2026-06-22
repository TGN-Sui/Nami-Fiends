import { useSyncExternalStore } from 'react';

import { currentBoostWeekId } from './channel-boost-store.js';

const STORAGE_KEY = 'nami.genre-chat.weekly-activity';

type GenreChatWeekRecord = {
  chatId: string;
  weekId: number;
  memberIds: string[];
};

type GenreChatActivityRegistry = Record<string, GenreChatWeekRecord>;

let storeVersion = 0;
const listeners = new Set<() => void>();

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-genre-chat-activity-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readRegistry(): GenreChatActivityRegistry {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as GenreChatActivityRegistry;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function writeRegistry(registry: GenreChatActivityRegistry): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  emit();
}

function recordKey(chatId: string, weekId: number): string {
  return chatId + ':' + weekId;
}

export function recordGenreWeeklyChatter(
  chatId: string,
  memberId: string,
  weekId = currentBoostWeekId(),
): void {
  if (!chatId || !memberId) {
    return;
  }

  const registry = readRegistry();
  const key = recordKey(chatId, weekId);
  const existing = registry[key];

  if (existing) {
    if (existing.memberIds.includes(memberId)) {
      return;
    }

    registry[key] = {
      ...existing,
      memberIds: [...existing.memberIds, memberId],
    };
  } else {
    registry[key] = {
      chatId,
      weekId,
      memberIds: [memberId],
    };
  }

  writeRegistry(registry);
}

export function getGenreWeeklyActiveChatters(
  chatId: string,
  weekId = currentBoostWeekId(),
): number {
  const record = readRegistry()[recordKey(chatId, weekId)];

  return record?.memberIds.length ?? 0;
}

export function useGenreChatActivityVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function resetGenreChatActivityStoreForTests(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  storeVersion = 0;
}