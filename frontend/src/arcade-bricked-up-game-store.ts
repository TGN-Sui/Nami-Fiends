import { useSyncExternalStore } from 'react';

import {
  ARCADE_BRICKED_UP_LEADERBOARD_SIZE,
  type ArcadeBrickedUpMode,
} from './arcade-bricked-up-game.js';
import { ARCADE_SKILL_DIFF_MODE, isArcadeCabinetPlayMode } from './arcade-skill-diff.js';

const LEADERBOARD_KEY = 'nami.arcade.bricked-up-leaderboard';
const PASSPORT_STATS_KEY = 'nami.arcade.bricked-up-passport-stats';

export type ArcadeBrickedUpLeaderboardEntry = {
  id: string;
  memberId: string;
  displayName: string;
  score: number;
  mode: ArcadeBrickedUpMode;
  playedAtMs: number;
};

export type MemberArcadeBrickedUpPassportStats = {
  totalBricksBroken: number;
  totalLevelsCleared: number;
  totalScore: number;
  bestStreetScore: number;
  bestHeatScore: number;
  bestSkillScore: number;
  streetGamesPlayed: number;
  heatGamesPlayed: number;
  skillGamesPlayed: number;
};

export type ArcadeBrickedUpGameResult = {
  score: number;
  bricksBroken: number;
  levelsCleared: number;
  mode: ArcadeBrickedUpMode;
  rank: number;
  isPersonalBest: boolean;
};

const EMPTY_PASSPORT_STATS: MemberArcadeBrickedUpPassportStats = {
  totalBricksBroken: 0,
  totalLevelsCleared: 0,
  totalScore: 0,
  bestStreetScore: 0,
  bestHeatScore: 0,
  bestSkillScore: 0,
  streetGamesPlayed: 0,
  heatGamesPlayed: 0,
  skillGamesPlayed: 0,
};

const listeners = new Set<() => void>();
let storeVersion = 0;

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-arcade-bricked-up-game-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readLeaderboardRegistry(): ArcadeBrickedUpLeaderboardEntry[] {
  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ArcadeBrickedUpLeaderboardEntry[];

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

function writeLeaderboardRegistry(entries: ArcadeBrickedUpLeaderboardEntry[]): void {
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 80)));
  emit();
}

function readPassportStatsRegistry(): Record<string, MemberArcadeBrickedUpPassportStats> {
  try {
    const stored = window.localStorage.getItem(PASSPORT_STATS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, Partial<MemberArcadeBrickedUpPassportStats>>;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([memberId, stats]) => [
        memberId,
        {
          totalBricksBroken:
            typeof stats?.totalBricksBroken === 'number' ? stats.totalBricksBroken : 0,
          totalLevelsCleared:
            typeof stats?.totalLevelsCleared === 'number' ? stats.totalLevelsCleared : 0,
          totalScore: typeof stats?.totalScore === 'number' ? stats.totalScore : 0,
          bestStreetScore: typeof stats?.bestStreetScore === 'number' ? stats.bestStreetScore : 0,
          bestHeatScore: typeof stats?.bestHeatScore === 'number' ? stats.bestHeatScore : 0,
          bestSkillScore: typeof stats?.bestSkillScore === 'number' ? stats.bestSkillScore : 0,
          streetGamesPlayed:
            typeof stats?.streetGamesPlayed === 'number' ? stats.streetGamesPlayed : 0,
          heatGamesPlayed: typeof stats?.heatGamesPlayed === 'number' ? stats.heatGamesPlayed : 0,
          skillGamesPlayed:
            typeof stats?.skillGamesPlayed === 'number' ? stats.skillGamesPlayed : 0,
        },
      ]),
    );
  } catch {
    return {};
  }
}

function writePassportStatsRegistry(registry: Record<string, MemberArcadeBrickedUpPassportStats>): void {
  window.localStorage.setItem(PASSPORT_STATS_KEY, JSON.stringify(registry));
  emit();
}

