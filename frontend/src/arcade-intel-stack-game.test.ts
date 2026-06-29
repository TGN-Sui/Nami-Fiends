import { beforeEach, describe, expect, it } from 'vitest';

import {
  ARCADE_INTEL_STACK_CLEAN_SCORE,
  ARCADE_INTEL_STACK_GAME_ID,
  ARCADE_INTEL_STACK_MISSED_SIGNAL_PENALTY,
  ARCADE_INTEL_STACK_PERFECT_SCORE,
  ARCADE_INTEL_STACK_SURVIVE_BONUS,
  arcadeIntelStackGameConfig,
  arcadeIntelStackModeLabel,
  arcadeIntelStackPressQuality,
  arcadeIntelStackSignalProgress,
  arcadeIntelStackStackScore,
  arcadeIntelStackSurviveBonus,
  arcadeIntelStackTowerAfterMiss,
  arcadeIntelStackTowerAfterStack,
  createArcadeIntelStackTowerHeights,
  expireArcadeIntelStackSignals,
  readArcadeIntelStackFromKey,
  resolveArcadeIntelStackColumnPress,
  spawnArcadeIntelStackSignals,
  type ArcadeIntelStackSignal,
} from './arcade-intel-stack-game.js';
import {
  recordArcadeIntelStackGameResult,
  resetArcadeIntelStackGameStoreForTests,
} from './arcade-intel-stack-game-store.js';
import { ARCADE_SKILL_DIFF_MODE } from './arcade-skill-diff.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('arcade-intel-stack-game', () => {
  it('exposes the official intel stack cabinet id and mode labels', () => {
    expect(ARCADE_INTEL_STACK_GAME_ID).toBe('nami-intel-stack');
    expect(arcadeIntelStackModeLabel('normal')).toBe('Clean Stack');
    expect(arcadeIntelStackModeLabel('hard')).toBe('Surge Stack');
    expect(arcadeIntelStackModeLabel(ARCADE_SKILL_DIFF_MODE)).toBe('SKILL DIFF');
  });

  it('maps column keys to stack lanes', () => {
    expect(readArcadeIntelStackFromKey('1')).toBe(0);
    expect(readArcadeIntelStackFromKey('w')).toBe(1);
    expect(readArcadeIntelStackFromKey('E')).toBe(2);
    expect(readArcadeIntelStackFromKey('r', 5)).toBe(3);
    expect(readArcadeIntelStackFromKey('t', 5)).toBe(4);
    expect(readArcadeIntelStackFromKey('x')).toBeNull();
  });

  it('scores perfect stacks higher than clean stacks', () => {
    const signal: ArcadeIntelStackSignal = {
      id: 'signal-1',
      column: 1,
      spawnedAt: 1_000,
      expiresAt: 2_000,
    };

    expect(arcadeIntelStackPressQuality(signal, 1_850)).toBe('perfect');
    expect(arcadeIntelStackStackScore('perfect')).toBe(ARCADE_INTEL_STACK_PERFECT_SCORE);
    expect(arcadeIntelStackStackScore('clean')).toBe(ARCADE_INTEL_STACK_CLEAN_SCORE);
  });

  it('spawns and resolves column presses', () => {
    const config = arcadeIntelStackGameConfig('normal');
    const spawned = spawnArcadeIntelStackSignals(config, 2_000, 0, []);

    expect(spawned.signals).toHaveLength(1);

    const signal = spawned.signals[0]!;
    const resolved = resolveArcadeIntelStackColumnPress(spawned.signals, signal.column, 1_500);

    expect(resolved.result.type).toBe('stacked');
    if (resolved.result.type === 'stacked') {
      expect(resolved.result.scoreDelta).toBeGreaterThan(0);
    }
  });

  it('penalizes missed signals and trims tower height', () => {
    const signal: ArcadeIntelStackSignal = {
      id: 'signal-expired',
      column: 2,
      spawnedAt: 0,
      expiresAt: 10,
    };
    const expired = expireArcadeIntelStackSignals([signal], 20);

    expect(expired.results[0]?.type).toBe('missed-signal');
    expect(expired.results[0]?.scoreDelta).toBe(-ARCADE_INTEL_STACK_MISSED_SIGNAL_PENALTY);

    const towers = createArcadeIntelStackTowerHeights(3);
    const trimmed = arcadeIntelStackTowerAfterMiss([2, 4, 6], 2);

    expect(trimmed[2]).toBe(5);
    expect(arcadeIntelStackTowerAfterStack(towers, 1)).toEqual([0, 1, 0]);
  });

  it('tracks signal progress toward expiry', () => {
    const signal: ArcadeIntelStackSignal = {
      id: 'signal-progress',
      column: 0,
      spawnedAt: 0,
      expiresAt: 1_000,
    };

    expect(arcadeIntelStackSignalProgress(signal, 500)).toBeCloseTo(0.5, 2);
  });

  it('awards survive bonus when the run ends above zero', () => {
    expect(arcadeIntelStackSurviveBonus(0, 12)).toBe(ARCADE_INTEL_STACK_SURVIVE_BONUS);
    expect(arcadeIntelStackSurviveBonus(0, 0)).toBe(0);
  });
});

describe('arcade-intel-stack-game-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorage,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage, dispatchEvent: () => undefined },
      configurable: true,
    });
    resetArcadeIntelStackGameStoreForTests();
  });

  it('records leaderboard entries and passport stats', () => {
    const result = recordArcadeIntelStackGameResult({
      memberId: 'member-1',
      displayName: 'Stack Runner',
      mode: 'normal',
      score: 42,
      signalsStacked: 9,
      perfectStacks: 2,
    });

    expect(result.rank).toBe(1);
    expect(result.isPersonalBest).toBe(true);
    expect(result.signalsStacked).toBe(9);
    expect(result.perfectStacks).toBe(2);
  });
});