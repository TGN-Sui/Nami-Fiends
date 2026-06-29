export const ARCADE_STASH_DEFENSE_GAME_ID = 'nami-stash-defense';

export const ARCADE_STASH_DEFENSE_LANE_COUNT = 3;
export const ARCADE_STASH_DEFENSE_GAME_DURATION_MS = 60_000;
export const ARCADE_STASH_DEFENSE_LEADERBOARD_SIZE = 10;
export const ARCADE_STASH_DEFENSE_KILL_SCORE = 2;
export const ARCADE_STASH_DEFENSE_SURVIVE_BONUS = 8;
export const ARCADE_STASH_DEFENSE_STASH_HIT_PENALTY = 1;
export const ARCADE_STASH_DEFENSE_STASH_ZONE_X = 14;
export const ARCADE_STASH_DEFENSE_BULLET_DAMAGE = 1;
export const ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_NORMAL = 3;
export const ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_HARD = 4;
export const ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_SKILL = 5;
export const ARCADE_STASH_DEFENSE_BURST_SIZE = 3;
export const ARCADE_STASH_DEFENSE_BULLET_SPAWN_X = 22;
export const ARCADE_STASH_DEFENSE_BULLET_HIT_RADIUS = 2.2;
export const ARCADE_STASH_DEFENSE_HIT_FLASH_MS = 320;

import {
  arcadeSkillDiffDoubledSpawnCount,
  arcadeSkillDiffFasterSpawnInterval,
  arcadeSkillDiffScaledSpeed,
  ARCADE_SKILL_DIFF_MODE,
  ARCADE_SKILL_DIFF_MODE_LABEL,
} from './arcade-skill-diff.js';

export type ArcadeStashDefenseMode = 'normal' | 'hard' | typeof ARCADE_SKILL_DIFF_MODE;

export type ArcadeStashDefenseGameConfig = {
  mode: ArcadeStashDefenseMode;
  stashHp: number;
  playerLives: number | null;
  burstSize: number;
  burstCooldownMs: number;
  freeShoot: boolean;
  bulletSpeed: number;
  bulletSpawnX: number;
  spawnIntervalMs: number;
  enemySpeedMin: number;
  enemySpeedMax: number;
  maxEnemiesPerLane: number;
  spawnsPerWave: number;
  enemyHpMax: number;
  bulletDamage: number;
};

export type ArcadeStashDefenseEnemy = {
  id: string;
  lane: number;
  x: number;
  speed: number;
  label: string;
  hp: number;
  maxHp: number;
};

export type ArcadeStashDefenseBullet = {
  id: string;
  lane: number;
  x: number;
};

export type ArcadeStashDefenseState = {
  stashHp: number;
  playerLives: number | null;
  burstShotsInBurst: number[];
  burstCooldownUntil: number[];
  lastSpawnAt: number;
};

const ENEMY_LABELS = ['HEAT', 'COP', 'DRONE', 'STATIC', 'CLIP'] as const;

