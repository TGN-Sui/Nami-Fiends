import { useSyncExternalStore } from 'react';

import {
  ARCADE_STASH_DEFENSE_LEADERBOARD_SIZE,
  type ArcadeStashDefenseMode,
} from './arcade-stash-defense-game.js';
import { ARCADE_SKILL_DIFF_MODE, isArcadeCabinetPlayMode } from './arcade-skill-diff.js';

const LEADERBOARD_KEY = 'nami.arcade.stash-defense-leaderboard';
const PASSPORT_STATS_KEY = 'nami.arcade.stash-defense-passport-stats';

export type ArcadeStashDefenseLeaderboardEntry = {
  id: string;
  memberId: string;
  displayName: string;
  score: number;
  mode: ArcadeStashDefenseMode;
  playedAtMs: number;
};

export type MemberArcadeStashDefensePassportStats = {
  totalRepelled: number;
  totalScore: number;
  bestWatchScore: number;
  bestSiegeScore: number;
  bestSkillScore: number;
  watchGamesPlayed: number;
  siegeGamesPlayed: number;
  skillGamesPlayed: number;
};

export type ArcadeStashDefenseGameResult = {
  score: number;
  enemiesRepelled: number;
  mode: ArcadeStashDefenseMode;
  rank: number;
  isPersonalBest: boolean;
};

const EMPTY_PASSPORT_STATS: MemberArcadeStashDefensePassportStats = {
  totalRepelled: 0,
  totalScore: 0,
  bestWatchScore: 0,
  bestSiegeScore: 0,
  bestSkillScore: 0,
  watchGamesPlayed: 0,
  siegeGamesPlayed: 0,
  skillGamesPlayed: 0,
};

const listeners = new Set<() => void>();
let storeVersion = 0;

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-arcade-stash-defense-game-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readLeaderboardRegistry(): ArcadeStashDefenseLeaderboardEntry[] {
  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ArcadeStashDefenseLeaderboardEntry[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry) =>
        typeof entry.id === 'string' &&
        typeof entry.memberId === 'string' &&
        typeof entry.displayName === 'string' &&
        typeof entry.score === 'number' &&
        isArcadeCabinetPlayMode(entry.mode) &&
        typeof entry.playedAtMs === 'number',
    );
  } catch {
    return [];
  }
}

function writeLeaderboardRegistry(entries: ArcadeStashDefenseLeaderboardEntry[]): void {
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 80)));
  emit();
}

function readPassportStatsRegistry(): Record<string, MemberArcadeStashDefensePassportStats> {
  try {
    const stored = window.localStorage.getItem(PASSPORT_STATS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, Partial<MemberArcadeStashDefensePassportStats>>;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([memberId, stats]) => [
        memberId,
        {
          totalRepelled: typeof stats?.totalRepelled === 'number' ? stats.totalRepelled : 0,
          totalScore: typeof stats?.totalScore === 'number' ? stats.totalScore : 0,
          bestWatchScore: typeof stats?.bestWatchScore === 'number' ? stats.bestWatchScore : 0,
          bestSiegeScore: typeof stats?.bestSiegeScore === 'number' ? stats.bestSiegeScore : 0,
          bestSkillScore: typeof stats?.bestSkillScore === 'number' ? stats.bestSkillScore : 0,
          watchGamesPlayed:
            typeof stats?.watchGamesPlayed === 'number' ? stats.watchGamesPlayed : 0,
          siegeGamesPlayed:
            typeof stats?.siegeGamesPlayed === 'number' ? stats.siegeGamesPlayed : 0,
          skillGamesPlayed:
            typeof stats?.skillGamesPlayed === 'number' ? stats.skillGamesPlayed : 0,
        },
      ]),
    );
  } catch {
    return {};
  }
}

function writePassportStatsRegistry(registry: Record<string, MemberArcadeStashDefensePassportStats>): void {
  window.localStorage.setItem(PASSPORT_STATS_KEY, JSON.stringify(registry));
  emit();
}

export function readMemberArcadeStashDefensePassportStats(
  memberId: string,
): MemberArcadeStashDefensePassportStats {
  return readPassportStatsRegistry()[memberId] ?? EMPTY_PASSPORT_STATS;
}

export function readArcadeStashDefenseLeaderboard(
  mode: ArcadeStashDefenseMode,
  limit = ARCADE_STASH_DEFENSE_LEADERBOARD_SIZE,
): ArcadeStashDefenseLeaderboardEntry[] {
  return readLeaderboardRegistry()
    .filter((entry) => entry.mode === mode)
    .sort((left, right) => right.score - left.score || right.playedAtMs - left.playedAtMs)
    .slice(0, limit);
}

export function readArcadeStashDefenseHighScore(mode: ArcadeStashDefenseMode): number {
  const [top] = readArcadeStashDefenseLeaderboard(mode, 1);

  return top?.score ?? 0;
}

export function recordArcadeStashDefenseGameResult(input: {
  memberId: string;
  displayName: string;
  mode: ArcadeStashDefenseMode;
  score: number;
  enemiesRepelled: number;
  playedAtMs?: number;
}): ArcadeStashDefenseGameResult {
  const playedAtMs = input.playedAtMs ?? Date.now();
  const registry = readPassportStatsRegistry();
  const existing = registry[input.memberId] ?? EMPTY_PASSPORT_STATS;
  const previousBest =
    input.mode === 'hard'
      ? existing.bestSiegeScore
      : input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.bestSkillScore
        : existing.bestWatchScore;
  const isPersonalBest = input.score > previousBest;

  registry[input.memberId] = {
    totalRepelled: existing.totalRepelled + input.enemiesRepelled,
    totalScore: existing.totalScore + input.score,
    bestWatchScore:
      input.mode === 'normal'
        ? Math.max(existing.bestWatchScore, input.score)
        : existing.bestWatchScore,
    bestSiegeScore:
      input.mode === 'hard' ? Math.max(existing.bestSiegeScore, input.score) : existing.bestSiegeScore,
    bestSkillScore:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? Math.max(existing.bestSkillScore, input.score)
        : existing.bestSkillScore,
    watchGamesPlayed:
      input.mode === 'normal' ? existing.watchGamesPlayed + 1 : existing.watchGamesPlayed,
    siegeGamesPlayed:
      input.mode === 'hard' ? existing.siegeGamesPlayed + 1 : existing.siegeGamesPlayed,
    skillGamesPlayed:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.skillGamesPlayed + 1
        : existing.skillGamesPlayed,
  };

  writePassportStatsRegistry(registry);

  const leaderboard = readLeaderboardRegistry();
  const nextEntry: ArcadeStashDefenseLeaderboardEntry = {
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
    .slice(0, ARCADE_STASH_DEFENSE_LEADERBOARD_SIZE);

  const otherModes = leaderboard.filter((entry) => entry.mode !== input.mode);
  writeLeaderboardRegistry([...otherModes, ...merged]);

  const updatedBoard = readArcadeStashDefenseLeaderboard(input.mode);
  const rankIndex = updatedBoard.findIndex(
    (entry) =>
      entry.memberId === input.memberId &&
      entry.score === input.score &&
      entry.playedAtMs === playedAtMs,
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : updatedBoard.length + 1;

  return {
    score: input.score,
    enemiesRepelled: input.enemiesRepelled,
    mode: input.mode,
    rank,
    isPersonalBest,
  };
}

export function useArcadeStashDefenseGameVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function resetArcadeStashDefenseGameStoreForTests(): void {
  try {
    window.localStorage.removeItem(LEADERBOARD_KEY);
    window.localStorage.removeItem(PASSPORT_STATS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  storeVersion = 0;
}