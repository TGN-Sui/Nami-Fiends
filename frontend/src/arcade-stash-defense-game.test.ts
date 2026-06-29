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
  ARCADE_STASH_DEFENSE_BULLET_SPAWN_X,
  ARCADE_STASH_DEFENSE_BURST_SIZE,
  ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_HARD,
  ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_NORMAL,
  ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_SKILL,
  ARCADE_STASH_DEFENSE_GAME_DURATION_MS,
  ARCADE_STASH_DEFENSE_GAME_ID,
  ARCADE_STASH_DEFENSE_KILL_SCORE,
  arcadeStashDefenseBulletInterceptFrames,
  arcadeStashDefenseBulletInterceptX,
  arcadeStashDefenseGameConfig,
  arcadeStashDefenseModeLabel,
  arcadeStashDefenseSurviveBonus,
  canShootArcadeStashDefenseLane,
  createArcadeStashDefenseState,
  isArcadeStashDefenseDefeated,
  readArcadeStashDefenseLaneFromKey,
  shootArcadeStashDefenseLane,
  spawnArcadeStashDefenseEnemy,
  updateArcadeStashDefenseBullets,
  updateArcadeStashDefenseEnemies,
} from './arcade-stash-defense-game.js';
import {
  readArcadeStashDefenseLeaderboard,
  recordArcadeStashDefenseGameResult,
  resetArcadeStashDefenseGameStoreForTests,
} from './arcade-stash-defense-game-store.js';
import { ARCADE_SKILL_DIFF_MODE, ARCADE_SKILL_DIFF_MODE_LABEL } from './arcade-skill-diff.js';