export function arcadeStashDefenseGameConfig(mode: ArcadeStashDefenseMode): ArcadeStashDefenseGameConfig {
  if (mode === 'hard') {
    return {
      mode,
      stashHp: 5,
      playerLives: 5,
      burstSize: ARCADE_STASH_DEFENSE_BURST_SIZE,
      burstCooldownMs: 820,
      freeShoot: false,
      bulletSpeed: 3.2,
      bulletSpawnX: ARCADE_STASH_DEFENSE_BULLET_SPAWN_X,
      spawnIntervalMs: 1_050,
      enemySpeedMin: 0.14,
      enemySpeedMax: 0.28,
      maxEnemiesPerLane: 2,
      spawnsPerWave: 2,
      enemyHpMax: ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_HARD,
      bulletDamage: ARCADE_STASH_DEFENSE_BULLET_DAMAGE,
    };
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return {
      mode,
      stashHp: 5,
      playerLives: 3,
      burstSize: ARCADE_STASH_DEFENSE_BURST_SIZE,
      burstCooldownMs: 0,
      freeShoot: true,
      bulletSpeed: 3.6,
      bulletSpawnX: ARCADE_STASH_DEFENSE_BULLET_SPAWN_X,
      spawnIntervalMs: arcadeSkillDiffFasterSpawnInterval(2_050),
      enemySpeedMin: arcadeSkillDiffScaledSpeed(0.1),
      enemySpeedMax: arcadeSkillDiffScaledSpeed(0.2),
      maxEnemiesPerLane: arcadeSkillDiffDoubledSpawnCount(1),
      spawnsPerWave: arcadeSkillDiffDoubledSpawnCount(1),
      enemyHpMax: ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_SKILL,
      bulletDamage: ARCADE_STASH_DEFENSE_BULLET_DAMAGE,
    };
  }

  return {
    mode,
    stashHp: 5,
    playerLives: null,
    burstSize: ARCADE_STASH_DEFENSE_BURST_SIZE,
    burstCooldownMs: 1_100,
    freeShoot: false,
    bulletSpeed: 2.8,
    bulletSpawnX: ARCADE_STASH_DEFENSE_BULLET_SPAWN_X,
    spawnIntervalMs: 2_050,
    enemySpeedMin: 0.1,
    enemySpeedMax: 0.2,
    maxEnemiesPerLane: 1,
    spawnsPerWave: 1,
    enemyHpMax: ARCADE_STASH_DEFENSE_ENEMY_HP_MAX_NORMAL,
    bulletDamage: ARCADE_STASH_DEFENSE_BULLET_DAMAGE,
  };
}

export function arcadeStashDefenseModeLabel(mode: ArcadeStashDefenseMode): string {
  if (mode === 'hard') {
    return 'Heat Siege';
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return ARCADE_SKILL_DIFF_MODE_LABEL;
  }

  return 'Alley Watch';
}

export function arcadeStashDefenseBulletInterceptFrames(
  enemyX: number,
  enemySpeed: number,
  spawnX: number,
  bulletSpeed: number,
): number {
  const gap = enemyX - spawnX;

  if (gap <= 0) {
    return 0;
  }

  return gap / (bulletSpeed + enemySpeed);
}

export function arcadeStashDefenseBulletInterceptX(
  enemyX: number,
  enemySpeed: number,
  spawnX: number,
  bulletSpeed: number,
): number {
  const frames = arcadeStashDefenseBulletInterceptFrames(enemyX, enemySpeed, spawnX, bulletSpeed);

  return spawnX + bulletSpeed * frames;
}

function randomEnemyLabel(): string {
  return ENEMY_LABELS[Math.floor(Math.random() * ENEMY_LABELS.length)]!;
}

function randomEnemySpeed(config: ArcadeStashDefenseGameConfig): number {
  return config.enemySpeedMin + Math.random() * (config.enemySpeedMax - config.enemySpeedMin);
}

function randomEnemyHp(maxHp: number): number {
  return 1 + Math.floor(Math.random() * maxHp);
}

export function createArcadeStashDefenseEnemy(
  lane: number,
  config: ArcadeStashDefenseGameConfig,
  now: number,
  spawned: number,
): ArcadeStashDefenseEnemy {
  const maxHp = config.enemyHpMax;
  const hp = randomEnemyHp(maxHp);

  return {
    id:
      'stash-enemy-' +
      lane +
      '-' +
      Math.floor(now) +
      '-' +
      spawned +
      '-' +
      Math.floor(Math.random() * 1_000),
    lane,
    x: 108,
    speed: randomEnemySpeed(config),
    label: randomEnemyLabel(),
    hp,
    maxHp,
  };
}

export function createArcadeStashDefenseState(config: ArcadeStashDefenseGameConfig): ArcadeStashDefenseState {
  return {
    stashHp: config.stashHp,
    playerLives: config.playerLives,
    burstShotsInBurst: Array.from({ length: ARCADE_STASH_DEFENSE_LANE_COUNT }, () => 0),
    burstCooldownUntil: Array.from({ length: ARCADE_STASH_DEFENSE_LANE_COUNT }, () => 0),
    lastSpawnAt: 0,
  };
}

