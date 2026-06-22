import { useSyncExternalStore } from 'react';

import {
  ARCADE_BUBBLE_LEADERBOARD_SIZE,
  type ArcadeBubbleMode,
} from './arcade-bubble-game.js';

const LEADERBOARD_KEY = 'nami.arcade.bubble-leaderboard';
const PASSPORT_STATS_KEY = 'nami.arcade.bubble-passport-stats';

export type ArcadeBubbleLeaderboardEntry = {
  id: string;
  memberId: string;
  displayName: string;
  score: number;
  mode: ArcadeBubbleMode;
  playedAtMs: number;
};

export type MemberArcadeBubblePassportStats = {
  totalBubblesPopped: number;
  totalScore: number;
  bestNormalScore: number;
  bestHardScore: number;
  normalGamesPlayed: number;
  hardGamesPlayed: number;
};

export type ArcadeBubbleGameResult = {
  score: number;
  bubblesPopped: number;
  mode: ArcadeBubbleMode;
  rank: number;
  isPersonalBest: boolean;
};

const EMPTY_PASSPORT_STATS: MemberArcadeBubblePassportStats = {
  totalBubblesPopped: 0,
  totalScore: 0,
  bestNormalScore: 0,
  bestHardScore: 0,
  normalGamesPlayed: 0,
  hardGamesPlayed: 0,
};

const listeners = new Set<() => void>();
let storeVersion = 0;

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-arcade-bubble-game-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readLeaderboardRegistry(): ArcadeBubbleLeaderboardEntry[] {
  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ArcadeBubbleLeaderboardEntry[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry) =>
        typeof entry.id === 'string' &&
        typeof entry.memberId === 'string' &&
        typeof entry.displayName === 'string' &&
        typeof entry.score === 'number' &&
        (entry.mode === 'normal' || entry.mode === 'hard') &&
        typeof entry.playedAtMs === 'number',
    );
  } catch {
    return [];
  }
}

function writeLeaderboardRegistry(entries: ArcadeBubbleLeaderboardEntry[]): void {
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 80)));
  emit();
}

function readPassportStatsRegistry(): Record<string, MemberArcadeBubblePassportStats> {
  try {
    const stored = window.localStorage.getItem(PASSPORT_STATS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, Partial<MemberArcadeBubblePassportStats>>;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([memberId, stats]) => [
        memberId,
        {
          totalBubblesPopped:
            typeof stats?.totalBubblesPopped === 'number' ? stats.totalBubblesPopped : 0,
          totalScore: typeof stats?.totalScore === 'number' ? stats.totalScore : 0,
          bestNormalScore: typeof stats?.bestNormalScore === 'number' ? stats.bestNormalScore : 0,
          bestHardScore: typeof stats?.bestHardScore === 'number' ? stats.bestHardScore : 0,
          normalGamesPlayed:
            typeof stats?.normalGamesPlayed === 'number' ? stats.normalGamesPlayed : 0,
          hardGamesPlayed: typeof stats?.hardGamesPlayed === 'number' ? stats.hardGamesPlayed : 0,
        },
      ]),
    );
  } catch {
    return {};
  }
}

function writePassportStatsRegistry(registry: Record<string, MemberArcadeBubblePassportStats>): void {
  window.localStorage.setItem(PASSPORT_STATS_KEY, JSON.stringify(registry));
  emit();
}

export function readMemberArcadeBubblePassportStats(
  memberId: string,
): MemberArcadeBubblePassportStats {
  return readPassportStatsRegistry()[memberId] ?? EMPTY_PASSPORT_STATS;
}

export function recordArcadeBubblePop(memberId: string, count = 1): void {
  if (count <= 0) {
    return;
  }

  const registry = readPassportStatsRegistry();
  const existing = registry[memberId] ?? EMPTY_PASSPORT_STATS;

  registry[memberId] = {
    ...existing,
    totalBubblesPopped: existing.totalBubblesPopped + count,
  };

  writePassportStatsRegistry(registry);
}

