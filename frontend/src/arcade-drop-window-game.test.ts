import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import {
  ARCADE_DROP_WINDOW_DROP_SCORE,
  ARCADE_DROP_WINDOW_GAME_DURATION_MS,
  ARCADE_DROP_WINDOW_GAME_ID,
  ARCADE_DROP_WINDOW_SKILL_COUNT,
  ARCADE_DROP_WINDOW_STATIC_KILL_SCORE,
  ARCADE_DROP_WINDOW_STARTING_LIVES,
  arcadeDropWindowGameConfig,
  arcadeDropWindowLivesAfterPress,
  arcadeDropWindowModeLabel,
  arcadeDropWindowPressLosesLife,
  arcadeDropWindowSurviveBonus,
  expireArcadeDropWindowSignal,
  isArcadeDropWindowSignalExpired,
  readArcadeDropWindowFromKey,
  resolveArcadeDropWindowPress,
  resolveArcadeDropWindowWindowPress,
  spawnArcadeDropWindowSignals,
} from './arcade-drop-window-game.js';
import {
  readArcadeDropWindowLeaderboard,
  recordArcadeDropWindowGameResult,
  resetArcadeDropWindowGameStoreForTests,
} from './arcade-drop-window-game-store.js';
import { ARCADE_SKILL_DIFF_MODE, ARCADE_SKILL_DIFF_MODE_LABEL } from './arcade-skill-diff.js';