export function spawnArcadeStashDefenseEnemy(
  enemies: ArcadeStashDefenseEnemy[],
  config: ArcadeStashDefenseGameConfig,
  now: number,
  state: ArcadeStashDefenseState,
): { enemies: ArcadeStashDefenseEnemy[]; state: ArcadeStashDefenseState } {
  if (now - state.lastSpawnAt < config.spawnIntervalMs) {
    return { enemies, state };
  }

  let nextEnemies = enemies;
  let spawned = 0;

  while (spawned < config.spawnsPerWave) {
    const openLanes = Array.from({ length: ARCADE_STASH_DEFENSE_LANE_COUNT }, (_, lane) => lane).filter(
      (lane) => nextEnemies.filter((enemy) => enemy.lane === lane).length < config.maxEnemiesPerLane,
    );

    if (openLanes.length === 0) {
      break;
    }

    const lane = openLanes[Math.floor(Math.random() * openLanes.length)]!;

    nextEnemies = [...nextEnemies, createArcadeStashDefenseEnemy(lane, config, now, spawned)];
    spawned += 1;
  }

  if (spawned === 0) {
    return { enemies, state };
  }

  return {
    enemies: nextEnemies,
    state: {
      ...state,
      lastSpawnAt: now,
    },
  };
}

export function updateArcadeStashDefenseEnemies(
  enemies: ArcadeStashDefenseEnemy[],
  state: ArcadeStashDefenseState,
): { enemies: ArcadeStashDefenseEnemy[]; state: ArcadeStashDefenseState; stashHits: number } {
  let stashHits = 0;
  let stashHp = state.stashHp;
  let playerLives = state.playerLives;
  const nextEnemies: ArcadeStashDefenseEnemy[] = [];

  for (const enemy of enemies) {
    const nextX = enemy.x - enemy.speed;

    if (nextX <= ARCADE_STASH_DEFENSE_STASH_ZONE_X) {
      stashHits += 1;

      if (playerLives !== null) {
        playerLives = Math.max(0, playerLives - 1);
      } else {
        stashHp = Math.max(0, stashHp - 1);
      }

      continue;
    }

    nextEnemies.push({
      ...enemy,
      x: nextX,
    });
  }

  return {
    enemies: nextEnemies,
    state: {
      ...state,
      stashHp,
      playerLives,
    },
    stashHits,
  };
}

export function canShootArcadeStashDefenseLane(
  lane: number,
  state: ArcadeStashDefenseState,
  now: number,
  config: ArcadeStashDefenseGameConfig,
): boolean {
  if (config.freeShoot) {
    return true;
  }

  const shotsInBurst = state.burstShotsInBurst[lane] ?? 0;

  if (shotsInBurst > 0 && shotsInBurst < config.burstSize) {
    return true;
  }

  return shotsInBurst === 0 && now >= (state.burstCooldownUntil[lane] ?? 0);
}

export function createArcadeStashDefenseBullet(
  lane: number,
  config: ArcadeStashDefenseGameConfig,
  now: number,
  spawned: number,
): ArcadeStashDefenseBullet {
  return {
    id: 'stash-bullet-' + lane + '-' + Math.floor(now) + '-' + spawned,
    lane,
    x: config.bulletSpawnX,
  };
}

