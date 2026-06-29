import { beforeEach, describe, expect, it } from 'vitest';

import {
  ARCADE_GOB_MARKET_GAME_ID,
  ARCADE_GOB_MARKET_SURVIVE_BONUS,
  ARCADE_GOB_MARKET_TOKEN_SCORE,
  arcadeGobMarketGameConfig,
  arcadeGobMarketModeLabel,
  createArcadeGobMarketState,
  finalizeArcadeGobMarketRun,
  resetArcadeGobMarketIdCounterForTests,
  setArcadeGobMarketDirection,
  updateArcadeGobMarketState,
} from './arcade-gob-market-game.js';
import {
  recordArcadeGobMarketGameResult,
  resetArcadeGobMarketGameStoreForTests,
} from './arcade-gob-market-game-store.js';
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

describe('arcade-gob-market-game', () => {
  beforeEach(() => {
    resetArcadeGobMarketIdCounterForTests();
  });

  it('exposes the official gob market cabinet id and mode labels', () => {
    expect(ARCADE_GOB_MARKET_GAME_ID).toBe('nami-gob-market');
    expect(arcadeGobMarketModeLabel('normal')).toBe('Guest List');
    expect(arcadeGobMarketModeLabel('hard')).toBe('VIP Floor');
    expect(arcadeGobMarketModeLabel(ARCADE_SKILL_DIFF_MODE)).toBe('SKILL DIFF');
  });

  it('banks G when a list token is collected', () => {
    const config = arcadeGobMarketGameConfig('normal');
    const token = { id: 'token-1', x: 2, y: 1 };
    let state = {
      ...createArcadeGobMarketState(config),
      player: { x: 1, y: 1 },
      direction: 'right' as const,
      tokens: [token],
    };

    state = updateArcadeGobMarketState(state, config);

    expect(state.tokensCollected).toBe(1);
    expect(state.score).toBe(ARCADE_GOB_MARKET_TOKEN_SCORE);
    expect(state.tokens.some((entry) => entry.id === token.id)).toBe(false);
  });

  it('stops movement when the player hits a wall', () => {
    const config = arcadeGobMarketGameConfig('normal');
    let state = {
      ...createArcadeGobMarketState(config),
      player: { x: 1, y: 0 },
      direction: 'up' as const,
      tokens: [],
    };

    state = updateArcadeGobMarketState(state, config);

    expect(state.direction).toBeNull();
    expect(state.player).toEqual({ x: 1, y: 0 });
  });

  it('adds the survive bonus when the timer clears', () => {
    const config = arcadeGobMarketGameConfig('normal');
    const state = finalizeArcadeGobMarketRun(
      {
        ...createArcadeGobMarketState(config),
        score: 9,
        tokensCollected: 3,
      },
      true,
    );

    expect(state.completed).toBe(true);
    expect(state.score).toBe(9 + ARCADE_GOB_MARKET_SURVIVE_BONUS);
  });

  it('ignores reverse direction input', () => {
    const config = arcadeGobMarketGameConfig('normal');
    const state = setArcadeGobMarketDirection(
      {
        ...createArcadeGobMarketState(config),
        direction: 'right',
      },
      'left',
    );

    expect(state.direction).toBe('right');
  });
});

describe('arcade-gob-market-game-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    globalThis.localStorage = localStorage;
    globalThis.window = {
      localStorage,
      dispatchEvent: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as Window & typeof globalThis;

    resetArcadeGobMarketGameStoreForTests();
  });

  it('records leaderboard and passport stats', () => {
    const result = recordArcadeGobMarketGameResult({
      memberId: 'self',
      displayName: 'Tester',
      mode: 'normal',
      score: 17,
      tokensCollected: 4,
    });

    expect(result.rank).toBe(1);
    expect(result.isPersonalBest).toBe(true);
  });
});