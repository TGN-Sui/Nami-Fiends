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
  ARCADE_ALLEY_PUSH_CREW_PASS_LANE,
  ARCADE_ALLEY_PUSH_CREW_PASS_SCORE,
  ARCADE_ALLEY_PUSH_GAME_DURATION_MS,
  ARCADE_ALLEY_PUSH_GAME_ID,
  ARCADE_ALLEY_PUSH_LANE_CHANGE_COOLDOWN_MS,
  ARCADE_ALLEY_PUSH_PASS_COOLDOWN_MS,
  applyArcadeAlleyPushLaneStep,
  arcadeAlleyPushCollision,
  arcadeAlleyPushGameConfig,
  arcadeAlleyPushHazardTrackY,
  arcadeAlleyPushModeLabel,
  createArcadeAlleyPushPlayer,
  isArcadeAlleyPushHazardVisible,
  moveArcadeAlleyPushPlayerHorizontal,
  shouldAwardArcadeAlleyPushPass,
  spawnArcadeAlleyPushHazards,
  stepArcadeAlleyPushPlayer,
  updateArcadeAlleyPushHazards,
} from './arcade-alley-push-game.js';
import {
  readArcadeAlleyPushLeaderboard,
  recordArcadeAlleyPushGameResult,
  resetArcadeAlleyPushGameStoreForTests,
} from './arcade-alley-push-game-store.js';

