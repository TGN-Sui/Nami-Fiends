export const ARCADE_INTEL_STACK_GAME_ID = 'nami-intel-stack';

export const ARCADE_INTEL_STACK_COLUMN_COUNT = 3;
export const ARCADE_INTEL_STACK_SKILL_COLUMN_COUNT = 5;
export const ARCADE_INTEL_STACK_GAME_DURATION_MS = 60_000;
export const ARCADE_INTEL_STACK_LEADERBOARD_SIZE = 10;
export const ARCADE_INTEL_STACK_CLEAN_SCORE = 3;
export const ARCADE_INTEL_STACK_PERFECT_SCORE = 5;
export const ARCADE_INTEL_STACK_LATE_SCORE = 1;
export const ARCADE_INTEL_STACK_EMPTY_PRESS_PENALTY = 1;
export const ARCADE_INTEL_STACK_MISSED_SIGNAL_PENALTY = 2;
export const ARCADE_INTEL_STACK_SURVIVE_BONUS = 8;
export const ARCADE_INTEL_STACK_MAX_TOWER_HEIGHT = 12;

import {
  arcadeSkillDiffFasterSpawnInterval,
  ARCADE_SKILL_DIFF_MODE,
  ARCADE_SKILL_DIFF_MODE_LABEL,
} from './arcade-skill-diff.js';

export type ArcadeIntelStackMode = 'normal' | 'hard' | typeof ARCADE_SKILL_DIFF_MODE;

export type ArcadeIntelStackPressQuality = 'perfect' | 'clean' | 'late';

export type ArcadeIntelStackGameConfig = {
  mode: ArcadeIntelStackMode;
  columnCount: number;
  spawnIntervalMs: number;
  signalLifeMs: number;
  maxConcurrentSignals: number;
  spawnBatchMin: number;
  spawnBatchMax: number;
};

export type ArcadeIntelStackSignal = {
  id: string;
  column: number;
  spawnedAt: number;
  expiresAt: number;
};

export type ArcadeIntelStackResolveResult =
  | { type: 'stacked'; quality: ArcadeIntelStackPressQuality; scoreDelta: number }
  | { type: 'empty-column'; scoreDelta: number }
  | { type: 'missed-signal'; scoreDelta: number };

const COLUMN_KEYS = ['1', 'q', 'Q', '2', 'w', 'W', '3', 'e', 'E', '4', 'r', 'R', '5', 't', 'T'] as const;

export function arcadeIntelStackGameConfig(mode: ArcadeIntelStackMode): ArcadeIntelStackGameConfig {
  if (mode === 'hard') {
    return {
      mode,
      columnCount: ARCADE_INTEL_STACK_COLUMN_COUNT,
      spawnIntervalMs: 850,
      signalLifeMs: 700,
      maxConcurrentSignals: 1,
      spawnBatchMin: 1,
      spawnBatchMax: 1,
    };
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return {
      mode,
      columnCount: ARCADE_INTEL_STACK_SKILL_COLUMN_COUNT,
      spawnIntervalMs: Math.max(120, Math.round(arcadeSkillDiffFasterSpawnInterval(1_200) / 2)),
      signalLifeMs: 550,
      maxConcurrentSignals: 2,
      spawnBatchMin: 1,
      spawnBatchMax: 2,
    };
  }

  return {
    mode,
    columnCount: ARCADE_INTEL_STACK_COLUMN_COUNT,
    spawnIntervalMs: 1_300,
    signalLifeMs: 1_100,
    maxConcurrentSignals: 1,
    spawnBatchMin: 1,
    spawnBatchMax: 1,
  };
}

export function arcadeIntelStackModeLabel(mode: ArcadeIntelStackMode): string {
  if (mode === 'hard') {
    return 'Surge Stack';
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return ARCADE_SKILL_DIFF_MODE_LABEL;
  }

  return 'Clean Stack';
}

export function readArcadeIntelStackFromKey(
  key: string,
  columnCount = ARCADE_INTEL_STACK_COLUMN_COUNT,
): number | null {
  if (key === '1' || key === 'q' || key === 'Q') {
    return 0;
  }

  if (key === '2' || key === 'w' || key === 'W') {
    return 1;
  }

  if (key === '3' || key === 'e' || key === 'E') {
    return 2;
  }

  if (columnCount > 3 && (key === '4' || key === 'r' || key === 'R')) {
    return 3;
  }

  if (columnCount > 4 && (key === '5' || key === 't' || key === 'T')) {
    return 4;
  }

  return null;
}

function createArcadeIntelStackSignal(
  config: ArcadeIntelStackGameConfig,
  column: number,
  now: number,
  index: number,
): ArcadeIntelStackSignal {
  return {
    id:
      'intel-stack-' +
      column +
      '-' +
      Math.floor(now) +
      '-' +
      index +
      '-' +
      Math.floor(Math.random() * 1_000),
    column,
    spawnedAt: now,
    expiresAt: now + config.signalLifeMs,
  };
}

function pickSpawnColumns(
  config: ArcadeIntelStackGameConfig,
  activeSignals: ArcadeIntelStackSignal[],
  batchSize: number,
): number[] {
  const occupied = new Set(activeSignals.map((signal) => signal.column));
  const openColumns = Array.from({ length: config.columnCount }, (_, column) => column).filter(
    (column) => !occupied.has(column),
  );

  if (openColumns.length === 0) {
    return [];
  }

  const shuffled = [...openColumns].sort(() => Math.random() - 0.5);
  const count = Math.min(batchSize, shuffled.length, config.maxConcurrentSignals - activeSignals.length);

  return shuffled.slice(0, count);
}

