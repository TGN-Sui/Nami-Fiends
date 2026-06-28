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
  ARCADE_BUBBLE_GAME_DURATION_MS,
  ARCADE_BUBBLE_GAME_ID,
  GOON_POP_BUBBLE_LABELS,
  arcadeBubbleGameConfig,
  arcadeBubbleModeLabel,
  formatGoonPopG,
  spawnArcadeBubble,
} from './arcade-bubble-game.js';
import {
  readArcadeBubbleLeaderboard,
  readMemberArcadeBubblePassportStats,
  recordArcadeBubbleGameResult,
  recordArcadeBubblePop,
  resetArcadeBubbleGameStoreForTests,
} from './arcade-bubble-game-store.js';

describe('arcade-bubble-game', () => {
  it('exposes the official bubble cabinet id and one-minute runs', () => {
    expect(ARCADE_BUBBLE_GAME_ID).toBe('nami-bubble-pop');
    expect(ARCADE_BUBBLE_GAME_DURATION_MS).toBe(60_000);
  });

  it('uses easier taps in normal mode and tougher taps in hard mode', () => {
    expect(arcadeBubbleGameConfig('normal')).toMatchObject({
      smallClicksRequired: 1,
      bigClicksRequired: 3,
      smallPoints: 1,
      bigPoints: 2,
    });
    expect(arcadeBubbleGameConfig('hard')).toMatchObject({
      smallClicksRequired: 2,
      bigClicksRequired: 4,
      riseSpeedMin: 1.1,
    });
    expect(arcadeBubbleGameConfig('hard').riseSpeedMin).toBeGreaterThan(
      arcadeBubbleGameConfig('normal').riseSpeedMin,
    );
  });

  it('spawns bubbles with randomized lifetimes and point values', () => {
    const bubble = spawnArcadeBubble(640, 420, 1_000, arcadeBubbleGameConfig('normal'));

    expect(bubble.popClicksRequired).toBeGreaterThan(0);
    expect(bubble.lifetimeMs).toBeGreaterThanOrEqual(7_500);
    expect(bubble.lifetimeMs).toBeLessThanOrEqual(16_500);
    expect([1, 2]).toContain(bubble.points);
    expect(GOON_POP_BUBBLE_LABELS).toContain(bubble.label);
  });

  it('uses Goon Pop run labels and G formatting', () => {
    expect(arcadeBubbleModeLabel('normal')).toBe('Alley Run');
    expect(arcadeBubbleModeLabel('hard')).toBe('Heat Run');
    expect(formatGoonPopG(2)).toBe('2 G');
    expect(formatGoonPopG(2, true)).toBe('+2 G');
  });
});

describe('arcade-bubble-game-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetArcadeBubbleGameStoreForTests();
  });

  it('records passport pops and leaderboard scores per mode', () => {

    recordArcadeBubblePop('m1', 3);
    expect(readMemberArcadeBubblePassportStats('m1').totalBubblesPopped).toBe(3);

    const normalResult = recordArcadeBubbleGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: 'normal',
      score: 18,
      bubblesPopped: 9,
    });

    expect(normalResult.rank).toBe(1);
    expect(readArcadeBubbleLeaderboard('normal')[0]?.score).toBe(18);
    expect(readMemberArcadeBubblePassportStats('m1').bestNormalScore).toBe(18);

    const hardResult = recordArcadeBubbleGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: 'hard',
      score: 11,
      bubblesPopped: 5,
    });

    expect(hardResult.rank).toBe(1);
    expect(readArcadeBubbleLeaderboard('hard')[0]?.score).toBe(11);
    expect(readMemberArcadeBubblePassportStats('m1').bestHardScore).toBe(11);
    expect(readMemberArcadeBubblePassportStats('m1').totalBubblesPopped).toBe(3);
  });
});