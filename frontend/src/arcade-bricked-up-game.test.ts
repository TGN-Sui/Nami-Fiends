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
  ARCADE_BRICKED_UP_COMPLETE_BONUS,
  ARCADE_BRICKED_UP_EFFECT_DURATION_TICKS,
  ARCADE_BRICKED_UP_EXPLOSIVE_HAZARD_BASE_SIZE,
  ARCADE_BRICKED_UP_GAME_ID,
  ARCADE_BRICKED_UP_LEVEL_CLEAR_BONUS,
  ARCADE_BRICKED_UP_SKILL_BALL_LAUNCH_LAG_TICKS,
  applyArcadeBrickedUpEffect,
  arcadeBrickedUpGameConfig,
  arcadeBrickedUpModeLabel,
  computeArcadeBrickedUpModifiers,
  createArcadeBrickedUpBricks,
  createArcadeBrickedUpState,
  expireArcadeBrickedUpEffects,
  isArcadeBrickedUpDefeated,
  isArcadeBrickedUpPowerDown,
  isArcadeBrickedUpVictory,
  launchArcadeBrickedUpBalls,
  arcadeBrickedUpBallPaddleXOffset,
  releaseArcadeBrickedUpBallFromPaddle,
  resetArcadeBrickedUpIdCounterForTests,
  rollArcadeBrickedUpMysteryEffect,
  readArcadeBrickedUpActiveEffectChips,
  spawnArcadeBrickedUpSkyDrop,
  updateArcadeBrickedUpState,
  type ArcadeBrickedUpHazard,
} from './arcade-bricked-up-game.js';
import {
  arcadeBrickedUpHazardDisplayScale,
  arcadeBrickedUpHazardSpriteSlot,
} from './arcade-bricked-up-sprites.js';
import {
  readArcadeBrickedUpLeaderboard,
  recordArcadeBrickedUpGameResult,
  resetArcadeBrickedUpGameStoreForTests,
} from './arcade-bricked-up-game-store.js';
import { ARCADE_SKILL_DIFF_MODE, ARCADE_SKILL_DIFF_MODE_LABEL } from './arcade-skill-diff.js';

