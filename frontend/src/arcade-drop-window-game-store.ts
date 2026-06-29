import { useSyncExternalStore } from 'react';

import {
  ARCADE_DROP_WINDOW_LEADERBOARD_SIZE,
  type ArcadeDropWindowMode,
} from './arcade-drop-window-game.js';
import { ARCADE_SKILL_DIFF_MODE, isArcadeCabinetPlayMode } from './arcade-skill-diff.js';

const LEADERBOARD_KEY = 'nami.arcade.drop-window-leaderboard';
const PASSPORT_STATS_KEY = 'nami.arcade.drop-window-passport-stats';

export type ArcadeDropWindowLeaderboardEntry = {
  id: string;
  memberId: string;
  displayName: string;
  score: number;
  mode: ArcadeDropWindowMode;
  playedAtMs: number;
};

export type MemberArcadeDropWindowPassportStats = {
  totalDropsCaught: number;
  totalStaticKilled: number;
  totalScore: number;
  bestCleanScore: number;
  bestStormScore: number;
  bestSkillScore: number;
  cleanGamesPlayed: number;
  stormGamesPlayed: number;
  skillGamesPlayed: number;
};

export type ArcadeDropWindowGameResult = {
  score: number;
  dropsCaught: number;
  staticKilled: number;
  mode: ArcadeDropWindowMode;
  rank: number;
  isPersonalBest: boolean;
};

const EMPTY_PASSPORT_STATS: MemberArcadeDropWindowPassportStats = {
  totalDropsCaught: 0,
  totalStaticKilled: 0,
  totalScore: 0,
  bestCleanScore: 0,
  bestStormScore: 0,
  bestSkillScore: 0,
  cleanGamesPlayed: 0,
  stormGamesPlayed: 0,
  skillGamesPlayed: 0,
};

const listeners = new Set<() => void>();
let storeVersion = 0;

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-arcade-drop-window-game-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readLeaderboardRegistry(): ArcadeDropWindowLeaderboardEntry[] {
  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ArcadeDropWindowLeaderboardEntry[];

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

function writeLeaderboardRegistry(entries: ArcadeDropWindowLeaderboardEntry[]): void {
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 80)));
  emit();
}

function readPassportStatsRegistry(): Record<string, MemberArcadeDropWindowPassportStats> {
  try {
    const stored = window.localStorage.getItem(PASSPORT_STATS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, Partial<MemberArcadeDropWindowPassportStats>>;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([memberId, stats]) => [
        memberId,
        {
          totalDropsCaught: typeof stats?.totalDropsCaught === 'number' ? stats.totalDropsCaught : 0,
          totalStaticKilled:
            typeof stats?.totalStaticKilled === 'number' ? stats.totalStaticKilled : 0,
          totalScore: typeof stats?.totalScore === 'number' ? stats.totalScore : 0,
          bestCleanScore: typeof stats?.bestCleanScore === 'number' ? stats.bestCleanScore : 0,
          bestStormScore: typeof stats?.bestStormScore === 'number' ? stats.bestStormScore : 0,
          bestSkillScore: typeof stats?.bestSkillScore === 'number' ? stats.bestSkillScore : 0,
          cleanGamesPlayed:
            typeof stats?.cleanGamesPlayed === 'number' ? stats.cleanGamesPlayed : 0,
          stormGamesPlayed:
            typeof stats?.stormGamesPlayed === 'number' ? stats.stormGamesPlayed : 0,
          skillGamesPlayed:
            typeof stats?.skillGamesPlayed === 'number' ? stats.skillGamesPlayed : 0,
        },
      ]),
    );
  } catch {
    return {};
  }
}

function writePassportStatsRegistry(registry: Record<string, MemberArcadeDropWindowPassportStats>): void {
  window.localStorage.setItem(PASSPORT_STATS_KEY, JSON.stringify(registry));
  emit();
}

export function readMemberArcadeDropWindowPassportStats(
  memberId: string,
): MemberArcadeDropWindowPassportStats {
  return readPassportStatsRegistry()[memberId] ?? EMPTY_PASSPORT_STATS;
}

export function readArcadeDropWindowLeaderboard(
  mode: ArcadeDropWindowMode,
  limit = ARCADE_DROP_WINDOW_LEADERBOARD_SIZE,
): ArcadeDropWindowLeaderboardEntry[] {
  return readLeaderboardRegistry()
    .filter((entry) => entry.mode === mode)
    .sort((left, right) => right.score - left.score || right.playedAtMs - left.playedAtMs)
    .slice(0, limit);
}

export function readArcadeDropWindowHighScore(mode: ArcadeDropWindowMode): number {
  const [top] = readArcadeDropWindowLeaderboard(mode, 1);

  return top?.score ?? 0;
}

export function recordArcadeDropWindowGameResult(input: {
  memberId: string;
  displayName: string;
  mode: ArcadeDropWindowMode;
  score: number;
  dropsCaught: number;
  staticKilled: number;
  playedAtMs?: number;
}): ArcadeDropWindowGameResult {
  const playedAtMs = input.playedAtMs ?? Date.now();
  const registry = readPassportStatsRegistry();
  const existing = registry[input.memberId] ?? EMPTY_PASSPORT_STATS;
  const previousBest =
    input.mode === 'hard'
      ? existing.bestStormScore
      : input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.bestSkillScore
        : existing.bestCleanScore;
  const isPersonalBest = input.score > previousBest;

  registry[input.memberId] = {
    totalDropsCaught: existing.totalDropsCaught + input.dropsCaught,
    totalStaticKilled: existing.totalStaticKilled + input.staticKilled,
    totalScore: existing.totalScore + input.score,
    bestCleanScore:
      input.mode === 'normal'
        ? Math.max(existing.bestCleanScore, input.score)
        : existing.bestCleanScore,
    bestStormScore:
      input.mode === 'hard' ? Math.max(existing.bestStormScore, input.score) : existing.bestStormScore,
    bestSkillScore:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? Math.max(existing.bestSkillScore, input.score)
        : existing.bestSkillScore,
    cleanGamesPlayed:
      input.mode === 'normal' ? existing.cleanGamesPlayed + 1 : existing.cleanGamesPlayed,
    stormGamesPlayed:
      input.mode === 'hard' ? existing.stormGamesPlayed + 1 : existing.stormGamesPlayed,
    skillGamesPlayed:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.skillGamesPlayed + 1
        : existing.skillGamesPlayed,
  };

  writePassportStatsRegistry(registry);

  const leaderboard = readLeaderboardRegistry();
  const nextEntry: ArcadeDropWindowLeaderboardEntry = {
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
    .slice(0, ARCADE_DROP_WINDOW_LEADERBOARD_SIZE);

  const otherModes = leaderboard.filter((entry) => entry.mode !== input.mode);
  writeLeaderboardRegistry([...otherModes, ...merged]);

  const updatedBoard = readArcadeDropWindowLeaderboard(input.mode);
  const rankIndex = updatedBoard.findIndex(
    (entry) =>
      entry.memberId === input.memberId &&
      entry.score === input.score &&
      entry.playedAtMs === playedAtMs,
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : updatedBoard.length + 1;

  return {
    score: input.score,
    dropsCaught: input.dropsCaught,
    staticKilled: input.staticKilled,
    mode: input.mode,
    rank,
    isPersonalBest,
  };
}

export function useArcadeDropWindowGameVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function resetArcadeDropWindowGameStoreForTests(): void {
  try {
    window.localStorage.removeItem(LEADERBOARD_KEY);
    window.localStorage.removeItem(PASSPORT_STATS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  storeVersion = 0;
}