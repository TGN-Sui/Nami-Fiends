export const ARCADE_DROP_WINDOW_GAME_ID = 'nami-drop-window';

export const ARCADE_DROP_WINDOW_COUNT = 3;
export const ARCADE_DROP_WINDOW_SKILL_COUNT = 5;
export const ARCADE_DROP_WINDOW_GAME_DURATION_MS = 60_000;
export const ARCADE_DROP_WINDOW_LEADERBOARD_SIZE = 10;
export const ARCADE_DROP_WINDOW_DROP_SCORE = 4;
export const ARCADE_DROP_WINDOW_STATIC_KILL_SCORE = 2;
export const ARCADE_DROP_WINDOW_WRONG_WINDOW_PENALTY = 2;
export const ARCADE_DROP_WINDOW_MISSED_DROP_PENALTY = 3;
export const ARCADE_DROP_WINDOW_MISSED_STATIC_PENALTY = 1;
export const ARCADE_DROP_WINDOW_SURVIVE_BONUS = 8;
export const ARCADE_DROP_WINDOW_STARTING_LIVES = 5;
export const ARCADE_DROP_WINDOW_HIT_FLASH_MS = 320;

import {
  arcadeSkillDiffFasterSpawnInterval,
  ARCADE_SKILL_DIFF_MODE,
  ARCADE_SKILL_DIFF_MODE_LABEL,
} from './arcade-skill-diff.js';

export type ArcadeDropWindowMode = 'normal' | 'hard' | typeof ARCADE_SKILL_DIFF_MODE;
export type ArcadeDropWindowSignalKind = 'drop' | 'static';

export type ArcadeDropWindowGameConfig = {
  mode: ArcadeDropWindowMode;
  windowCount: number;
  spawnIntervalMs: number;
  dropWindowMs: number;
  staticWindowMs: number;
  staticChance: number;
  spawnBatchMin: number;
  spawnBatchMax: number;
  maxConcurrentSignals: number;
};

export type ArcadeDropWindowSignal = {
  id: string;
  window: number;
  kind: ArcadeDropWindowSignalKind;
  spawnedAt: number;
  expiresAt: number;
};

export type ArcadeDropWindowResolveResult =
  | { type: 'caught-drop'; scoreDelta: number }
  | { type: 'killed-static'; scoreDelta: number }
  | { type: 'empty-window'; scoreDelta: number }
  | { type: 'missed-drop'; scoreDelta: number }
  | { type: 'missed-static'; scoreDelta: number };

const WINDOW_KEYS = ['1', 'q', 'Q', '2', 'w', 'W', '3', 'e', 'E', '4', 'r', 'R', '5', 't', 'T'] as const;

export function arcadeDropWindowGameConfig(mode: ArcadeDropWindowMode): ArcadeDropWindowGameConfig {
  if (mode === 'hard') {
    return {
      mode,
      windowCount: ARCADE_DROP_WINDOW_COUNT,
      spawnIntervalMs: 900,
      dropWindowMs: 750,
      staticWindowMs: 1_000,
      staticChance: 0.58,
      spawnBatchMin: 1,
      spawnBatchMax: 1,
      maxConcurrentSignals: 1,
    };
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return {
      mode,
      windowCount: ARCADE_DROP_WINDOW_SKILL_COUNT,
      spawnIntervalMs: Math.max(120, Math.round(arcadeSkillDiffFasterSpawnInterval(1_400) / 2)),
      dropWindowMs: 620,
      staticWindowMs: 780,
      staticChance: 0.45,
      spawnBatchMin: 2,
      spawnBatchMax: 3,
      maxConcurrentSignals: 3,
    };
  }

  return {
    mode,
    windowCount: ARCADE_DROP_WINDOW_COUNT,
    spawnIntervalMs: 1_400,
    dropWindowMs: 1_100,
    staticWindowMs: 1_400,
    staticChance: 0.38,
    spawnBatchMin: 1,
    spawnBatchMax: 1,
    maxConcurrentSignals: 1,
  };
}