describe('arcade-alley-push-game', () => {
  it('exposes the official alley push cabinet id and one-minute runs', () => {
    expect(ARCADE_ALLEY_PUSH_GAME_ID).toBe('nami-alley-push');
    expect(ARCADE_ALLEY_PUSH_GAME_DURATION_MS).toBe(60_000);
    expect(ARCADE_ALLEY_PUSH_CREW_PASS_SCORE).toBe(5);
  });

  it('uses easier traffic in street pass and tougher traffic in heat chase', () => {
    expect(arcadeAlleyPushGameConfig('normal')).toMatchObject({
      hazardTracksPerLane: 1,
      hazardsPerLane: 3,
    });
    expect(arcadeAlleyPushGameConfig('hard')).toMatchObject({
      hazardTracksPerLane: 3,
      hazardsPerLane: 1,
    });
    expect(arcadeAlleyPushGameConfig('hard').hazardSpeedMin).toBeGreaterThan(
      arcadeAlleyPushGameConfig('normal').hazardSpeedMin,
    );
  });

  it('stacks three hazard tracks per lane in heat chase', () => {
    const hazards = spawnArcadeAlleyPushHazards(arcadeAlleyPushGameConfig('hard'));
    const laneOneHazards = hazards.filter((hazard) => hazard.lane === 1);

    expect(laneOneHazards).toHaveLength(3);
    expect(new Set(laneOneHazards.map((hazard) => hazard.track))).toEqual(new Set([0, 1, 2]));
    expect(arcadeAlleyPushHazardTrackY(0, 3)).toBe(24);
    expect(arcadeAlleyPushHazardTrackY(1, 3)).toBe(50);
    expect(arcadeAlleyPushHazardTrackY(2, 3)).toBe(76);
  });

  it('labels alley push modes and detects hazard collisions', () => {
    const config = arcadeAlleyPushGameConfig('normal');

    expect(arcadeAlleyPushModeLabel('normal')).toBe('Street Pass');
    expect(arcadeAlleyPushModeLabel('hard')).toBe('Heat Chase');

    const player = {
      ...createArcadeAlleyPushPlayer(1_000),
      lane: 2,
      track: 1,
      x: 50,
      invincibleUntil: 0,
    };
    const hazards = spawnArcadeAlleyPushHazards(config);
    const laneHazard = hazards.find((hazard) => hazard.lane === 2);

    expect(laneHazard).toBeTruthy();
    expect(
      arcadeAlleyPushCollision(
        player,
        [{ ...laneHazard!, x: 50 }],
        2_000,
        config,
      ),
    ).toBeTruthy();
  });

  it('steps lanes on key presses and moves horizontally while held', () => {
    const config = arcadeAlleyPushGameConfig('normal');
    const start = createArcadeAlleyPushPlayer(1_000);

    expect(stepArcadeAlleyPushPlayer(start, 'up', config).lane).toBe(1);
    expect(stepArcadeAlleyPushPlayer({ ...start, lane: 1 }, 'down', config).lane).toBe(0);

    const moved = moveArcadeAlleyPushPlayerHorizontal(
      start,
      { left: false, right: true },
      config,
    );

    expect(moved.lane).toBe(0);
    expect(moved.x).toBeGreaterThan(50);
  });

  it('moves between vertical tracks and lanes in heat chase', () => {
    const config = arcadeAlleyPushGameConfig('hard');
    const start = createArcadeAlleyPushPlayer(1_000);

    expect(stepArcadeAlleyPushPlayer(start, 'up', config)).toMatchObject({
      lane: 1,
      track: 2,
    });

    const laneOneTop = stepArcadeAlleyPushPlayer(
      { ...start, lane: 1, track: 0 },
      'up',
      config,
    );

    expect(laneOneTop).toMatchObject({
      lane: 2,
      track: 2,
    });

    const laneTwoBottom = stepArcadeAlleyPushPlayer(
      { ...start, lane: 2, track: 2 },
      'down',
      config,
    );

    expect(laneTwoBottom).toMatchObject({
      lane: 1,
      track: 0,
    });

    const laneOneMiddle = stepArcadeAlleyPushPlayer(
      { ...start, lane: 1, track: 1 },
      'down',
      config,
    );

    expect(laneOneMiddle).toMatchObject({
      lane: 1,
      track: 2,
    });
  });

  it('only collides with hazards on the same vertical track in heat chase', () => {
    const config = arcadeAlleyPushGameConfig('hard');
    const player = {
      ...createArcadeAlleyPushPlayer(1_000),
      lane: 2,
      track: 1,
      x: 50,
      invincibleUntil: 0,
    };
    const topHazard = {
      id: 'top',
      lane: 2,
      track: 0,
      x: 50,
      width: 16,
      speed: 0.2,
      label: 'HEAT',
    };
    const middleHazard = {
      ...topHazard,
      id: 'middle',
      track: 1,
    };

    expect(arcadeAlleyPushCollision(player, [topHazard], 2_000, config)).toBeNull();
    expect(arcadeAlleyPushCollision(player, [middleHazard], 2_000, config)).toBeTruthy();
  });

  it('spawns hazards off-screen and ignores clipped collisions', () => {
    const config = arcadeAlleyPushGameConfig('normal');
    const hazards = spawnArcadeAlleyPushHazards(config);
    const player = {
      ...createArcadeAlleyPushPlayer(1_000),
      lane: 2,
      track: 1,
      x: 50,
      invincibleUntil: 0,
    };

    for (const hazard of hazards) {
      if (hazard.speed > 0) {
        expect(hazard.x + hazard.width * 0.5).toBeLessThanOrEqual(0);
      } else {
        expect(hazard.x - hazard.width * 0.5).toBeGreaterThanOrEqual(100);
      }
    }

    const hiddenHazard = {
      id: 'hidden',
      lane: 2,
      track: 1,
      x: -12,
      width: 16,
      speed: 0.2,
      label: 'HEAT',
    };

    expect(isArcadeAlleyPushHazardVisible(hiddenHazard)).toBe(false);
    expect(arcadeAlleyPushCollision(player, [hiddenHazard], 2_000, config)).toBeNull();

    const visibleHazard = { ...hiddenHazard, x: 50 };
    expect(isArcadeAlleyPushHazardVisible(visibleHazard)).toBe(true);
    expect(arcadeAlleyPushCollision(player, [visibleHazard], 2_000, config)).toBeTruthy();
  });

  it('wraps hazards back to the entry edge they came from', () => {
    const config = arcadeAlleyPushGameConfig('normal');
    const movingRight = {
      id: 'right',
      lane: 1,
      track: 1,
      x: 109,
      width: 16,
      speed: 0.2,
      label: 'HEAT',
    };
    const movingLeft = {
      id: 'left',
      lane: 1,
      track: 0,
      x: -10,
      width: 16,
      speed: -0.2,
      label: 'COP',
    };

    const [wrappedRight] = updateArcadeAlleyPushHazards([movingRight], config);
    const [wrappedLeft] = updateArcadeAlleyPushHazards([movingLeft], config);

    expect(wrappedRight.x).toBe(-8);
    expect(wrappedLeft.x).toBe(108);
  });

  it('rate-limits lane changes and crew pass awards', () => {
    const config = arcadeAlleyPushGameConfig('normal');
    const start = createArcadeAlleyPushPlayer(1_000);
    const firstStep = applyArcadeAlleyPushLaneStep(start, 'up', config, 0, 1_000);

    expect(firstStep.moved).toBe(true);
    expect(firstStep.player.lane).toBe(1);

    const blockedStep = applyArcadeAlleyPushLaneStep(
      firstStep.player,
      'up',
      config,
      firstStep.lastLaneChangeAt,
      1_000 + ARCADE_ALLEY_PUSH_LANE_CHANGE_COOLDOWN_MS - 1,
    );

    expect(blockedStep.moved).toBe(false);

    const crewPassLane = ARCADE_ALLEY_PUSH_CREW_PASS_LANE - 1;
    expect(
      shouldAwardArcadeAlleyPushPass(crewPassLane, ARCADE_ALLEY_PUSH_CREW_PASS_LANE, 0, 5_000),
    ).toBe(true);
    expect(
      shouldAwardArcadeAlleyPushPass(
        crewPassLane,
        ARCADE_ALLEY_PUSH_CREW_PASS_LANE,
        5_000,
        5_000 + ARCADE_ALLEY_PUSH_PASS_COOLDOWN_MS - 1,
      ),
    ).toBe(false);
  });
});

describe('arcade-alley-push-game-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetArcadeAlleyPushGameStoreForTests();
  });

  it('records leaderboard scores per mode', () => {
    const streetResult = recordArcadeAlleyPushGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: 'normal',
      score: 25,
      passesCompleted: 5,
    });

    expect(streetResult.rank).toBe(1);
    expect(readArcadeAlleyPushLeaderboard('normal')[0]?.score).toBe(25);

    const heatResult = recordArcadeAlleyPushGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: 'hard',
      score: 15,
      passesCompleted: 3,
    });

    expect(heatResult.rank).toBe(1);
    expect(readArcadeAlleyPushLeaderboard('hard')[0]?.score).toBe(15);
  });
});