export function readArcadeBubbleLeaderboard(
  mode: ArcadeBubbleMode,
  limit = ARCADE_BUBBLE_LEADERBOARD_SIZE,
): ArcadeBubbleLeaderboardEntry[] {
  return readLeaderboardRegistry()
    .filter((entry) => entry.mode === mode)
    .sort((left, right) => right.score - left.score || right.playedAtMs - left.playedAtMs)
    .slice(0, limit);
}

export function resolveArcadeBubbleLeaderboardRank(
  mode: ArcadeBubbleMode,
  score: number,
  memberId?: string,
): number {
  const entries = readArcadeBubbleLeaderboard(mode, ARCADE_BUBBLE_LEADERBOARD_SIZE);
  const qualifyingIndex = entries.findIndex((entry) => score > entry.score);

  if (qualifyingIndex >= 0) {
    return qualifyingIndex + 1;
  }

  if (entries.length < ARCADE_BUBBLE_LEADERBOARD_SIZE) {
    return entries.length + 1;
  }

  const memberEntryIndex = memberId
    ? entries.findIndex((entry) => entry.memberId === memberId)
    : -1;

  if (memberEntryIndex >= 0) {
    return memberEntryIndex + 1;
  }

  return ARCADE_BUBBLE_LEADERBOARD_SIZE + 1;
}

export function readArcadeBubbleHighScore(mode: ArcadeBubbleMode): number {
  const [top] = readArcadeBubbleLeaderboard(mode, 1);

  return top?.score ?? 0;
}

export function recordArcadeBubbleGameResult(input: {
  memberId: string;
  displayName: string;
  mode: ArcadeBubbleMode;
  score: number;
  bubblesPopped: number;
  playedAtMs?: number;
}): ArcadeBubbleGameResult {
  const playedAtMs = input.playedAtMs ?? Date.now();
  const registry = readPassportStatsRegistry();
  const existing = registry[input.memberId] ?? EMPTY_PASSPORT_STATS;
  const previousBest =
    input.mode === 'hard' ? existing.bestHardScore : existing.bestNormalScore;
  const isPersonalBest = input.score > previousBest;

  registry[input.memberId] = {
    totalBubblesPopped: existing.totalBubblesPopped,
    totalScore: existing.totalScore + input.score,
    bestNormalScore:
      input.mode === 'normal'
        ? Math.max(existing.bestNormalScore, input.score)
        : existing.bestNormalScore,
    bestHardScore:
      input.mode === 'hard' ? Math.max(existing.bestHardScore, input.score) : existing.bestHardScore,
    normalGamesPlayed:
      input.mode === 'normal' ? existing.normalGamesPlayed + 1 : existing.normalGamesPlayed,
    hardGamesPlayed:
      input.mode === 'hard' ? existing.hardGamesPlayed + 1 : existing.hardGamesPlayed,
  };

  writePassportStatsRegistry(registry);

  const leaderboard = readLeaderboardRegistry();
  const nextEntry: ArcadeBubbleLeaderboardEntry = {
    id: input.memberId + '-' + playedAtMs,
    memberId: input.memberId,
    displayName: input.displayName.trim() || 'Arcade Player',
    score: input.score,
    mode: input.mode,
    playedAtMs,
  };

  const merged = [...leaderboard, nextEntry]
    .filter((entry) => entry.mode === input.mode)
    .sort((left, right) => right.score - left.score || right.playedAtMs - left.playedAtMs)
    .slice(0, ARCADE_BUBBLE_LEADERBOARD_SIZE);

  const otherModes = leaderboard.filter((entry) => entry.mode !== input.mode);
  writeLeaderboardRegistry([...otherModes, ...merged]);

  const updatedBoard = readArcadeBubbleLeaderboard(input.mode);
  const rankIndex = updatedBoard.findIndex(
    (entry) =>
      entry.memberId === input.memberId &&
      entry.score === input.score &&
      entry.playedAtMs === playedAtMs,
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : updatedBoard.length + 1;

  return {
    score: input.score,
    bubblesPopped: input.bubblesPopped,
    mode: input.mode,
    rank,
    isPersonalBest,
  };
}

export function useArcadeBubbleGameVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function resetArcadeBubbleGameStoreForTests(): void {
  try {
    window.localStorage.removeItem(LEADERBOARD_KEY);
    window.localStorage.removeItem(PASSPORT_STATS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  storeVersion = 0;
}