describe('arcade-drop-window-game', () => {
  it('exposes the official drop window cabinet id and one-minute runs', () => {
    expect(ARCADE_DROP_WINDOW_GAME_ID).toBe('nami-drop-window');
    expect(ARCADE_DROP_WINDOW_GAME_DURATION_MS).toBe(60_000);
    expect(arcadeDropWindowModeLabel('normal')).toBe('Clean Signal');
    expect(arcadeDropWindowModeLabel('hard')).toBe('Static Storm');
    expect(arcadeDropWindowModeLabel(ARCADE_SKILL_DIFF_MODE)).toBe(ARCADE_SKILL_DIFF_MODE_LABEL);
  });

  it('opens five windows and floods faster in skill diff', () => {
    const normal = arcadeDropWindowGameConfig('normal');
    const skill = arcadeDropWindowGameConfig(ARCADE_SKILL_DIFF_MODE);

    expect(skill.windowCount).toBe(ARCADE_DROP_WINDOW_SKILL_COUNT);
    expect(skill.spawnIntervalMs).toBeLessThan(normal.spawnIntervalMs);
    expect(skill.spawnBatchMin).toBe(2);
    expect(skill.spawnBatchMax).toBe(3);
    expect(skill.maxConcurrentSignals).toBe(3);
    expect(readArcadeDropWindowFromKey('4', skill.windowCount)).toBe(3);
    expect(readArcadeDropWindowFromKey('5', skill.windowCount)).toBe(4);
  });

  it('spawns signal batches after the spawn interval', () => {
    const config = arcadeDropWindowGameConfig('normal');
    const spawned = spawnArcadeDropWindowSignals(config, 5_000, 0, []);

    expect(spawned.signals).toHaveLength(1);
    expect(spawned.signals[0]?.window).toBeGreaterThanOrEqual(0);
    expect(spawned.signals[0]?.window).toBeLessThan(3);
  });

  it('can keep multiple concurrent signals in skill diff', () => {
    const config = arcadeDropWindowGameConfig(ARCADE_SKILL_DIFF_MODE);
    const firstWave = spawnArcadeDropWindowSignals(config, 5_000, 0, []);

    expect(firstWave.signals.length).toBeGreaterThanOrEqual(2);

    const partialBoard = firstWave.signals.slice(0, 1);
    const secondWave = spawnArcadeDropWindowSignals(
      config,
      5_000 + config.spawnIntervalMs + 10,
      firstWave.lastSpawnAt,
      partialBoard,
    );

    expect(secondWave.signals.length).toBeGreaterThan(partialBoard.length);
    expect(secondWave.signals.length).toBeLessThanOrEqual(config.maxConcurrentSignals);
  });

  it('scores real drops and static kills in the correct window', () => {
    const dropSignal = {
      id: 'drop-1',
      window: 1,
      kind: 'drop' as const,
      spawnedAt: 1_000,
      expiresAt: 2_000,
    };
    const staticSignal = {
      id: 'static-1',
      window: 0,
      kind: 'static' as const,
      spawnedAt: 1_000,
      expiresAt: 2_000,
    };

    expect(resolveArcadeDropWindowPress(dropSignal, 1)).toEqual({
      type: 'caught-drop',
      scoreDelta: ARCADE_DROP_WINDOW_DROP_SCORE,
    });
    expect(resolveArcadeDropWindowPress(staticSignal, 0)).toEqual({
      type: 'killed-static',
      scoreDelta: ARCADE_DROP_WINDOW_STATIC_KILL_SCORE,
    });
    expect(resolveArcadeDropWindowPress(dropSignal, 0).type).toBe('empty-window');
  });

  it('flags empty-window presses when another window is active', () => {
    const signals = [
      {
        id: 'drop-1',
        window: 2,
        kind: 'drop' as const,
        spawnedAt: 1_000,
        expiresAt: 2_000,
      },
    ];

    const wrongPress = resolveArcadeDropWindowWindowPress(signals, 0);

    expect(wrongPress.result.type).toBe('empty-window');
    expect(wrongPress.resolvedSignalId).toBeNull();
  });

  it('tracks lives lost on empty-window presses', () => {
    const emptyPress = {
      type: 'empty-window' as const,
      scoreDelta: 0,
    };

    expect(ARCADE_DROP_WINDOW_STARTING_LIVES).toBe(5);
    expect(arcadeDropWindowPressLosesLife(emptyPress)).toBe(true);
    expect(arcadeDropWindowLivesAfterPress(5, emptyPress)).toBe(4);
    expect(arcadeDropWindowLivesAfterPress(1, emptyPress)).toBe(0);
  });

  it('maps window keys and expires signals', () => {
    const signal = {
      id: 'drop-2',
      window: 2,
      kind: 'drop' as const,
      spawnedAt: 1_000,
      expiresAt: 2_000,
    };

    expect(readArcadeDropWindowFromKey('3')).toBe(2);
    expect(isArcadeDropWindowSignalExpired(signal, 2_100)).toBe(true);
    expect(expireArcadeDropWindowSignal(signal).type).toBe('missed-drop');
    expect(arcadeDropWindowSurviveBonus(0, 12)).toBeGreaterThan(0);
  });
});

describe('arcade-drop-window-game-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetArcadeDropWindowGameStoreForTests();
  });

  it('records leaderboard scores per mode', () => {
    const cleanResult = recordArcadeDropWindowGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: 'normal',
      score: 28,
      dropsCaught: 6,
      staticKilled: 4,
    });

    expect(cleanResult.rank).toBe(1);
    expect(readArcadeDropWindowLeaderboard('normal')[0]?.score).toBe(28);

    const stormResult = recordArcadeDropWindowGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: 'hard',
      score: 16,
      dropsCaught: 3,
      staticKilled: 2,
    });

    expect(stormResult.rank).toBe(1);
    expect(readArcadeDropWindowLeaderboard('hard')[0]?.score).toBe(16);

    const skillResult = recordArcadeDropWindowGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: ARCADE_SKILL_DIFF_MODE,
      score: 30,
      dropsCaught: 7,
      staticKilled: 3,
    });

    expect(skillResult.rank).toBe(1);
    expect(readArcadeDropWindowLeaderboard(ARCADE_SKILL_DIFF_MODE)[0]?.score).toBe(30);
  });
});