describe('arcade-stash-defense-game', () => {
  it('exposes the official stash defense cabinet id and one-minute runs', () => {
    expect(ARCADE_STASH_DEFENSE_GAME_ID).toBe('nami-stash-defense');
    expect(ARCADE_STASH_DEFENSE_GAME_DURATION_MS).toBe(60_000);
    expect(arcadeStashDefenseModeLabel('normal')).toBe('Alley Watch');
    expect(arcadeStashDefenseModeLabel('hard')).toBe('Heat Siege');
    expect(arcadeStashDefenseModeLabel(ARCADE_SKILL_DIFF_MODE)).toBe(ARCADE_SKILL_DIFF_MODE_LABEL);
  });

  it('ramps spawn rate, speed, batch size, and assigns mode lives', () => {
    const normal = arcadeStashDefenseGameConfig('normal');
    const hard = arcadeStashDefenseGameConfig('hard');
    const skill = arcadeStashDefenseGameConfig(ARCADE_SKILL_DIFF_MODE);

    expect(normal.playerLives).toBeNull();
    expect(hard.playerLives).toBe(5);
    expect(skill.playerLives).toBe(3);
    expect(hard.enemyHpMax).toBe(ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_HARD);
    expect(hard.spawnIntervalMs).toBeLessThan(normal.spawnIntervalMs);
    expect(hard.spawnsPerWave).toBe(2);
    expect(skill.freeShoot).toBe(true);
    expect(skill.spawnsPerWave).toBe(2);
    expect(skill.maxEnemiesPerLane).toBe(2);
    expect(skill.spawnIntervalMs).toBeLessThan(normal.spawnIntervalMs);
    expect(skill.enemySpeedMin).toBeGreaterThan(normal.enemySpeedMin);
    expect(skill.enemyHpMax).toBe(ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_SKILL);
    expect(normal.enemyHpMax).toBe(ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_NORMAL);
    expect(normal.freeShoot).toBe(false);
    expect(normal.burstSize).toBe(ARCADE_STASH_DEFENSE_BURST_SIZE);
  });

  it('spawns and advances enemies toward the stash', () => {
    const config = arcadeStashDefenseGameConfig('normal');
    let state = createArcadeStashDefenseState(config);
    const spawned = spawnArcadeStashDefenseEnemy([], config, 5_000, state);

    expect(spawned.enemies).toHaveLength(1);
    expect(spawned.enemies[0]?.x).toBeGreaterThan(100);
    expect(spawned.enemies[0]?.hp).toBeGreaterThan(0);
    expect(spawned.enemies[0]?.hp).toBeLessThanOrEqual(config.enemyHpMax);

    const advanced = updateArcadeStashDefenseEnemies(
      [{ ...spawned.enemies[0]!, x: 12 }],
      { ...spawned.state, stashHp: 2 },
    );

    expect(advanced.stashHits).toBe(1);
    expect(advanced.state.stashHp).toBe(1);
    expect(advanced.enemies).toHaveLength(0);
  });

  it('reduces player lives instead of stash hp on hard and skill modes', () => {
    const hardConfig = arcadeStashDefenseGameConfig('hard');
    const hardState = createArcadeStashDefenseState(hardConfig);

    const hardAdvanced = updateArcadeStashDefenseEnemies(
      [
        {
          id: 'enemy-hard',
          lane: 0,
          x: 12,
          speed: 0.1,
          label: 'HEAT',
          hp: 2,
          maxHp: 3,
        },
      ],
      hardState,
    );

    expect(hardAdvanced.stashHits).toBe(1);
    expect(hardAdvanced.state.playerLives).toBe(4);
    expect(hardAdvanced.state.stashHp).toBe(hardConfig.stashHp);
  });

  it('fires freely in skill diff with no burst reload', () => {
    const config = arcadeStashDefenseGameConfig(ARCADE_SKILL_DIFF_MODE);
    let state = createArcadeStashDefenseState(config);
    let bullets: ReturnType<typeof shootArcadeStashDefenseLane>['bullets'] = [];

    for (let shot = 0; shot < 6; shot += 1) {
      const fired = shootArcadeStashDefenseLane(1, bullets, state, config, 1_000 + shot, shot);
      expect(fired.shot).toBe(true);
      bullets = fired.bullets;
      state = fired.state;
    }

    expect(bullets).toHaveLength(6);
    expect(canShootArcadeStashDefenseLane(1, state, 1_006, config)).toBe(true);
  });

  it('fires three burst shots instantly then enforces reload lag', () => {
    const config = arcadeStashDefenseGameConfig('normal');
    let state = createArcadeStashDefenseState(config);
    let bullets: ReturnType<typeof shootArcadeStashDefenseLane>['bullets'] = [];

    const first = shootArcadeStashDefenseLane(1, bullets, state, config, 1_000, 0);
    const second = shootArcadeStashDefenseLane(1, first.bullets, first.state, config, 1_010, 1);
    const third = shootArcadeStashDefenseLane(1, second.bullets, second.state, config, 1_020, 2);
    const blocked = shootArcadeStashDefenseLane(1, third.bullets, third.state, config, 1_030, 3);

    expect(first.shot).toBe(true);
    expect(second.shot).toBe(true);
    expect(third.shot).toBe(true);
    expect(blocked.shot).toBe(false);
    expect(third.bullets).toHaveLength(3);
    expect(third.state.burstCooldownUntil[1]).toBe(1_020 + config.burstCooldownMs);
    expect(canShootArcadeStashDefenseLane(1, third.state, 1_030, config)).toBe(false);
    expect(canShootArcadeStashDefenseLane(1, third.state, 1_020 + config.burstCooldownMs, config)).toBe(
      true,
    );
  });

  it('damages only the contacted raider and destroys the bullet', () => {
    const config = arcadeStashDefenseGameConfig('normal');
    const enemies = [
      {
        id: 'enemy-1',
        lane: 1,
        x: 72,
        speed: 0.1,
        label: 'HEAT',
        hp: 3,
        maxHp: 3,
      },
      {
        id: 'enemy-2',
        lane: 1,
        x: 44,
        speed: 0.1,
        label: 'COP',
        hp: 2,
        maxHp: 3,
      },
    ];

    const impactX = 44 - config.bulletSpeed;

    const firstHit = updateArcadeStashDefenseBullets(
      [{ id: 'bullet-1', lane: 1, x: impactX }],
      enemies,
      config,
    );

    expect(firstHit.hits).toBe(1);
    expect(firstHit.kills).toBe(0);
    expect(firstHit.bullets).toHaveLength(0);
    expect(firstHit.enemies).toHaveLength(2);
    expect(firstHit.enemies.find((enemy) => enemy.id === 'enemy-2')?.hp).toBe(1);
    expect(firstHit.enemies.find((enemy) => enemy.id === 'enemy-1')?.hp).toBe(3);

    const killShot = updateArcadeStashDefenseBullets(
      [{ id: 'bullet-2', lane: 1, x: impactX }],
      firstHit.enemies,
      config,
    );

    expect(killShot.kills).toBe(1);
    expect(killShot.enemies).toHaveLength(1);
    expect(killShot.enemies[0]?.id).toBe('enemy-1');
  });

  it('computes intercept frames and hit position for moving raiders', () => {
    const config = arcadeStashDefenseGameConfig('normal');
    const enemyX = 72;
    const enemySpeed = 0.12;
    const frames = arcadeStashDefenseBulletInterceptFrames(
      enemyX,
      enemySpeed,
      config.bulletSpawnX,
      config.bulletSpeed,
    );
    const hitX = arcadeStashDefenseBulletInterceptX(
      enemyX,
      enemySpeed,
      config.bulletSpawnX,
      config.bulletSpeed,
    );

    expect(frames).toBeCloseTo((enemyX - ARCADE_STASH_DEFENSE_BULLET_SPAWN_X) / (config.bulletSpeed + enemySpeed));
    expect(hitX).toBeCloseTo(enemyX - enemySpeed * frames);
    expect(hitX).toBeGreaterThan(config.bulletSpawnX);
  });

  it('maps lane keys and awards survive bonus', () => {
    const state = createArcadeStashDefenseState(arcadeStashDefenseGameConfig('hard'));

    expect(readArcadeStashDefenseLaneFromKey('2')).toBe(1);
    expect(isArcadeStashDefenseDefeated({ ...state, playerLives: 0 })).toBe(true);
    expect(isArcadeStashDefenseDefeated({ ...state, stashHp: 0 })).toBe(false);
    expect(arcadeStashDefenseSurviveBonus(state, 0)).toBeGreaterThan(0);
    expect(ARCADE_STASH_DEFENSE_KILL_SCORE).toBe(2);
  });
});

describe('arcade-stash-defense-game-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetArcadeStashDefenseGameStoreForTests();
  });

  it('records leaderboard scores per mode', () => {
    const watchResult = recordArcadeStashDefenseGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: 'normal',
      score: 22,
      enemiesRepelled: 7,
    });

    expect(watchResult.rank).toBe(1);
    expect(readArcadeStashDefenseLeaderboard('normal')[0]?.score).toBe(22);

    const siegeResult = recordArcadeStashDefenseGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: 'hard',
      score: 14,
      enemiesRepelled: 4,
    });

    expect(siegeResult.rank).toBe(1);
    expect(readArcadeStashDefenseLeaderboard('hard')[0]?.score).toBe(14);

    const skillResult = recordArcadeStashDefenseGameResult({
      memberId: 'm1',
      displayName: 'Nozomi',
      mode: ARCADE_SKILL_DIFF_MODE,
      score: 18,
      enemiesRepelled: 6,
    });

    expect(skillResult.rank).toBe(1);
    expect(readArcadeStashDefenseLeaderboard(ARCADE_SKILL_DIFF_MODE)[0]?.score).toBe(18);
  });
});