export function shootArcadeStashDefenseLane(
  lane: number,
  bullets: ArcadeStashDefenseBullet[],
  state: ArcadeStashDefenseState,
  config: ArcadeStashDefenseGameConfig,
  now: number,
  spawned: number,
): {
  bullets: ArcadeStashDefenseBullet[];
  state: ArcadeStashDefenseState;
  shot: boolean;
  bullet: ArcadeStashDefenseBullet | null;
} {
  if (!canShootArcadeStashDefenseLane(lane, state, now, config)) {
    return { bullets, state, shot: false, bullet: null };
  }

  const bullet = createArcadeStashDefenseBullet(lane, config, now, spawned);

  if (config.freeShoot) {
    return {
      bullets: [...bullets, bullet],
      state,
      shot: true,
      bullet,
    };
  }

  const shotsInBurst = state.burstShotsInBurst[lane] ?? 0;
  const nextShotsInBurst = shotsInBurst + 1;
  const nextBurstShots = [...state.burstShotsInBurst];
  const nextCooldownUntil = [...state.burstCooldownUntil];

  nextBurstShots[lane] = nextShotsInBurst;

  if (nextShotsInBurst >= config.burstSize) {
    nextBurstShots[lane] = 0;
    nextCooldownUntil[lane] = now + config.burstCooldownMs;
  }

  return {
    bullets: [...bullets, bullet],
    state: {
      ...state,
      burstShotsInBurst: nextBurstShots,
      burstCooldownUntil: nextCooldownUntil,
    },
    shot: true,
    bullet,
  };
}

function arcadeStashDefenseBulletHitsEnemy(
  bullet: ArcadeStashDefenseBullet,
  enemy: ArcadeStashDefenseEnemy,
): boolean {
  return (
    bullet.lane === enemy.lane &&
    Math.abs(bullet.x - enemy.x) <= ARCADE_STASH_DEFENSE_BULLET_HIT_RADIUS
  );
}

export function updateArcadeStashDefenseBullets(
  bullets: ArcadeStashDefenseBullet[],
  enemies: ArcadeStashDefenseEnemy[],
  config: ArcadeStashDefenseGameConfig,
): {
  bullets: ArcadeStashDefenseBullet[];
  enemies: ArcadeStashDefenseEnemy[];
  kills: number;
  hits: number;
} {
  let kills = 0;
  let hits = 0;
  let nextEnemies = enemies;
  const nextBullets: ArcadeStashDefenseBullet[] = [];

  for (const bullet of bullets) {
    const nextX = bullet.x + config.bulletSpeed;

    if (nextX >= 112) {
      continue;
    }

    const movedBullet: ArcadeStashDefenseBullet = {
      ...bullet,
      x: nextX,
    };

    const laneEnemies = nextEnemies
      .filter((enemy) => enemy.lane === movedBullet.lane)
      .sort((left, right) => left.x - right.x);

    let consumed = false;

    for (const enemy of laneEnemies) {
      if (!arcadeStashDefenseBulletHitsEnemy(movedBullet, enemy)) {
        continue;
      }

      const nextHp = enemy.hp - config.bulletDamage;
      const remainingEnemies: ArcadeStashDefenseEnemy[] = [];

      for (const candidate of nextEnemies) {
        if (candidate.id !== enemy.id) {
          remainingEnemies.push(candidate);
          continue;
        }

        if (nextHp <= 0) {
          kills += 1;
          continue;
        }

        hits += 1;
        remainingEnemies.push({
          ...candidate,
          hp: nextHp,
        });
      }

      nextEnemies = remainingEnemies;
      consumed = true;
      break;
    }

    if (!consumed) {
      nextBullets.push(movedBullet);
    }
  }

  return {
    bullets: nextBullets,
    enemies: nextEnemies,
    kills,
    hits,
  };
}

export function readArcadeStashDefenseLaneFromKey(key: string): number | null {
  if (key === '1' || key === 'q' || key === 'Q') {
    return 0;
  }

  if (key === '2' || key === 'w' || key === 'W') {
    return 1;
  }

  if (key === '3' || key === 'e' || key === 'E') {
    return 2;
  }

  return null;
}

export function isArcadeStashDefenseDefeated(state: ArcadeStashDefenseState): boolean {
  if (state.playerLives !== null) {
    return state.playerLives <= 0;
  }

  return state.stashHp <= 0;
}

export function arcadeStashDefenseSurviveBonus(
  state: ArcadeStashDefenseState,
  remainingMs: number,
): number {
  return remainingMs <= 0 && !isArcadeStashDefenseDefeated(state) ? ARCADE_STASH_DEFENSE_SURVIVE_BONUS : 0;
}

export function formatArcadeStashDefenseLives(playerLives: number | null): string {
  return playerLives === null ? '∞' : String(playerLives);
}