export function arcadeDropWindowModeLabel(mode: ArcadeDropWindowMode): string {
  if (mode === 'hard') {
    return 'Static Storm';
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return ARCADE_SKILL_DIFF_MODE_LABEL;
  }

  return 'Clean Signal';
}

export function readArcadeDropWindowFromKey(key: string, windowCount = ARCADE_DROP_WINDOW_COUNT): number | null {
  if (key === '1' || key === 'q' || key === 'Q') {
    return 0;
  }

  if (key === '2' || key === 'w' || key === 'W') {
    return 1;
  }

  if (key === '3' || key === 'e' || key === 'E') {
    return 2;
  }

  if (windowCount > 3 && (key === '4' || key === 'r' || key === 'R')) {
    return 3;
  }

  if (windowCount > 4 && (key === '5' || key === 't' || key === 'T')) {
    return 4;
  }

  return null;
}

function randomSignalKind(staticChance: number): ArcadeDropWindowSignalKind {
  return Math.random() < staticChance ? 'static' : 'drop';
}

function createArcadeDropWindowSignal(
  config: ArcadeDropWindowGameConfig,
  window: number,
  now: number,
  index: number,
): ArcadeDropWindowSignal {
  const kind = randomSignalKind(config.staticChance);
  const windowMs = kind === 'drop' ? config.dropWindowMs : config.staticWindowMs;

  return {
    id: 'drop-window-' + window + '-' + Math.floor(now) + '-' + index + '-' + Math.floor(Math.random() * 1_000),
    window,
    kind,
    spawnedAt: now,
    expiresAt: now + windowMs,
  };
}

function pickSpawnWindows(
  config: ArcadeDropWindowGameConfig,
  activeSignals: ArcadeDropWindowSignal[],
  batchSize: number,
): number[] {
  const occupied = new Set(activeSignals.map((signal) => signal.window));
  const openWindows = Array.from({ length: config.windowCount }, (_, window) => window).filter(
    (window) => !occupied.has(window),
  );

  if (openWindows.length === 0) {
    return [];
  }

  const shuffled = [...openWindows].sort(() => Math.random() - 0.5);
  const count = Math.min(batchSize, shuffled.length, config.maxConcurrentSignals - activeSignals.length);

  return shuffled.slice(0, count);
}

export function spawnArcadeDropWindowSignals(
  config: ArcadeDropWindowGameConfig,
  now: number,
  lastSpawnAt: number,
  activeSignals: ArcadeDropWindowSignal[],
): { signals: ArcadeDropWindowSignal[]; lastSpawnAt: number } {
  if (activeSignals.length >= config.maxConcurrentSignals) {
    return { signals: activeSignals, lastSpawnAt };
  }

  if (now - lastSpawnAt < config.spawnIntervalMs) {
    return { signals: activeSignals, lastSpawnAt };
  }

  const batchSize =
    config.spawnBatchMin +
    Math.floor(Math.random() * (config.spawnBatchMax - config.spawnBatchMin + 1));
  const windows = pickSpawnWindows(config, activeSignals, batchSize);

  if (windows.length === 0) {
    return { signals: activeSignals, lastSpawnAt };
  }

  const spawned = windows.map((window, index) => createArcadeDropWindowSignal(config, window, now, index));

  return {
    signals: [...activeSignals, ...spawned],
    lastSpawnAt: now,
  };
}

/** @deprecated Use spawnArcadeDropWindowSignals for multi-drop support. */
export function spawnArcadeDropWindowSignal(
  config: ArcadeDropWindowGameConfig,
  now: number,
  lastResolvedAt: number,
  activeSignal: ArcadeDropWindowSignal | null,
): ArcadeDropWindowSignal | null {
  const activeSignals = activeSignal ? [activeSignal] : [];
  const spawned = spawnArcadeDropWindowSignals(config, now, lastResolvedAt, activeSignals);

  if (spawned.signals.length === activeSignals.length) {
    return activeSignal;
  }

  return spawned.signals[spawned.signals.length - 1] ?? null;
}

