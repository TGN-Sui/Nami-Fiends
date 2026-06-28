import { useSyncExternalStore } from 'react';

import {
  ARCADE_ALLEY_PUSH_LEADERBOARD_SIZE,
  type ArcadeAlleyPushMode,
} from './arcade-alley-push-game.js';

const LEADERBOARD_KEY = 'nami.arcade.alley-push-leaderboard';
const PASSPORT_STATS_KEY = 'nami.arcade.alley-push-passport-stats';

export type ArcadeAlleyPushLeaderboardEntry = {
  id: string;
  memberId: string;
  displayName: string;
  score: number;
  mode: ArcadeAlleyPushMode;
  playedAtMs: number;
};

export type MemberArcadeAlleyPushPassportStats = {
  totalPasses: number;
  totalScore: number;
  bestStreetScore: number;
  bestHeatScore: number;
  streetGamesPlayed: number;
  heatGamesPlayed: number;
};

export type ArcadeAlleyPushGameResult = {
  score: number;
  passesCompleted: number;
  mode: ArcadeAlleyPushMode;
  rank: number;
  isPersonalBest: boolean;
};

const EMPTY_PASSPORT_STATS: MemberArcadeAlleyPushPassportStats = {
  totalPasses: 0,
  totalScore: 0,
  bestStreetScore: 0,
  bestHeatScore: 0,
  streetGamesPlayed: 0,
  heatGamesPlayed: 0,
};

const listeners = new Set<() => void>();
let storeVersion = 0;

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-arcade-alley-push-game-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readLeaderboardRegistry(): ArcadeAlleyPushLeaderboardEntry[] {
  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ArcadeAlleyPushLeaderboardEntry[];

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

function writeLeaderboardRegistry(entries: ArcadeAlleyPushLeaderboardEntry[]): void {
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 80)));
  emit();
}

function readPassportStatsRegistry(): Record<string, MemberArcadeAlleyPushPassportStats> {
  try {
    const stored = window.localStorage.getItem(PASSPORT_STATS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, Partial<MemberArcadeAlleyPushPassportStats>>;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([memberId, stats]) => [
        memberId,
        {
          totalPasses: typeof stats?.totalPasses === 'number' ? stats.totalPasses : 0,
          totalScore: typeof stats?.totalScore === 'number' ? stats.totalScore : 0,
          bestStreetScore: typeof stats?.bestStreetScore === 'number' ? stats.bestStreetScore : 0,
          bestHeatScore: typeof stats?.bestHeatScore === 'number' ? stats.bestHeatScore : 0,
          streetGamesPlayed:
            typeof stats?.streetGamesPlayed === 'number' ? stats.streetGamesPlayed : 0,
          heatGamesPlayed: typeof stats?.heatGamesPlayed === 'number' ? stats.heatGamesPlayed : 0,
        },
      ]),
    );
  } catch {
    return {};
  }
}

function writePassportStatsRegistry(registry: Record<string, MemberArcadeAlleyPushPassportStats>): void {
  window.localStorage.setItem(PASSPORT_STATS_KEY, JSON.stringify(registry));
  emit();
}

export function readArcadeAlleyPushLeaderboard(
  mode: ArcadeAlleyPushMode,
  limit = ARCADE_ALLEY_PUSH_LEADERBOARD_SIZE,
): ArcadeAlleyPushLeaderboardEntry[] {
  return readLeaderboardRegistry()
    .filter((entry) => entry.mode === mode)
    .sort((left, right) => right.score - left.score || right.playedAtMs - left.playedAtMs)
    .slice(0, limit);
}

export function readArcadeAlleyPushHighScore(mode: ArcadeAlleyPushMode): number {
  const [top] = readArcadeAlleyPushLeaderboard(mode, 1);

  return top?.score ?? 0;
}

export function recordArcadeAlleyPushGameResult(input: {
  memberId: string;
  displayName: string;
  mode: ArcadeAlleyPushMode;
  score: number;
  passesCompleted: number;
  playedAtMs?: number;
}): ArcadeAlleyPushGameResult {
  const playedAtMs = input.playedAtMs ?? Date.now();
  const registry = readPassportStatsRegistry();
  const existing = registry[input.memberId] ?? EMPTY_PASSPORT_STATS;
  const previousBest = input.mode === 'hard' ? existing.bestHeatScore : existing.bestStreetScore;
  const isPersonalBest = input.score > previousBest;

  registry[input.memberId] = {
    totalPasses: existing.totalPasses + input.passesCompleted,
    totalScore: existing.totalScore + input.score,
    bestStreetScore:
      input.mode === 'normal'
        ? Math.max(existing.bestStreetScore, input.score)
        : existing.bestStreetScore,
    bestHeatScore:
      input.mode === 'hard' ? Math.max(existing.bestHeatScore, input.score) : existing.bestHeatScore,
    streetGamesPlayed:
      input.mode === 'normal' ? existing.streetGamesPlayed + 1 : existing.streetGamesPlayed,
    heatGamesPlayed:
      input.mode === 'hard' ? existing.heatGamesPlayed + 1 : existing.heatGamesPlayed,
  };

  writePassportStatsRegistry(registry);

  const leaderboard = readLeaderboardRegistry();
  const nextEntry: ArcadeAlleyPushLeaderboardEntry = {
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
    .slice(0, ARCADE_ALLEY_PUSH_LEADERBOARD_SIZE);

  const otherModes = leaderboard.filter((entry) => entry.mode !== input.mode);
  writeLeaderboardRegistry([...otherModes, ...merged]);

  const updatedBoard = readArcadeAlleyPushLeaderboard(input.mode);
  const rankIndex = updatedBoard.findIndex(
    (entry) =>
      entry.memberId === input.memberId &&
      entry.score === input.score &&
      entry.playedAtMs === playedAtMs,
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : updatedBoard.length + 1;

  return {
    score: input.score,
    passesCompleted: input.passesCompleted,
    mode: input.mode,
    rank,
    isPersonalBest,
  };
}

export function useArcadeAlleyPushGameVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function resetArcadeAlleyPushGameStoreForTests(): void {
  try {
    window.localStorage.removeItem(LEADERBOARD_KEY);
    window.localStorage.removeItem(PASSPORT_STATS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  storeVersion = 0;
}