describe('arcade-bricked-up-game', () => {
  beforeEach(() => {
    resetArcadeBrickedUpIdCounterForTests();
  });

  it('exposes the official bricked up cabinet id and mode labels', () => {
    expect(ARCADE_BRICKED_UP_GAME_ID).toBe('nami-bricked-up');
    expect(arcadeBrickedUpModeLabel('normal')).toBe('Street Break');
    expect(arcadeBrickedUpModeLabel('hard')).toBe('Heat Layer');
    expect(arcadeBrickedUpModeLabel(ARCADE_SKILL_DIFF_MODE)).toBe(ARCADE_SKILL_DIFF_MODE_LABEL);
  });

  it('assigns 3, 4, and 5 levels with faster escalating pressure', () => {
    const normal = arcadeBrickedUpGameConfig('normal');
    const hard = arcadeBrickedUpGameConfig('hard');
    const skill = arcadeBrickedUpGameConfig(ARCADE_SKILL_DIFF_MODE);

    expect(normal.levelCount).toBe(3);
    expect(normal.ballCount).toBe(1);
    expect(normal.brickHpMax).toBe(1);
    expect(normal.ballSpeed).toBe(0.58);

    expect(hard.levelCount).toBe(4);
    expect(hard.brickHpMax).toBe(2);
    expect(hard.ballSpeed).toBeGreaterThan(normal.ballSpeed);

    expect(skill.levelCount).toBe(5);
    expect(skill.ballCount).toBe(2);
    expect(skill.brickHpMin).toBe(2);
    expect(skill.ballSpeed).toBeGreaterThan(hard.ballSpeed);
    expect(skill.hazardSpawnIntervalTicks).toBeLessThan(hard.hazardSpawnIntervalTicks);
  });

  it('builds denser brick walls on later levels', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    const levelOne = createArcadeBrickedUpBricks(0, config);
    const levelThree = createArcadeBrickedUpBricks(2, config);

    expect(levelThree.length).toBeGreaterThan(levelOne.length);
  });

  it('launches balls and clears a level with bonus score', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    let state = createArcadeBrickedUpState(config);
    state = launchArcadeBrickedUpBalls(state, config);

    expect(state.awaitingServe).toBe(false);
    expect(state.balls[0]?.launched).toBe(true);
    expect(Math.hypot(state.balls[0]?.vx ?? 0, state.balls[0]?.vy ?? 0)).toBeGreaterThan(0);

    state = {
      ...state,
      bricks: [],
      score: 12,
    };

    const advanced = updateArcadeBrickedUpState(state, config, 0);

    expect(advanced.levelIndex).toBe(1);
    expect(advanced.score).toBe(12 + ARCADE_BRICKED_UP_LEVEL_CLEAR_BONUS);
    expect(advanced.awaitingServe).toBe(true);
    expect(advanced.bricks.length).toBeGreaterThan(0);
  });

  it('marks victory after the final level and defeat at zero lives', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    const victoryState = {
      ...createArcadeBrickedUpState(config),
      completed: true,
      levelIndex: config.levelCount,
      score: 40 + ARCADE_BRICKED_UP_COMPLETE_BONUS,
      bricks: [],
      balls: [],
    };
    const defeatedState = {
      ...createArcadeBrickedUpState(config),
      lives: 0,
      completed: false,
    };

    expect(isArcadeBrickedUpVictory(victoryState, config)).toBe(true);
    expect(isArcadeBrickedUpDefeated(defeatedState)).toBe(true);
  });

  it('rolls mystery effects from both power pools', () => {
    const powerUp = rollArcadeBrickedUpMysteryEffect(() => 0.1);
    const powerDown = rollArcadeBrickedUpMysteryEffect(() => 0.9);

    expect(isArcadeBrickedUpPowerDown(powerUp)).toBe(false);
    expect(isArcadeBrickedUpPowerDown(powerDown)).toBe(true);
  });

  it('keeps overlapping timed effects until each expires', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    let state = createArcadeBrickedUpState(config);
    state = applyArcadeBrickedUpEffect(state, 'widen', config);
    state = applyArcadeBrickedUpEffect(state, 'shrink', config);

    expect(state.activeEffects).toHaveLength(2);

    const midModifiers = computeArcadeBrickedUpModifiers(state.activeEffects, state.tick + 1);
    expect(midModifiers.paddleWidthMultiplier).toBeCloseTo(1.48 * 0.62, 5);
    expect(midModifiers.hasShooter).toBe(false);

    const expiredTick = state.tick + ARCADE_BRICKED_UP_EFFECT_DURATION_TICKS + 1;
    const remaining = expireArcadeBrickedUpEffects(state.activeEffects, expiredTick);

    expect(remaining).toHaveLength(0);
  });

  it('spawns hazards over time and multiball adds launched balls', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    let state = createArcadeBrickedUpState(config);
    state = launchArcadeBrickedUpBalls(state, config);

    for (let index = 0; index < config.hazardSpawnIntervalTicks + 2; index += 1) {
      state = updateArcadeBrickedUpState(state, config, 0);
    }

    expect(state.hazards.length).toBeGreaterThan(0);

    const beforeCount = state.balls.length;
    state = applyArcadeBrickedUpEffect(state, 'multiball', config);

    expect(state.balls.length).toBeGreaterThan(beforeCount + 6);
    expect(state.balls.every((ball) => ball.launched)).toBe(true);
  });

  it('launches magnet-held balls with velocity instead of freezing them', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    const heldBall = createArcadeBrickedUpState(config).balls[0]!;
    let state = {
      ...createArcadeBrickedUpState(config),
      awaitingServe: false,
      magnetHeldBallId: heldBall.id,
      balls: [
        {
          ...heldBall,
          launched: false,
          vx: 0,
          vy: 0,
        },
      ],
    };

    state = launchArcadeBrickedUpBalls(state, config);

    expect(state.magnetHeldBallId).toBeNull();
    expect(state.balls[0]?.launched).toBe(true);
    expect(state.balls[0]?.vy).toBeLessThan(0);
    expect(Math.hypot(state.balls[0]?.vx ?? 0, state.balls[0]?.vy ?? 0)).toBeCloseTo(config.ballSpeed, 5);
  });

  it('staggers skill diff balls on the initial serve', () => {
    const config = arcadeBrickedUpGameConfig(ARCADE_SKILL_DIFF_MODE);
    let state = createArcadeBrickedUpState(config);

    state = launchArcadeBrickedUpBalls(state, config);

    expect(state.awaitingServe).toBe(false);
    expect(state.balls.filter((ball) => ball.launched)).toHaveLength(1);
    expect(state.balls.filter((ball) => !ball.launched)).toHaveLength(1);
    expect(state.nextSkillBallLaunchTick).toBe(
      state.tick + ARCADE_BRICKED_UP_SKILL_BALL_LAUNCH_LAG_TICKS,
    );

    for (let index = 0; index < ARCADE_BRICKED_UP_SKILL_BALL_LAUNCH_LAG_TICKS - 1; index += 1) {
      state = updateArcadeBrickedUpState(state, config, 0);
    }

    expect(state.balls.filter((ball) => ball.launched)).toHaveLength(1);

    state = updateArcadeBrickedUpState(state, config, 0);

    expect(state.balls.every((ball) => ball.launched)).toBe(true);
    expect(state.nextSkillBallLaunchTick).toBeNull();
  });

  it('respawns skill diff balls on the paddle after they fall', () => {
    const config = arcadeBrickedUpGameConfig(ARCADE_SKILL_DIFF_MODE);
    let state = {
      ...createArcadeBrickedUpState(config),
      awaitingServe: false,
      balls: [
        {
          id: 'ball-0',
          x: 50,
          y: 99,
          vx: 0.2,
          vy: 0.8,
          speed: config.ballSpeed,
          launched: true,
        },
        {
          id: 'ball-1',
          x: 48,
          y: 40,
          vx: 0.1,
          vy: -0.5,
          speed: config.ballSpeed,
          launched: true,
        },
      ],
    };

    state = updateArcadeBrickedUpState(state, config, 0);

    expect(state.lives).toBe(config.startingLives);
    expect(state.balls.some((ball) => !ball.launched)).toBe(true);
    expect(state.balls.some((ball) => ball.launched)).toBe(true);
  });

  it('enables dark mode from the mystery power-down pool', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    let state = createArcadeBrickedUpState(config);
    state = applyArcadeBrickedUpEffect(state, 'darkMode', config);

    const modifiers = computeArcadeBrickedUpModifiers(state.activeEffects, state.tick + 1);

    expect(modifiers.hasDarkMode).toBe(true);
    expect(releaseArcadeBrickedUpBallFromPaddle(state.balls[0]!, 50, config.paddleWidth).vy).toBeLessThan(0);
  });

  it('spawns sky mystery drops alongside hazard waves', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    let state = createArcadeBrickedUpState(config);
    state = launchArcadeBrickedUpBalls(state, config);

    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    for (let index = 0; index < config.hazardSpawnIntervalTicks + 2; index += 1) {
      state = updateArcadeBrickedUpState(state, config, 0);
    }

    expect(state.drops.length).toBeGreaterThan(0);
    expect(spawnArcadeBrickedUpSkyDrop().y).toBeLessThan(0);

    vi.mocked(Math.random).mockRestore();
  });

  it('keeps respawned skill balls centered on the paddle', () => {
    const config = arcadeBrickedUpGameConfig(ARCADE_SKILL_DIFF_MODE);

    expect(arcadeBrickedUpBallPaddleXOffset('ball-99', config)).toBe(0);

    let state = {
      ...createArcadeBrickedUpState(config),
      awaitingServe: false,
      paddleX: 63,
      balls: [
        {
          id: 'ball-0',
          x: 63,
          y: 99,
          vx: 0.2,
          vy: 0.8,
          speed: config.ballSpeed,
          launched: true,
        },
      ],
    };

    state = updateArcadeBrickedUpState(state, config, 0);

    const respawned = state.balls.find((ball) => !ball.launched);

    expect(respawned).toBeTruthy();
    expect(respawned?.x).toBe(63);
  });

  it('shows color-coded countdown timers on active effects', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    let state = createArcadeBrickedUpState(config);
    state = applyArcadeBrickedUpEffect(state, 'widen', config);
    state = applyArcadeBrickedUpEffect(state, 'darkMode', config);

    const chips = readArcadeBrickedUpActiveEffectChips(state);

    expect(chips).toHaveLength(2);
    expect(chips[0]?.remainingSeconds).toBeGreaterThan(0);
    expect(chips[0]?.progress).toBeGreaterThan(0);
    expect(chips.some((chip) => chip.isPowerDown)).toBe(true);
    expect(chips.some((chip) => !chip.isPowerDown)).toBe(true);
  });

  it('only spawns explosive hazards during the Explosive Rain power-down', () => {
    const config = arcadeBrickedUpGameConfig('normal');
    let state = createArcadeBrickedUpState(config);
    state = launchArcadeBrickedUpBalls(state, config);

    for (let index = 0; index < config.hazardSpawnIntervalTicks * 3; index += 1) {
      state = updateArcadeBrickedUpState(state, config, 0);
    }

    expect(state.hazards.length).toBeGreaterThan(0);
    expect(state.hazards.every((hazard) => hazard.kind === 'shard')).toBe(true);

    state = applyArcadeBrickedUpEffect(state, 'giantMeteor', config);

    for (let index = 0; index < config.hazardSpawnIntervalTicks + 120; index += 1) {
      state = updateArcadeBrickedUpState(state, config, 0);
    }

    expect(state.hazards.some((hazard) => hazard.kind === 'explosive')).toBe(true);

    state = {
      ...state,
      activeEffects: [],
    };

    state = updateArcadeBrickedUpState(state, config, 0);

    expect(state.hazards.every((hazard) => hazard.kind === 'shard')).toBe(true);
  });

  it('tracks explosive hazards larger with rotation while shards stay steady', () => {
    expect(arcadeBrickedUpHazardSpriteSlot('explosive')).toBe('hazard-explosive');
    expect(arcadeBrickedUpHazardSpriteSlot('shard')).toBe('hazard-shard');
    expect(arcadeBrickedUpHazardDisplayScale('explosive')).toBeGreaterThan(
      arcadeBrickedUpHazardDisplayScale('shard'),
    );

    const config = arcadeBrickedUpGameConfig('normal');
    let state = applyArcadeBrickedUpEffect(
      {
        ...createArcadeBrickedUpState(config),
        awaitingServe: false,
        balls: [],
        hazards: [
          {
            id: 'explosive-1',
            kind: 'explosive',
            x: 40,
            y: 20,
            vy: 0.3,
            size: ARCADE_BRICKED_UP_EXPLOSIVE_HAZARD_BASE_SIZE,
            rotation: 10,
            rotationSpeed: 4,
          } satisfies ArcadeBrickedUpHazard,
        ],
      },
      'giantMeteor',
      config,
    );

    state = updateArcadeBrickedUpState(state, config, 0);

    expect(state.hazards[0]?.rotation).toBeGreaterThan(10);
    expect(state.hazards[0]?.kind).toBe('explosive');
  });
});

describe('arcade-bricked-up-game-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetArcadeBrickedUpGameStoreForTests();
  });

  it('records leaderboard scores per mode', () => {
    const streetResult = recordArcadeBrickedUpGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: 'normal',
      score: 42,
      bricksBroken: 18,
      levelsCleared: 3,
    });

    expect(streetResult.rank).toBe(1);
    expect(readArcadeBrickedUpLeaderboard('normal')[0]?.score).toBe(42);

    const skillResult = recordArcadeBrickedUpGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: ARCADE_SKILL_DIFF_MODE,
      score: 58,
      bricksBroken: 30,
      levelsCleared: 5,
    });

    expect(skillResult.rank).toBe(1);
    expect(readArcadeBrickedUpLeaderboard(ARCADE_SKILL_DIFF_MODE)[0]?.score).toBe(58);
  });
});