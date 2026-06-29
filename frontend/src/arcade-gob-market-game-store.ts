import { useSyncExternalStore } from 'react';

import {
  ARCADE_GOB_MARKET_LEADERBOARD_SIZE,
  type ArcadeGobMarketMode,
} from './arcade-gob-market-game.js';
import { ARCADE_SKILL_DIFF_MODE, isArcadeCabinetPlayMode } from './arcade-skill-diff.js';

const LEADERBOARD_KEY = 'nami.arcade.gob-market-leaderboard';
const PASSPORT_STATS_KEY = 'nami.arcade.gob-market-passport-stats';

export type ArcadeGobMarketLeaderboardEntry = {
  id: string;
  memberId: string;
  displayName: string;
  score: number;
  mode: ArcadeGobMarketMode;
  playedAtMs: number;
};

export type MemberArcadeGobMarketPassportStats = {
  totalTokensCollected: number;
  totalScore: number;
  bestGuestListScore: number;
  bestVipFloorScore: number;
  bestSkillScore: number;
  guestListGamesPlayed: number;
  vipFloorGamesPlayed: number;
  skillGamesPlayed: number;
};

export type ArcadeGobMarketGameResult = {
  score: number;
  tokensCollected: number;
  mode: ArcadeGobMarketMode;
  rank: number;
  isPersonalBest: boolean;
};

const EMPTY_PASSPORT_STATS: MemberArcadeGobMarketPassportStats = {
  totalTokensCollected: 0,
  totalScore: 0,
  bestGuestListScore: 0,
  bestVipFloorScore: 0,
  bestSkillScore: 0,
  guestListGamesPlayed: 0,
  vipFloorGamesPlayed: 0,
  skillGamesPlayed: 0,
};

const listeners = new Set<() => void>();
let storeVersion = 0;

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-arcade-gob-market-game-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readLeaderboardRegistry(): ArcadeGobMarketLeaderboardEntry[] {
  try {
    const stored = window.localStorage.getItem(LEADERBOARD_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ArcadeGobMarketLeaderboardEntry[];

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

function writeLeaderboardRegistry(entries: ArcadeGobMarketLeaderboardEntry[]): void {
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 80)));
  emit();
}

function readPassportStatsRegistry(): Record<string, MemberArcadeGobMarketPassportStats> {
  try {
    const stored = window.localStorage.getItem(PASSPORT_STATS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, Partial<MemberArcadeGobMarketPassportStats>>;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([memberId, stats]) => [
        memberId,
        {
          totalTokensCollected:
            typeof stats?.totalTokensCollected === 'number' ? stats.totalTokensCollected : 0,
          totalScore: typeof stats?.totalScore === 'number' ? stats.totalScore : 0,
          bestGuestListScore:
            typeof stats?.bestGuestListScore === 'number' ? stats.bestGuestListScore : 0,
          bestVipFloorScore:
            typeof stats?.bestVipFloorScore === 'number' ? stats.bestVipFloorScore : 0,
          bestSkillScore: typeof stats?.bestSkillScore === 'number' ? stats.bestSkillScore : 0,
          guestListGamesPlayed:
            typeof stats?.guestListGamesPlayed === 'number' ? stats.guestListGamesPlayed : 0,
          vipFloorGamesPlayed:
            typeof stats?.vipFloorGamesPlayed === 'number' ? stats.vipFloorGamesPlayed : 0,
          skillGamesPlayed:
            typeof stats?.skillGamesPlayed === 'number' ? stats.skillGamesPlayed : 0,
        },
      ]),
    );
  } catch {
    return {};
  }
}

function writePassportStatsRegistry(registry: Record<string, MemberArcadeGobMarketPassportStats>): void {
  window.localStorage.setItem(PASSPORT_STATS_KEY, JSON.stringify(registry));
  emit();
}

export function readMemberArcadeGobMarketPassportStats(
  memberId: string,
): MemberArcadeGobMarketPassportStats {
  return readPassportStatsRegistry()[memberId] ?? EMPTY_PASSPORT_STATS;
}

export function readArcadeGobMarketLeaderboard(
  mode: ArcadeGobMarketMode,
  limit = ARCADE_GOB_MARKET_LEADERBOARD_SIZE,
): ArcadeGobMarketLeaderboardEntry[] {
  return readLeaderboardRegistry()
    .filter((entry) => entry.mode === mode)
    .sort((left, right) => right.score - left.score || right.playedAtMs - left.playedAtMs)
    .slice(0, limit);
}

export function readArcadeGobMarketHighScore(mode: ArcadeGobMarketMode): number {
  const [top] = readArcadeGobMarketLeaderboard(mode, 1);

  return top?.score ?? 0;
}

export function recordArcadeGobMarketGameResult(input: {
  memberId: string;
  displayName: string;
  mode: ArcadeGobMarketMode;
  score: number;
  tokensCollected: number;
  playedAtMs?: number;
}): ArcadeGobMarketGameResult {
  const playedAtMs = input.playedAtMs ?? Date.now();
  const registry = readPassportStatsRegistry();
  const existing = registry[input.memberId] ?? EMPTY_PASSPORT_STATS;
  const previousBest =
    input.mode === 'hard'
      ? existing.bestVipFloorScore
      : input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.bestSkillScore
        : existing.bestGuestListScore;
  const isPersonalBest = input.score > previousBest;

  registry[input.memberId] = {
    totalTokensCollected: existing.totalTokensCollected + input.tokensCollected,
    totalScore: existing.totalScore + input.score,
    bestGuestListScore:
      input.mode === 'normal'
        ? Math.max(existing.bestGuestListScore, input.score)
        : existing.bestGuestListScore,
    bestVipFloorScore:
      input.mode === 'hard'
        ? Math.max(existing.bestVipFloorScore, input.score)
        : existing.bestVipFloorScore,
    bestSkillScore:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? Math.max(existing.bestSkillScore, input.score)
        : existing.bestSkillScore,
    guestListGamesPlayed:
      input.mode === 'normal' ? existing.guestListGamesPlayed + 1 : existing.guestListGamesPlayed,
    vipFloorGamesPlayed:
      input.mode === 'hard' ? existing.vipFloorGamesPlayed + 1 : existing.vipFloorGamesPlayed,
    skillGamesPlayed:
      input.mode === ARCADE_SKILL_DIFF_MODE
        ? existing.skillGamesPlayed + 1
        : existing.skillGamesPlayed,
  };

  writePassportStatsRegistry(registry);

  const leaderboard = readLeaderboardRegistry();
  const nextEntry: ArcadeGobMarketLeaderboardEntry = {
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
    .slice(0, ARCADE_GOB_MARKET_LEADERBOARD_SIZE);

  const otherModes = leaderboard.filter((entry) => entry.mode !== input.mode);
  writeLeaderboardRegistry([...otherModes, ...merged]);

  const updatedBoard = readArcadeGobMarketLeaderboard(input.mode);
  const rankIndex = updatedBoard.findIndex(
    (entry) =>
      entry.memberId === input.memberId &&
      entry.score === input.score &&
      entry.playedAtMs === playedAtMs,
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : updatedBoard.length + 1;

  return {
    score: input.score,
    tokensCollected: input.tokensCollected,
    mode: input.mode,
    rank,
    isPersonalBest,
  };
}

export function useArcadeGobMarketGameVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function resetArcadeGobMarketGameStoreForTests(): void {
  try {
    window.localStorage.removeItem(LEADERBOARD_KEY);
    window.localStorage.removeItem(PASSPORT_STATS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  storeVersion = 0;
}