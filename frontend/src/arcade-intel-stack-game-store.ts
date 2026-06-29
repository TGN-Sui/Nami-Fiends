import { useSyncExternalStore } from 'react';

import {
  ARCADE_INTEL_STACK_LEADERBOARD_SIZE,
  type ArcadeIntelStackMode,
} from './arcade-intel-stack-game.js';
import { ARCADE_SKILL_DIFF_MODE, isArcadeCabinetPlayMode } from './arcade-skill-diff.js';

const LEADERBOARD_KEY = 'nami.arcade.intel-stack-leaderboard';
const PASSPORT_STATS_KEY = 'nami.arcade.intel-stack-passport-stats';

export type ArcadeIntelStackLeaderboardEntry = {
  id: string;
  memberId: string;
  displayName: string;
  score: number;
  mode: ArcadeIntelStackMode;
  playedAtMs: number;
};

export type MemberArcadeIntelStackPassportStats = {
  totalSignalsStacked: number;
  totalPerfectStacks: number;
  totalScore: number;
  bestCleanStackScore: number;
  bestSurgeStackScore: number;
  bestSkillScore: number;
  cleanStackGamesPlayed: number;
  surgeStackGamesPlayed: number;
  skillGamesPlayed: number;
};

export type ArcadeIntelStackGameResult = {
  score: number;
  signalsStacked: number;
  perfectStacks: number;
  mode: ArcadeIntelStackMode;
  rank: number;
  isPersonalBest: boolean;
};

const EMPTY_PASSPORT_STATS: MemberArcadeIntelStackPassportStats = {
  totalSignalsStacked: 0,
  totalPerfectStacks: 0,
  totalScore: 0,
  bestCleanStackScore: 0,
  bestSurgeStackScore: 0,
  bestSkillScore: 0,
  cleanStackGamesPlayed: 0,
  surgeStackGamesPlayed: 0,
  skillGamesPlayed: 0,
};

const listeners = new Set<() => void>();
let storeVersion = 0;

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-arcade-intel-stack-game-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readLeaderboardRegistry(): ArcadeIntelStackLeaderboardEntry[] {
  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ArcadeIntelStackLeaderboardEntry[];

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

function writeLeaderboardRegistry(entries: ArcadeIntelStackLeaderboardEntry[]): void {
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 80)));
  emit();
}

function readPassportStatsRegistry(): Record<string, MemberArcadeIntelStackPassportStats> {
  try {
    const stored = window.localStorage.getItem(PASSPORT_STATS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, Partial<MemberArcadeIntelStackPassportStats>>;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([memberId, stats]) => [
        memberId,
        {
          totalSignalsStacked:
            typeof stats?.totalSignalsStacked === 'number' ? stats.totalSignalsStacked : 0,
          totalPerfectStacks:
            typeof stats?.totalPerfectStacks === 'number' ? stats.totalPerfectStacks : 0,
          totalScore: typeof stats?.totalScore === 'number' ? stats.totalScore : 0,
          bestCleanStackScore:
            typeof stats?.bestCleanStackScore === 'number' ? stats.bestCleanStackScore : 0,
          bestSurgeStackScore:
            typeof stats?.bestSurgeStackScore === 'number' ? stats.bestSurgeStackScore : 0,
          bestSkillScore: typeof stats?.bestSkillScore === 'number' ? stats.bestSkillScore : 0,
          cleanStackGamesPlayed:
            typeof stats?.cleanStackGamesPlayed === 'number' ? stats.cleanStackGamesPlayed : 0,
          surgeStackGamesPlayed:
            typeof stats?.surgeStackGamesPlayed === 'number' ? stats.surgeStackGamesPlayed : 0,
          skillGamesPlayed:
            typeof stats?.skillGamesPlayed === 'number' ? stats.skillGamesPlayed : 0,
        },
      ]),
    );
  } catch {
    return {};
  }
}

function writePassportStatsRegistry(registry: Record<string, MemberArcadeIntelStackPassportStats>): void {
  window.localStorage.setItem(PASSPORT_STATS_KEY, JSON.stringify(registry));
  emit();
}

