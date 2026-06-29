import { beforeEach, describe, expect, it } from 'vitest';

import {
  ARCADE_STEALTH_GOON_GAME_ID,
  ARCADE_STEALTH_GOON_LINK_SCORE,
  ARCADE_STEALTH_GOON_SURVIVE_BONUS,
  arcadeStealthGoonGameConfig,
  arcadeStealthGoonModeLabel,
  createArcadeStealthGoonState,
  finalizeArcadeStealthGoonRun,
  queueArcadeStealthGoonDirection,
  resetArcadeStealthGoonIdCounterForTests,
  updateArcadeStealthGoonState,
} from './arcade-stealth-goon-game.js';
import {
  recordArcadeStealthGoonGameResult,
  resetArcadeStealthGoonGameStoreForTests,
} from './arcade-stealth-goon-game-store.js';
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

describe('arcade-stealth-goon-game', () => {
  beforeEach(() => {
    resetArcadeStealthGoonIdCounterForTests();
  });

  it('exposes the official stealth goon cabinet id and mode labels', () => {
    expect(ARCADE_STEALTH_GOON_GAME_ID).toBe('nami-stealth-goon');
    expect(arcadeStealthGoonModeLabel('normal')).toBe('Low Profile');
    expect(arcadeStealthGoonModeLabel('hard')).toBe('Heat Patrol');
    expect(arcadeStealthGoonModeLabel(ARCADE_SKILL_DIFF_MODE)).toBe('SKILL DIFF');
  });

  it('grows the squad chain when a link is collected', () => {
    const config = arcadeStealthGoonGameConfig('normal');
    let state = createArcadeStealthGoonState(config);
    const link = state.link;

    expect(link).toBeTruthy();

    state = {
      ...state,
      snake: [{ x: link!.x - 1, y: link!.y }, { x: link!.x - 2, y: link!.y }],
      direction: 'right',
      link,
    };

    state = updateArcadeStealthGoonState(state, config);

    expect(state.linksCollected).toBe(1);
    expect(state.score).toBe(ARCADE_STEALTH_GOON_LINK_SCORE);
    expect(state.snake).toHaveLength(3);
  });

  it('ends the run on a wall collision', () => {
    const config = arcadeStealthGoonGameConfig('normal');
    let state = {
      ...createArcadeStealthGoonState(config),
      snake: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      direction: 'left' as const,
      queuedDirection: null,
    };

    state = updateArcadeStealthGoonState(state, config);

    expect(state.dead).toBe(true);
  });

  it('adds the survive bonus when the timer clears', () => {
    const config = arcadeStealthGoonGameConfig('normal');
    const state = finalizeArcadeStealthGoonRun(
      {
        ...createArcadeStealthGoonState(config),
        score: 6,
        linksCollected: 3,
      },
      true,
    );

    expect(state.completed).toBe(true);
    expect(state.score).toBe(6 + ARCADE_STEALTH_GOON_SURVIVE_BONUS);
  });

  it('ignores reverse direction input', () => {
    const config = arcadeStealthGoonGameConfig('normal');
    const state = queueArcadeStealthGoonDirection(createArcadeStealthGoonState(config), 'left');

    expect(state.queuedDirection).toBeNull();
  });
});

describe('arcade-stealth-goon-game-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    globalThis.localStorage = localStorage;
    globalThis.window = {
      localStorage,
      dispatchEvent: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as Window & typeof globalThis;

    resetArcadeStealthGoonGameStoreForTests();
  });

  it('records leaderboard and passport stats', () => {
    const result = recordArcadeStealthGoonGameResult({
      memberId: 'self',
      displayName: 'Tester',
      mode: 'normal',
      score: 14,
      linksCollected: 3,
    });

    expect(result.rank).toBe(1);
    expect(result.isPersonalBest).toBe(true);
  });
});