export function readMemberArcadeBrickedUpPassportStats(
  memberId: string,
): MemberArcadeBrickedUpPassportStats {
  return readPassportStatsRegistry()[memberId] ?? EMPTY_PASSPORT_STATS;
}

export function readArcadeBrickedUpLeaderboard(
  mode: ArcadeBrickedUpMode,
  limit = ARCADE_BRICKED_UP_LEADERBOARD_SIZE,
): ArcadeBrickedUpLeaderboardEntry[] {
  return readLeaderboardRegistry()
    .filter((entry) => entry.mode === mode)
    .sort((left, right) => right.score - left.score || right.playedAtMs - left.playedAtMs)
    .slice(0, limit);
}

export function readArcadeBrickedUpHighScore(mode: ArcadeBrickedUpMode): number {
  const [top] = readArcadeBrickedUpLeaderboard(mode, 1);

  return top?.score ?? 0;
}

export function recordArcadeBrickedUpGameResult(input: {
  memberId: string;
  displayName: string;
  mode: ArcadeBrickedUpMode;
  score: number;
  bricksBroken: number;
  levelsCleared: number;
  playedAtMs?: number;
}): ArcadeBrickedUpGameResult {
  const playedAtMs = input.playedAtMs ?? Date.now();
  const registry = readPassportStatsRegistry();
  const existing = registry[input.memberId] ?? EMPTY_PASSPORT_STATS;
  const previousBest =
    input.mode === 'hard'
      ? existing.bestHeatScore
      : input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.bestSkillScore
        : existing.bestStreetScore;
  const isPersonalBest = input.score > previousBest;

  registry[input.memberId] = {
    totalBricksBroken: existing.totalBricksBroken + input.bricksBroken,
    totalLevelsCleared: existing.totalLevelsCleared + input.levelsCleared,
    totalScore: existing.totalScore + input.score,
    bestStreetScore:
      input.mode === 'normal' ? Math.max(existing.bestStreetScore, input.score) : existing.bestStreetScore,
    bestHeatScore:
      input.mode === 'hard' ? Math.max(existing.bestHeatScore, input.score) : existing.bestHeatScore,
    bestSkillScore:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? Math.max(existing.bestSkillScore, input.score)
        : existing.bestSkillScore,
    streetGamesPlayed:
      input.mode === 'normal' ? existing.streetGamesPlayed + 1 : existing.streetGamesPlayed,
    heatGamesPlayed:
      input.mode === 'hard' ? existing.heatGamesPlayed + 1 : existing.heatGamesPlayed,
    skillGamesPlayed:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.skillGamesPlayed + 1
        : existing.skillGamesPlayed,
  };

  writePassportStatsRegistry(registry);

  const leaderboard = readLeaderboardRegistry();
  const nextEntry: ArcadeBrickedUpLeaderboardEntry = {
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
    .slice(0, ARCADE_BRICKED_UP_LEADERBOARD_SIZE);

  const otherModes = leaderboard.filter((entry) => entry.mode !== input.mode);
  writeLeaderboardRegistry([...otherModes, ...merged]);

  const updatedBoard = readArcadeBrickedUpLeaderboard(input.mode);
  const rankIndex = updatedBoard.findIndex(
    (entry) =>
      entry.memberId === input.memberId &&
      entry.score === input.score &&
      entry.playedAtMs === playedAtMs,
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : updatedBoard.length + 1;

  return {
    score: input.score,
    bricksBroken: input.bricksBroken,
    levelsCleared: input.levelsCleared,
    mode: input.mode,
    rank,
    isPersonalBest,
  };
}

export function useArcadeBrickedUpGameVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function resetArcadeBrickedUpGameStoreForTests(): void {
  try {
    window.localStorage.removeItem(LEADERBOARD_KEY);
    window.localStorage.removeItem(PASSPORT_STATS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  storeVersion = 0;
}