export function readMemberArcadeIntelStackPassportStats(
  memberId: string,
): MemberArcadeIntelStackPassportStats {
  return readPassportStatsRegistry()[memberId] ?? EMPTY_PASSPORT_STATS;
}

export function readArcadeIntelStackLeaderboard(
  mode: ArcadeIntelStackMode,
  limit = ARCADE_INTEL_STACK_LEADERBOARD_SIZE,
): ArcadeIntelStackLeaderboardEntry[] {
  return readLeaderboardRegistry()
    .filter((entry) => entry.mode === mode)
    .sort((left, right) => right.score - left.score || right.playedAtMs - left.playedAtMs)
    .slice(0, limit);
}

export function readArcadeIntelStackHighScore(mode: ArcadeIntelStackMode): number {
  const [top] = readArcadeIntelStackLeaderboard(mode, 1);

  return top?.score ?? 0;
}

export function recordArcadeIntelStackGameResult(input: {
  memberId: string;
  displayName: string;
  mode: ArcadeIntelStackMode;
  score: number;
  signalsStacked: number;
  perfectStacks: number;
  playedAtMs?: number;
}): ArcadeIntelStackGameResult {
  const playedAtMs = input.playedAtMs ?? Date.now();
  const registry = readPassportStatsRegistry();
  const existing = registry[input.memberId] ?? EMPTY_PASSPORT_STATS;
  const previousBest =
    input.mode === 'hard'
      ? existing.bestSurgeStackScore
      : input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.bestSkillScore
        : existing.bestCleanStackScore;
  const isPersonalBest = input.score > previousBest;

  registry[input.memberId] = {
    totalSignalsStacked: existing.totalSignalsStacked + input.signalsStacked,
    totalPerfectStacks: existing.totalPerfectStacks + input.perfectStacks,
    totalScore: existing.totalScore + input.score,
    bestCleanStackScore:
      input.mode === 'normal'
        ? Math.max(existing.bestCleanStackScore, input.score)
        : existing.bestCleanStackScore,
    bestSurgeStackScore:
      input.mode === 'hard'
        ? Math.max(existing.bestSurgeStackScore, input.score)
        : existing.bestSurgeStackScore,
    bestSkillScore:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? Math.max(existing.bestSkillScore, input.score)
        : existing.bestSkillScore,
    cleanStackGamesPlayed:
      input.mode === 'normal'
        ? existing.cleanStackGamesPlayed + 1
        : existing.cleanStackGamesPlayed,
    surgeStackGamesPlayed:
      input.mode === 'hard'
        ? existing.surgeStackGamesPlayed + 1
        : existing.surgeStackGamesPlayed,
    skillGamesPlayed:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.skillGamesPlayed + 1
        : existing.skillGamesPlayed,
  };

  writePassportStatsRegistry(registry);

  const leaderboard = readLeaderboardRegistry();
  const nextEntry: ArcadeIntelStackLeaderboardEntry = {
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
    .slice(0, ARCADE_INTEL_STACK_LEADERBOARD_SIZE);

  const otherModes = leaderboard.filter((entry) => entry.mode !== input.mode);
  writeLeaderboardRegistry([...otherModes, ...merged]);

  const updatedBoard = readArcadeIntelStackLeaderboard(input.mode);
  const rankIndex = updatedBoard.findIndex(
    (entry) =>
      entry.memberId === input.memberId &&
      entry.score === input.score &&
      entry.playedAtMs === playedAtMs,
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : updatedBoard.length + 1;

  return {
    score: input.score,
    signalsStacked: input.signalsStacked,
    perfectStacks: input.perfectStacks,
    mode: input.mode,
    rank,
    isPersonalBest,
  };
}

export function useArcadeIntelStackGameVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function resetArcadeIntelStackGameStoreForTests(): void {
  try {
    window.localStorage.removeItem(LEADERBOARD_KEY);
    window.localStorage.removeItem(PASSPORT_STATS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  storeVersion = 0;
}