export function findArcadeDropWindowSignalInWindow(
  signals: ArcadeDropWindowSignal[],
  window: number,
): ArcadeDropWindowSignal | null {
  return signals.find((signal) => signal.window === window) ?? null;
}

export function resolveArcadeDropWindowPress(
  signal: ArcadeDropWindowSignal,
  window: number,
): ArcadeDropWindowResolveResult {
  if (window !== signal.window) {
    return {
      type: 'empty-window',
      scoreDelta: -ARCADE_DROP_WINDOW_WRONG_WINDOW_PENALTY,
    };
  }

  if (signal.kind === 'drop') {
    return { type: 'caught-drop', scoreDelta: ARCADE_DROP_WINDOW_DROP_SCORE };
  }

  return { type: 'killed-static', scoreDelta: ARCADE_DROP_WINDOW_STATIC_KILL_SCORE };
}

export function resolveArcadeDropWindowWindowPress(
  signals: ArcadeDropWindowSignal[],
  window: number,
): { result: ArcadeDropWindowResolveResult; resolvedSignalId: string | null } {
  const target = findArcadeDropWindowSignalInWindow(signals, window);

  if (target !== null) {
    return {
      result: resolveArcadeDropWindowPress(target, window),
      resolvedSignalId: target.id,
    };
  }

  return {
    result: {
      type: 'empty-window',
      scoreDelta:
        signals.length > 0 ? -ARCADE_DROP_WINDOW_WRONG_WINDOW_PENALTY : 0,
    },
    resolvedSignalId: null,
  };
}

export function arcadeDropWindowPressLosesLife(result: ArcadeDropWindowResolveResult): boolean {
  return result.type === 'empty-window';
}

export function arcadeDropWindowLivesAfterPress(
  lives: number,
  result: ArcadeDropWindowResolveResult,
): number {
  if (!arcadeDropWindowPressLosesLife(result)) {
    return lives;
  }

  return Math.max(0, lives - 1);
}

export function removeArcadeDropWindowSignal(
  signals: ArcadeDropWindowSignal[],
  signalId: string,
): ArcadeDropWindowSignal[] {
  return signals.filter((signal) => signal.id !== signalId);
}

export function expireArcadeDropWindowSignal(
  signal: ArcadeDropWindowSignal,
): ArcadeDropWindowResolveResult {
  if (signal.kind === 'drop') {
    return { type: 'missed-drop', scoreDelta: -ARCADE_DROP_WINDOW_MISSED_DROP_PENALTY };
  }

  return { type: 'missed-static', scoreDelta: -ARCADE_DROP_WINDOW_MISSED_STATIC_PENALTY };
}

export function isArcadeDropWindowSignalExpired(
  signal: ArcadeDropWindowSignal,
  now: number,
): boolean {
  return now >= signal.expiresAt;
}

export function expireArcadeDropWindowSignals(
  signals: ArcadeDropWindowSignal[],
  now: number,
): { signals: ArcadeDropWindowSignal[]; results: ArcadeDropWindowResolveResult[] } {
  const results: ArcadeDropWindowResolveResult[] = [];
  const nextSignals: ArcadeDropWindowSignal[] = [];

  for (const signal of signals) {
    if (isArcadeDropWindowSignalExpired(signal, now)) {
      results.push(expireArcadeDropWindowSignal(signal));
      continue;
    }

    nextSignals.push(signal);
  }

  return { signals: nextSignals, results };
}

export function arcadeDropWindowSignalProgress(
  signal: ArcadeDropWindowSignal,
  now: number,
): number {
  const total = signal.expiresAt - signal.spawnedAt;

  if (total <= 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, (now - signal.spawnedAt) / total));
}

export function arcadeDropWindowSurviveBonus(
  remainingMs: number,
  score: number,
): number {
  return remainingMs <= 0 && score > 0 ? ARCADE_DROP_WINDOW_SURVIVE_BONUS : 0;
}

export function arcadeDropWindowAcceptedKeys(): readonly string[] {
  return WINDOW_KEYS;
}