export function spawnArcadeIntelStackSignals(
  config: ArcadeIntelStackGameConfig,
  now: number,
  lastSpawnAt: number,
  activeSignals: ArcadeIntelStackSignal[],
): { signals: ArcadeIntelStackSignal[]; lastSpawnAt: number } {
  if (activeSignals.length >= config.maxConcurrentSignals) {
    return { signals: activeSignals, lastSpawnAt };
  }

  if (now - lastSpawnAt < config.spawnIntervalMs) {
    return { signals: activeSignals, lastSpawnAt };
  }

  const batchSize =
    config.spawnBatchMin +
    Math.floor(Math.random() * (config.spawnBatchMax - config.spawnBatchMin + 1));
  const columns = pickSpawnColumns(config, activeSignals, batchSize);

  if (columns.length === 0) {
    return { signals: activeSignals, lastSpawnAt };
  }

  const spawned = columns.map((column, index) => createArcadeIntelStackSignal(config, column, now, index));

  return {
    signals: [...activeSignals, ...spawned],
    lastSpawnAt: now,
  };
}

export function findArcadeIntelStackSignalInColumn(
  signals: ArcadeIntelStackSignal[],
  column: number,
): ArcadeIntelStackSignal | null {
  return signals.find((signal) => signal.column === column) ?? null;
}

export function arcadeIntelStackSignalProgress(signal: ArcadeIntelStackSignal, now: number): number {
  const total = signal.expiresAt - signal.spawnedAt;

  if (total <= 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, (now - signal.spawnedAt) / total));
}

export function arcadeIntelStackPressQuality(
  signal: ArcadeIntelStackSignal,
  now: number,
): ArcadeIntelStackPressQuality {
  const progress = arcadeIntelStackSignalProgress(signal, now);

  if (progress >= 0.75) {
    return 'perfect';
  }

  if (progress <= 0.25) {
    return 'late';
  }

  return 'clean';
}

export function arcadeIntelStackStackScore(quality: ArcadeIntelStackPressQuality): number {
  if (quality === 'perfect') {
    return ARCADE_INTEL_STACK_PERFECT_SCORE;
  }

  if (quality === 'late') {
    return ARCADE_INTEL_STACK_LATE_SCORE;
  }

  return ARCADE_INTEL_STACK_CLEAN_SCORE;
}

export function resolveArcadeIntelStackColumnPress(
  signals: ArcadeIntelStackSignal[],
  column: number,
  now: number,
): { result: ArcadeIntelStackResolveResult; resolvedSignalId: string | null } {
  const target = findArcadeIntelStackSignalInColumn(signals, column);

  if (target !== null) {
    const quality = arcadeIntelStackPressQuality(target, now);

    return {
      result: {
        type: 'stacked',
        quality,
        scoreDelta: arcadeIntelStackStackScore(quality),
      },
      resolvedSignalId: target.id,
    };
  }

  return {
    result: {
      type: 'empty-column',
      scoreDelta: signals.length > 0 ? -ARCADE_INTEL_STACK_EMPTY_PRESS_PENALTY : 0,
    },
    resolvedSignalId: null,
  };
}

export function removeArcadeIntelStackSignal(
  signals: ArcadeIntelStackSignal[],
  signalId: string,
): ArcadeIntelStackSignal[] {
  return signals.filter((signal) => signal.id !== signalId);
}

export function isArcadeIntelStackSignalExpired(signal: ArcadeIntelStackSignal, now: number): boolean {
  return now >= signal.expiresAt;
}

export function expireArcadeIntelStackSignals(
  signals: ArcadeIntelStackSignal[],
  now: number,
): { signals: ArcadeIntelStackSignal[]; results: ArcadeIntelStackResolveResult[] } {
  const results: ArcadeIntelStackResolveResult[] = [];
  const nextSignals: ArcadeIntelStackSignal[] = [];

  for (const signal of signals) {
    if (isArcadeIntelStackSignalExpired(signal, now)) {
      results.push({
        type: 'missed-signal',
        scoreDelta: -ARCADE_INTEL_STACK_MISSED_SIGNAL_PENALTY,
      });
      continue;
    }

    nextSignals.push(signal);
  }

  return { signals: nextSignals, results };
}

export function arcadeIntelStackTowerAfterMiss(
  towerHeights: number[],
  column: number,
): number[] {
  return towerHeights.map((height, index) =>
    index === column ? Math.max(0, height - 1) : height,
  );
}

export function arcadeIntelStackTowerAfterStack(
  towerHeights: number[],
  column: number,
): number[] {
  return towerHeights.map((height, index) =>
    index === column
      ? Math.min(ARCADE_INTEL_STACK_MAX_TOWER_HEIGHT, height + 1)
      : height,
  );
}

export function createArcadeIntelStackTowerHeights(columnCount: number): number[] {
  return Array.from({ length: columnCount }, () => 0);
}

export function arcadeIntelStackSurviveBonus(remainingMs: number, score: number): number {
  return remainingMs <= 0 && score > 0 ? ARCADE_INTEL_STACK_SURVIVE_BONUS : 0;
}

export function arcadeIntelStackAcceptedKeys(): readonly string[] {
  return COLUMN_KEYS;
}