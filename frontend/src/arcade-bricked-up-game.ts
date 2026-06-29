export const ARCADE_BRICKED_UP_GAME_ID = 'nami-bricked-up';

export const ARCADE_BRICKED_UP_LEADERBOARD_SIZE = 10;
export const ARCADE_BRICKED_UP_STARTING_LIVES = 3;
export const ARCADE_BRICKED_UP_BRICK_SCORE = 2;
export const ARCADE_BRICKED_UP_LEVEL_CLEAR_BONUS = 10;
export const ARCADE_BRICKED_UP_COMPLETE_BONUS = 24;
export const ARCADE_BRICKED_UP_FIELD_WIDTH = 100;
export const ARCADE_BRICKED_UP_FIELD_HEIGHT = 100;
export const ARCADE_BRICKED_UP_BRICK_COLUMNS = 10;
export const ARCADE_BRICKED_UP_BALL_RADIUS = 1.1;
export const ARCADE_BRICKED_UP_PADDLE_Y = 91;
export const ARCADE_BRICKED_UP_PADDLE_HEIGHT = 2.4;
export const ARCADE_BRICKED_UP_DEATH_Y = 98;
export const ARCADE_BRICKED_UP_WALL_PADDING = 2;
export const ARCADE_BRICKED_UP_EFFECT_DURATION_TICKS = 480;
export const ARCADE_BRICKED_UP_MYSTERY_DROP_CHANCE = 0.22;
export const ARCADE_BRICKED_UP_HAZARD_DROP_CHANCE = 0.45;
export const ARCADE_BRICKED_UP_EXPLOSIVE_HAZARD_BASE_SIZE = 6.4;
export const ARCADE_BRICKED_UP_EFFECT_TICKS_PER_SECOND = 60;
export const ARCADE_BRICKED_UP_HAZARD_INVULN_TICKS = 90;
export const ARCADE_BRICKED_UP_SHOOTER_INTERVAL_TICKS = 14;
export const ARCADE_BRICKED_UP_EXPLOSION_DURATION_TICKS = 36;
export const ARCADE_BRICKED_UP_SKILL_BALL_LAUNCH_LAG_TICKS = 48;

import {
  arcadeSkillDiffScaledSpeed,
  ARCADE_SKILL_DIFF_MODE,
  ARCADE_SKILL_DIFF_MODE_LABEL,
} from './arcade-skill-diff.js';

export type ArcadeBrickedUpMode = 'normal' | 'hard' | typeof ARCADE_SKILL_DIFF_MODE;

export type ArcadeBrickedUpPowerUp =
  | 'shrink'
  | 'widen'
  | 'shooter'
  | 'magnet'
  | 'enlarge'
  | 'multiball'
  | 'slowTime';

export type ArcadeBrickedUpPowerDown =
  | 'hazardSpeedUp'
  | 'hazardScaleUp'
  | 'hazardSpawnUp'
  | 'giantMeteor'
  | 'bottomBlast'
  | 'darkMode';

export type ArcadeBrickedUpEffectType = ArcadeBrickedUpPowerUp | ArcadeBrickedUpPowerDown;

export type ArcadeBrickedUpGameConfig = {
  mode: ArcadeBrickedUpMode;
  levelCount: number;
  brickHpMin: number;
  brickHpMax: number;
  ballSpeed: number;
  ballCount: number;
  paddleWidth: number;
  paddleSpeed: number;
  startingLives: number;
  hazardSpawnIntervalTicks: number;
};

export type ArcadeBrickedUpBrick = {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
};

export type ArcadeBrickedUpBall = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  launched: boolean;
};

export type ArcadeBrickedUpMysteryDrop = {
  id: string;
  x: number;
  y: number;
  vy: number;
  rotation: number;
};

export type ArcadeBrickedUpHazardKind = 'shard' | 'explosive';

export type ArcadeBrickedUpHazard = {
  id: string;
  kind: ArcadeBrickedUpHazardKind;
  x: number;
  y: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
};

export type ArcadeBrickedUpProjectile = {
  id: string;
  x: number;
  y: number;
  vy: number;
};

export type ArcadeBrickedUpExplosion = {
  id: string;
  x: number;
  y: number;
  radius: number;
  expiresAtTick: number;
};

export type ArcadeBrickedUpActiveEffect = {
  id: string;
  type: ArcadeBrickedUpEffectType;
  expiresAtTick: number;
};

export type ArcadeBrickedUpModifiers = {
  paddleWidthMultiplier: number;
  ballRadiusMultiplier: number;
  timeScale: number;
  hazardSpeedMultiplier: number;
  hazardScaleMultiplier: number;
  hazardSpawnIntervalDivisor: number;
  hasShooter: boolean;
  hasMagnet: boolean;
  hasGiantMeteor: boolean;
  hasBottomBlast: boolean;
  hasDarkMode: boolean;
};

export type ArcadeBrickedUpState = {
  levelIndex: number;
  lives: number;
  paddleX: number;
  balls: ArcadeBrickedUpBall[];
  bricks: ArcadeBrickedUpBrick[];
  bricksBroken: number;
  score: number;
  awaitingServe: boolean;
  completed: boolean;
  tick: number;
  drops: ArcadeBrickedUpMysteryDrop[];
  hazards: ArcadeBrickedUpHazard[];
  projectiles: ArcadeBrickedUpProjectile[];
  explosions: ArcadeBrickedUpExplosion[];
  activeEffects: ArcadeBrickedUpActiveEffect[];
  magnetHeldBallId: string | null;
  nextHazardSpawnTick: number;
  nextMeteorSpawnTick: number;
  shooterCooldownTicks: number;
  hazardInvulnUntilTick: number;
  nextSkillBallLaunchTick: number | null;
};

export type ArcadeBrickedUpUpdateInput = {
  paddleDirection: -1 | 0 | 1;
  releaseMagnet?: boolean;
};

const ARCADE_BRICKED_UP_POWER_UPS: ArcadeBrickedUpPowerUp[] = [
  'shrink',
  'widen',
  'shooter',
  'magnet',
  'enlarge',
  'multiball',
  'slowTime',
];

const ARCADE_BRICKED_UP_POWER_DOWNS: ArcadeBrickedUpPowerDown[] = [
  'hazardSpeedUp',
  'hazardScaleUp',
  'hazardSpawnUp',
  'giantMeteor',
  'bottomBlast',
  'darkMode',
];

let arcadeBrickedUpIdCounter = 0;

function nextArcadeBrickedUpId(prefix: string): string {
  arcadeBrickedUpIdCounter += 1;

  return prefix + '-' + arcadeBrickedUpIdCounter;
}

export function resetArcadeBrickedUpIdCounterForTests(): void {
  arcadeBrickedUpIdCounter = 0;
}

export function arcadeBrickedUpGameConfig(mode: ArcadeBrickedUpMode): ArcadeBrickedUpGameConfig {
  if (mode === 'hard') {
    return {
      mode,
      levelCount: 4,
      brickHpMin: 1,
      brickHpMax: 2,
      ballSpeed: 0.72,
      ballCount: 1,
      paddleWidth: 16,
      paddleSpeed: 0.95,
      startingLives: ARCADE_BRICKED_UP_STARTING_LIVES,
      hazardSpawnIntervalTicks: 140,
    };
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return {
      mode,
      levelCount: 5,
      brickHpMin: 2,
      brickHpMax: 3,
      ballSpeed: arcadeSkillDiffScaledSpeed(0.28),
      ballCount: 2,
      paddleWidth: 14,
      paddleSpeed: 1.05,
      startingLives: ARCADE_BRICKED_UP_STARTING_LIVES,
      hazardSpawnIntervalTicks: 105,
    };
  }

  return {
    mode,
    levelCount: 3,
    brickHpMin: 1,
    brickHpMax: 1,
    ballSpeed: 0.58,
    ballCount: 1,
    paddleWidth: 18,
    paddleSpeed: 0.88,
    startingLives: ARCADE_BRICKED_UP_STARTING_LIVES,
    hazardSpawnIntervalTicks: 180,
  };
}

export function arcadeBrickedUpModeLabel(mode: ArcadeBrickedUpMode): string {
  if (mode === 'hard') {
    return 'Heat Layer';
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return ARCADE_SKILL_DIFF_MODE_LABEL;
  }

  return 'Street Break';
}

export function arcadeBrickedUpEffectLabel(type: ArcadeBrickedUpEffectType): string {
  switch (type) {
    case 'shrink':
      return 'Shrink';
    case 'widen':
      return 'Widen';
    case 'shooter':
      return 'Shooter';
    case 'magnet':
      return 'Magnet';
    case 'enlarge':
      return 'Enlarge';
    case 'multiball':
      return 'Multiball';
    case 'slowTime':
      return 'Slow Time';
    case 'hazardSpeedUp':
      return 'Hazard Rush';
    case 'hazardScaleUp':
      return 'Heavy Rain';
    case 'hazardSpawnUp':
      return 'Spawn Surge';
    case 'giantMeteor':
      return 'Explosive Rain';
    case 'bottomBlast':
      return 'Bottom Blast';
    case 'darkMode':
      return 'Dark Mode';
    default:
      return 'Mystery';
  }
}

export function isArcadeBrickedUpPowerDown(type: ArcadeBrickedUpEffectType): boolean {
  return (ARCADE_BRICKED_UP_POWER_DOWNS as readonly string[]).includes(type);
}

export function rollArcadeBrickedUpMysteryEffect(random = Math.random): ArcadeBrickedUpEffectType {
  const pool = random() < 0.5 ? ARCADE_BRICKED_UP_POWER_UPS : ARCADE_BRICKED_UP_POWER_DOWNS;

  return pool[Math.floor(random() * pool.length)]!;
}

export function computeArcadeBrickedUpModifiers(
  activeEffects: ArcadeBrickedUpActiveEffect[],
  tick: number,
): ArcadeBrickedUpModifiers {
  const modifiers: ArcadeBrickedUpModifiers = {
    paddleWidthMultiplier: 1,
    ballRadiusMultiplier: 1,
    timeScale: 1,
    hazardSpeedMultiplier: 1,
    hazardScaleMultiplier: 1,
    hazardSpawnIntervalDivisor: 1,
    hasShooter: false,
    hasMagnet: false,
    hasGiantMeteor: false,
    hasBottomBlast: false,
    hasDarkMode: false,
  };

  for (const effect of activeEffects) {
    if (effect.expiresAtTick <= tick) {
      continue;
    }

    switch (effect.type) {
      case 'shrink':
        modifiers.paddleWidthMultiplier *= 0.62;
        break;
      case 'widen':
        modifiers.paddleWidthMultiplier *= 1.48;
        break;
      case 'shooter':
        modifiers.hasShooter = true;
        break;
      case 'magnet':
        modifiers.hasMagnet = true;
        break;
      case 'enlarge':
        modifiers.ballRadiusMultiplier *= 1.65;
        break;
      case 'slowTime':
        modifiers.timeScale *= 0.42;
        break;
      case 'hazardSpeedUp':
        modifiers.hazardSpeedMultiplier *= 1.55;
        break;
      case 'hazardScaleUp':
        modifiers.hazardScaleMultiplier *= 1.45;
        break;
      case 'hazardSpawnUp':
        modifiers.hazardSpawnIntervalDivisor *= 1.6;
        break;
      case 'giantMeteor':
        modifiers.hasGiantMeteor = true;
        break;
      case 'bottomBlast':
        modifiers.hasBottomBlast = true;
        break;
      case 'darkMode':
        modifiers.hasDarkMode = true;
        break;
      case 'multiball':
        break;
      default:
        break;
    }
  }

  return modifiers;
}

export function expireArcadeBrickedUpEffects(
  activeEffects: ArcadeBrickedUpActiveEffect[],
  tick: number,
): ArcadeBrickedUpActiveEffect[] {
  return activeEffects.filter((effect) => effect.expiresAtTick > tick);
}

export function effectiveArcadeBrickedUpPaddleWidth(
  config: ArcadeBrickedUpGameConfig,
  modifiers: ArcadeBrickedUpModifiers,
): number {
  return config.paddleWidth * modifiers.paddleWidthMultiplier;
}

export function effectiveArcadeBrickedUpBallRadius(modifiers: ArcadeBrickedUpModifiers): number {
  return ARCADE_BRICKED_UP_BALL_RADIUS * modifiers.ballRadiusMultiplier;
}

function brickRowsForLevel(levelIndex: number, levelCount: number): number {
  const baseRows = 3;
  const extraRows = Math.min(levelIndex + 1, levelCount);

  return baseRows + extraRows;
}

function randomBrickHp(config: ArcadeBrickedUpGameConfig): number {
  const span = config.brickHpMax - config.brickHpMin + 1;

  return config.brickHpMin + Math.floor(Math.random() * span);
}

export function createArcadeBrickedUpBricks(
  levelIndex: number,
  config: ArcadeBrickedUpGameConfig,
): ArcadeBrickedUpBrick[] {
  const rows = brickRowsForLevel(levelIndex, config.levelCount);
  const marginX = 6;
  const gapX = 0.6;
  const gapY = 0.5;
  const usableWidth = ARCADE_BRICKED_UP_FIELD_WIDTH - marginX * 2;
  const brickWidth =
    (usableWidth - gapX * (ARCADE_BRICKED_UP_BRICK_COLUMNS - 1)) / ARCADE_BRICKED_UP_BRICK_COLUMNS;
  const brickHeight = 3.6;
  const startY = 10;
  const bricks: ArcadeBrickedUpBrick[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < ARCADE_BRICKED_UP_BRICK_COLUMNS; col += 1) {
      const maxHp = randomBrickHp(config);

      bricks.push({
        id: 'brick-' + levelIndex + '-' + row + '-' + col,
        col,
        row,
        x: marginX + col * (brickWidth + gapX),
        y: startY + row * (brickHeight + gapY),
        width: brickWidth,
        height: brickHeight,
        hp: maxHp,
        maxHp,
      });
    }
  }

  return bricks;
}

export function createArcadeBrickedUpBalls(
  paddleX: number,
  config: ArcadeBrickedUpGameConfig,
  count = config.ballCount,
  idOffset = 0,
): ArcadeBrickedUpBall[] {
  const launchAngles = count === 2 ? [-0.42, 0.42] : count > 2 ? undefined : [0.18];
  const angles =
    launchAngles ??
    Array.from({ length: count }, (_, index) => -0.72 + (index / Math.max(1, count - 1)) * 1.44);

  return angles.map((angle, index) => {
    const vx = Math.sin(angle) * config.ballSpeed;
    const vy = -Math.cos(angle) * config.ballSpeed;

    const ballId = 'ball-' + (idOffset + index);

    return {
      id: ballId,
      x: paddleX + arcadeBrickedUpBallPaddleXOffset(ballId, { ...config, ballCount: count }),
      y: ARCADE_BRICKED_UP_PADDLE_Y - ARCADE_BRICKED_UP_BALL_RADIUS - 0.4,
      vx,
      vy,
      speed: config.ballSpeed,
      launched: false,
    };
  });
}

export function createArcadeBrickedUpState(config: ArcadeBrickedUpGameConfig): ArcadeBrickedUpState {
  const paddleX = ARCADE_BRICKED_UP_FIELD_WIDTH / 2;

  return {
    levelIndex: 0,
    lives: config.startingLives,
    paddleX,
    balls: createArcadeBrickedUpBalls(paddleX, config),
    bricks: createArcadeBrickedUpBricks(0, config),
    bricksBroken: 0,
    score: 0,
    awaitingServe: true,
    completed: false,
    tick: 0,
    drops: [],
    hazards: [],
    projectiles: [],
    explosions: [],
    activeEffects: [],
    magnetHeldBallId: null,
    nextHazardSpawnTick: config.hazardSpawnIntervalTicks,
    nextMeteorSpawnTick: 240,
    shooterCooldownTicks: 0,
    hazardInvulnUntilTick: 0,
    nextSkillBallLaunchTick: null,
  };
}

export function clampArcadeBrickedUpPaddleX(
  paddleX: number,
  config: ArcadeBrickedUpGameConfig,
  modifiers: ArcadeBrickedUpModifiers = computeArcadeBrickedUpModifiers([], 0),
): number {
  const halfWidth = effectiveArcadeBrickedUpPaddleWidth(config, modifiers) / 2;
  const minX = ARCADE_BRICKED_UP_WALL_PADDING + halfWidth;
  const maxX = ARCADE_BRICKED_UP_FIELD_WIDTH - ARCADE_BRICKED_UP_WALL_PADDING - halfWidth;

  return Math.min(maxX, Math.max(minX, paddleX));
}

export function moveArcadeBrickedUpPaddle(
  paddleX: number,
  direction: -1 | 0 | 1,
  config: ArcadeBrickedUpGameConfig,
  modifiers: ArcadeBrickedUpModifiers,
): number {
  if (direction === 0) {
    return paddleX;
  }

  return clampArcadeBrickedUpPaddleX(paddleX + direction * config.paddleSpeed, config, modifiers);
}

export function aimArcadeBrickedUpPaddleFromPointer(
  paddleX: number,
  pointerXPercent: number,
  config: ArcadeBrickedUpGameConfig,
  modifiers: ArcadeBrickedUpModifiers,
): number {
  return clampArcadeBrickedUpPaddleX(pointerXPercent, config, modifiers);
}

export function releaseArcadeBrickedUpBallFromPaddle(
  ball: ArcadeBrickedUpBall,
  paddleX: number,
  paddleWidth: number,
): ArcadeBrickedUpBall {
  const halfWidth = paddleWidth / 2;
  const hitOffset = halfWidth > 0 ? (ball.x - paddleX) / halfWidth : 0;
  const clampedOffset = Math.min(0.92, Math.max(-0.92, hitOffset));
  const angle = clampedOffset * 0.9;
  const vx = Math.sin(angle) * ball.speed;
  const vy = -Math.abs(Math.cos(angle) * ball.speed);

  return {
    ...ball,
    launched: true,
    vx,
    vy,
  };
}

export function hasArcadeBrickedUpUnlaunchedBalls(state: ArcadeBrickedUpState): boolean {
  return state.balls.some((ball) => !ball.launched);
}

export function readArcadeBrickedUpSpotlightBall(
  balls: ArcadeBrickedUpBall[],
): ArcadeBrickedUpBall | null {
  const primaryBall = balls.find((ball) => ball.id === 'ball-0');

  if (primaryBall) {
    return primaryBall;
  }

  const launchedBall = balls.find((ball) => ball.launched);

  if (launchedBall) {
    return launchedBall;
  }

  return balls[0] ?? null;
}

export function arcadeBrickedUpBallPaddleXOffset(
  ballId: string,
  config: ArcadeBrickedUpGameConfig,
): number {
  if (ballId === 'ball-0' || ballId === 'ball-1') {
    const offsetIndex = ballId === 'ball-1' ? 1 : 0;

    return (offsetIndex - (config.ballCount - 1) / 2) * 2.2;
  }

  return 0;
}

function respawnArcadeBrickedUpSkillBall(
  paddleX: number,
  config: ArcadeBrickedUpGameConfig,
): ArcadeBrickedUpBall {
  return {
    id: nextArcadeBrickedUpId('ball'),
    x: paddleX,
    y: ARCADE_BRICKED_UP_PADDLE_Y - ARCADE_BRICKED_UP_BALL_RADIUS - 0.4,
    vx: 0,
    vy: 0,
    speed: config.ballSpeed,
    launched: false,
  };
}

function launchNextArcadeBrickedUpHeldBall(
  state: ArcadeBrickedUpState,
  config: ArcadeBrickedUpGameConfig,
  modifiers: ArcadeBrickedUpModifiers,
  scheduleFollowUpLaunches: boolean,
): ArcadeBrickedUpState {
  const paddleWidth = effectiveArcadeBrickedUpPaddleWidth(config, modifiers);
  const firstHeld = state.balls.find((ball) => !ball.launched);

  if (!firstHeld) {
    return {
      ...state,
      awaitingServe: false,
      nextSkillBallLaunchTick: null,
    };
  }

  const balls = state.balls.map((ball) =>
    ball.id === firstHeld.id
      ? releaseArcadeBrickedUpBallFromPaddle(ball, state.paddleX, paddleWidth)
      : ball,
  );
  const hasMoreHeld = balls.some((ball) => !ball.launched);

  return {
    ...state,
    awaitingServe: false,
    balls,
    nextSkillBallLaunchTick:
      scheduleFollowUpLaunches && hasMoreHeld
        ? state.tick + ARCADE_BRICKED_UP_SKILL_BALL_LAUNCH_LAG_TICKS
        : null,
  };
}

export function launchArcadeBrickedUpBalls(
  state: ArcadeBrickedUpState,
  config: ArcadeBrickedUpGameConfig,
  modifiers: ArcadeBrickedUpModifiers = computeArcadeBrickedUpModifiers(state.activeEffects, state.tick),
): ArcadeBrickedUpState {
  const paddleWidth = effectiveArcadeBrickedUpPaddleWidth(config, modifiers);

  if (state.magnetHeldBallId !== null) {
    const heldId = state.magnetHeldBallId;

    return {
      ...state,
      magnetHeldBallId: null,
      nextSkillBallLaunchTick: null,
      balls: state.balls.map((ball) =>
        ball.id === heldId ? releaseArcadeBrickedUpBallFromPaddle(ball, state.paddleX, paddleWidth) : ball,
      ),
    };
  }

  if (state.awaitingServe) {
    if (config.mode === ARCADE_SKILL_DIFF_MODE) {
      return launchNextArcadeBrickedUpHeldBall(state, config, modifiers, true);
    }

    return {
      ...state,
      awaitingServe: false,
      nextSkillBallLaunchTick: null,
      balls: state.balls.map((ball) => releaseArcadeBrickedUpBallFromPaddle(ball, state.paddleX, paddleWidth)),
    };
  }

  if (config.mode === ARCADE_SKILL_DIFF_MODE) {
    const firstHeld = state.balls.find((ball) => !ball.launched);

    if (firstHeld) {
      return launchNextArcadeBrickedUpHeldBall(state, config, modifiers, false);
    }
  }

  return state;
}

function normalizeBallVelocity(ball: ArcadeBrickedUpBall): ArcadeBrickedUpBall {
  const magnitude = Math.hypot(ball.vx, ball.vy) || ball.speed;

  return {
    ...ball,
    vx: (ball.vx / magnitude) * ball.speed,
    vy: (ball.vy / magnitude) * ball.speed,
  };
}

function reflectBallOnWalls(ball: ArcadeBrickedUpBall, ballRadius: number): ArcadeBrickedUpBall {
  let nextBall = { ...ball };

  if (nextBall.x - ballRadius <= ARCADE_BRICKED_UP_WALL_PADDING) {
    nextBall.x = ARCADE_BRICKED_UP_WALL_PADDING + ballRadius;
    nextBall.vx = Math.abs(nextBall.vx);
  }

  if (nextBall.x + ballRadius >= ARCADE_BRICKED_UP_FIELD_WIDTH - ARCADE_BRICKED_UP_WALL_PADDING) {
    nextBall.x = ARCADE_BRICKED_UP_FIELD_WIDTH - ARCADE_BRICKED_UP_WALL_PADDING - ballRadius;
    nextBall.vx = -Math.abs(nextBall.vx);
  }

  if (nextBall.y - ballRadius <= ARCADE_BRICKED_UP_WALL_PADDING) {
    nextBall.y = ARCADE_BRICKED_UP_WALL_PADDING + ballRadius;
    nextBall.vy = Math.abs(nextBall.vy);
  }

  return normalizeBallVelocity(nextBall);
}

function ballIntersectsBrick(
  ball: ArcadeBrickedUpBall,
  brick: ArcadeBrickedUpBrick,
  ballRadius: number,
): boolean {
  const closestX = Math.min(Math.max(ball.x, brick.x), brick.x + brick.width);
  const closestY = Math.min(Math.max(ball.y, brick.y), brick.y + brick.height);
  const distanceX = ball.x - closestX;
  const distanceY = ball.y - closestY;

  return distanceX * distanceX + distanceY * distanceY <= ballRadius * ballRadius;
}

function bounceBallFromBrick(
  ball: ArcadeBrickedUpBall,
  brick: ArcadeBrickedUpBrick,
): ArcadeBrickedUpBall {
  const ballRadius = ARCADE_BRICKED_UP_BALL_RADIUS;
  const overlapLeft = ball.x + ballRadius - brick.x;
  const overlapRight = brick.x + brick.width - (ball.x - ballRadius);
  const overlapTop = ball.y + ballRadius - brick.y;
  const overlapBottom = brick.y + brick.height - (ball.y - ballRadius);
  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  if (minOverlap === overlapLeft || minOverlap === overlapRight) {
    return normalizeBallVelocity({
      ...ball,
      vx: minOverlap === overlapLeft ? -Math.abs(ball.vx) : Math.abs(ball.vx),
    });
  }

  return normalizeBallVelocity({
    ...ball,
    vy: minOverlap === overlapTop ? -Math.abs(ball.vy) : Math.abs(ball.vy),
  });
}

function bounceBallFromPaddle(
  ball: ArcadeBrickedUpBall,
  paddleX: number,
  paddleWidth: number,
): ArcadeBrickedUpBall {
  const halfWidth = paddleWidth / 2;
  const hitOffset = (ball.x - paddleX) / halfWidth;
  const clampedOffset = Math.min(0.92, Math.max(-0.92, hitOffset));
  const angle = clampedOffset * 0.9;
  const vx = Math.sin(angle) * ball.speed;
  const vy = -Math.abs(Math.cos(angle) * ball.speed);

  return {
    ...ball,
    y: ARCADE_BRICKED_UP_PADDLE_Y - ARCADE_BRICKED_UP_BALL_RADIUS - 0.2,
    vx,
    vy,
  };
}

function damageBrick(
  bricks: ArcadeBrickedUpBrick[],
  brickId: string,
): {
  bricks: ArcadeBrickedUpBrick[];
  bricksBroken: number;
  scoreDelta: number;
  brokenBrick: ArcadeBrickedUpBrick | null;
} {
  let bricksBroken = 0;
  let scoreDelta = 0;
  let brokenBrick: ArcadeBrickedUpBrick | null = null;
  const nextBricks: ArcadeBrickedUpBrick[] = [];

  for (const candidate of bricks) {
    if (candidate.id !== brickId) {
      nextBricks.push(candidate);
      continue;
    }

    const nextHp = candidate.hp - 1;

    if (nextHp <= 0) {
      bricksBroken += 1;
      scoreDelta += ARCADE_BRICKED_UP_BRICK_SCORE;
      brokenBrick = candidate;
      continue;
    }

    nextBricks.push({
      ...candidate,
      hp: nextHp,
    });
    scoreDelta += ARCADE_BRICKED_UP_BRICK_SCORE;
  }

  return {
    bricks: nextBricks,
    bricksBroken,
    scoreDelta,
    brokenBrick,
  };
}

export function spawnArcadeBrickedUpSkyDrop(): ArcadeBrickedUpMysteryDrop {
  const margin = 10;

  return {
    id: nextArcadeBrickedUpId('drop'),
    x: margin + Math.random() * (ARCADE_BRICKED_UP_FIELD_WIDTH - margin * 2),
    y: -4,
    vy: 0.48 + Math.random() * 0.18,
    rotation: Math.random() * 360,
  };
}

function maybeSpawnMysteryDrop(brokenBrick: ArcadeBrickedUpBrick | null): ArcadeBrickedUpMysteryDrop[] {
  if (brokenBrick === null || Math.random() >= ARCADE_BRICKED_UP_MYSTERY_DROP_CHANCE) {
    return [];
  }

  return [
    {
      id: nextArcadeBrickedUpId('drop'),
      x: brokenBrick.x + brokenBrick.width / 2,
      y: brokenBrick.y + brokenBrick.height / 2,
      vy: 0.52,
      rotation: Math.random() * 360,
    },
  ];
}

export function applyArcadeBrickedUpEffect(
  state: ArcadeBrickedUpState,
  effectType: ArcadeBrickedUpEffectType,
  config: ArcadeBrickedUpGameConfig,
): ArcadeBrickedUpState {
  const nextEffect: ArcadeBrickedUpActiveEffect = {
    id: nextArcadeBrickedUpId('effect'),
    type: effectType,
    expiresAtTick: state.tick + ARCADE_BRICKED_UP_EFFECT_DURATION_TICKS,
  };

  let nextState: ArcadeBrickedUpState = {
    ...state,
    activeEffects: [...state.activeEffects, nextEffect],
  };

  if (effectType === 'multiball') {
    const extraBalls = createArcadeBrickedUpBalls(
      state.paddleX,
      config,
      8,
      state.balls.length + 100,
    ).map((ball) => ({
      ...ball,
      launched: true,
    }));

    nextState = {
      ...nextState,
      awaitingServe: false,
      balls: [...nextState.balls, ...extraBalls],
    };
  }

  return nextState;
}

function paddleIntersectsPoint(
  paddleX: number,
  paddleWidth: number,
  x: number,
  y: number,
  padding = 1.2,
): boolean {
  const halfWidth = paddleWidth / 2;
  const paddleTop = ARCADE_BRICKED_UP_PADDLE_Y - ARCADE_BRICKED_UP_PADDLE_HEIGHT / 2;
  const paddleBottom = ARCADE_BRICKED_UP_PADDLE_Y + ARCADE_BRICKED_UP_PADDLE_HEIGHT / 2;

  return (
    y + padding >= paddleTop &&
    y - padding <= paddleBottom &&
    x >= paddleX - halfWidth &&
    x <= paddleX + halfWidth
  );
}

function spawnArcadeBrickedUpHazard(
  kind: ArcadeBrickedUpHazardKind,
  modifiers: ArcadeBrickedUpModifiers,
): ArcadeBrickedUpHazard {
  const margin = 8;
  const x = margin + Math.random() * (ARCADE_BRICKED_UP_FIELD_WIDTH - margin * 2);

  if (kind === 'explosive') {
    return {
      id: nextArcadeBrickedUpId('explosive'),
      kind,
      x,
      y: -8,
      vy: (0.26 + Math.random() * 0.1) * modifiers.hazardSpeedMultiplier,
      size: ARCADE_BRICKED_UP_EXPLOSIVE_HAZARD_BASE_SIZE * modifiers.hazardScaleMultiplier,
      rotation: Math.random() * 360,
      rotationSpeed: 3.4 + Math.random() * 2.6,
    };
  }

  return {
    id: nextArcadeBrickedUpId('hazard'),
    kind: 'shard',
    x,
    y: -3,
    vy: (0.42 + Math.random() * 0.28) * modifiers.hazardSpeedMultiplier,
    size: (1.4 + Math.random() * 0.6) * modifiers.hazardScaleMultiplier,
    rotation: 0,
    rotationSpeed: 0,
  };
}

function updateArcadeBrickedUpHazards(
  hazards: ArcadeBrickedUpHazard[],
  modifiers: ArcadeBrickedUpModifiers,
  tick: number,
  paddleX: number,
  paddleWidth: number,
  lives: number,
  hazardInvulnUntilTick: number,
): {
  hazards: ArcadeBrickedUpHazard[];
  explosions: ArcadeBrickedUpExplosion[];
  lives: number;
  hazardInvulnUntilTick: number;
} {
  const nextHazards: ArcadeBrickedUpHazard[] = [];
  const nextExplosions: ArcadeBrickedUpExplosion[] = [];
  let nextLives = lives;
  let nextInvuln = hazardInvulnUntilTick;
  const timeScale = modifiers.timeScale;

  for (const hazard of hazards) {
    const nextY = hazard.y + hazard.vy * timeScale;

    if (nextY - hazard.size >= ARCADE_BRICKED_UP_DEATH_Y) {
      if (hazard.kind === 'explosive' && modifiers.hasGiantMeteor) {
        nextExplosions.push({
          id: nextArcadeBrickedUpId('blast'),
          x: hazard.x,
          y: ARCADE_BRICKED_UP_PADDLE_Y,
          radius: 18,
          expiresAtTick: tick + ARCADE_BRICKED_UP_EXPLOSION_DURATION_TICKS,
        });
      } else if (hazard.kind === 'shard' && modifiers.hasBottomBlast) {
        nextExplosions.push({
          id: nextArcadeBrickedUpId('blast'),
          x: hazard.x,
          y: ARCADE_BRICKED_UP_PADDLE_Y,
          radius: 12,
          expiresAtTick: tick + ARCADE_BRICKED_UP_EXPLOSION_DURATION_TICKS,
        });
      }

      continue;
    }

    const nextHazard = {
      ...hazard,
      y: nextY,
      rotation:
        hazard.kind === 'explosive'
          ? hazard.rotation + hazard.rotationSpeed * timeScale
          : hazard.rotation,
    };

    if (
      tick >= nextInvuln &&
      paddleIntersectsPoint(paddleX, paddleWidth, nextHazard.x, nextHazard.y, nextHazard.size)
    ) {
      nextLives = Math.max(0, nextLives - 1);
      nextInvuln = tick + ARCADE_BRICKED_UP_HAZARD_INVULN_TICKS;
      continue;
    }

    nextHazards.push(nextHazard);
  }

  return {
    hazards: nextHazards,
    explosions: nextExplosions,
    lives: nextLives,
    hazardInvulnUntilTick: nextInvuln,
  };
}

function updateArcadeBrickedUpExplosions(
  explosions: ArcadeBrickedUpExplosion[],
  incoming: ArcadeBrickedUpExplosion[],
  tick: number,
  paddleX: number,
  paddleWidth: number,
  lives: number,
  hazardInvulnUntilTick: number,
): {
  explosions: ArcadeBrickedUpExplosion[];
  lives: number;
  hazardInvulnUntilTick: number;
} {
  const merged = [...explosions, ...incoming].filter((explosion) => explosion.expiresAtTick > tick);
  let nextLives = lives;
  let nextInvuln = hazardInvulnUntilTick;

  if (tick < nextInvuln) {
    return {
      explosions: merged,
      lives: nextLives,
      hazardInvulnUntilTick: nextInvuln,
    };
  }

  for (const explosion of merged) {
    if (Math.abs(paddleX - explosion.x) <= explosion.radius + paddleWidth / 2) {
      nextLives = Math.max(0, nextLives - 1);
      nextInvuln = tick + ARCADE_BRICKED_UP_HAZARD_INVULN_TICKS;
      break;
    }
  }

  return {
    explosions: merged,
    lives: nextLives,
    hazardInvulnUntilTick: nextInvuln,
  };
}

function updateArcadeBrickedUpDrops(
  drops: ArcadeBrickedUpMysteryDrop[],
  modifiers: ArcadeBrickedUpModifiers,
  paddleX: number,
  paddleWidth: number,
  state: ArcadeBrickedUpState,
  config: ArcadeBrickedUpGameConfig,
): {
  drops: ArcadeBrickedUpMysteryDrop[];
  state: ArcadeBrickedUpState;
} {
  const nextDrops: ArcadeBrickedUpMysteryDrop[] = [];
  let nextState = state;

  for (const drop of drops) {
    const nextY = drop.y + drop.vy * modifiers.timeScale;

    if (nextY >= ARCADE_BRICKED_UP_DEATH_Y) {
      continue;
    }

    if (paddleIntersectsPoint(paddleX, paddleWidth, drop.x, nextY, 1.8)) {
      nextState = applyArcadeBrickedUpEffect(nextState, rollArcadeBrickedUpMysteryEffect(), config);
      continue;
    }

    nextDrops.push({
      ...drop,
      y: nextY,
      rotation: drop.rotation + 4.8 * modifiers.timeScale,
    });
  }

  return {
    drops: nextDrops,
    state: nextState,
  };
}

function updateArcadeBrickedUpProjectiles(
  projectiles: ArcadeBrickedUpProjectile[],
  bricks: ArcadeBrickedUpBrick[],
  modifiers: ArcadeBrickedUpModifiers,
): {
  projectiles: ArcadeBrickedUpProjectile[];
  bricks: ArcadeBrickedUpBrick[];
  bricksBroken: number;
  scoreDelta: number;
  drops: ArcadeBrickedUpMysteryDrop[];
} {
  const nextProjectiles: ArcadeBrickedUpProjectile[] = [];
  let nextBricks = bricks;
  let bricksBroken = 0;
  let scoreDelta = 0;
  const spawnedDrops: ArcadeBrickedUpMysteryDrop[] = [];

  for (const projectile of projectiles) {
    const nextY = projectile.y + projectile.vy * modifiers.timeScale;

    if (nextY <= ARCADE_BRICKED_UP_WALL_PADDING) {
      continue;
    }

    let hitBrick = false;

    for (const brick of nextBricks) {
      if (
        projectile.x < brick.x ||
        projectile.x > brick.x + brick.width ||
        nextY < brick.y ||
        nextY > brick.y + brick.height
      ) {
        continue;
      }

      const damaged = damageBrick(nextBricks, brick.id);
      nextBricks = damaged.bricks;
      bricksBroken += damaged.bricksBroken;
      scoreDelta += damaged.scoreDelta;
      spawnedDrops.push(...maybeSpawnMysteryDrop(damaged.brokenBrick));
      hitBrick = true;
      break;
    }

    if (!hitBrick) {
      nextProjectiles.push({
        ...projectile,
        y: nextY,
      });
    }
  }

  return {
    projectiles: nextProjectiles,
    bricks: nextBricks,
    bricksBroken,
    scoreDelta,
    drops: spawnedDrops,
  };
}

export function updateArcadeBrickedUpBall(
  ball: ArcadeBrickedUpBall,
  paddleX: number,
  bricks: ArcadeBrickedUpBrick[],
  config: ArcadeBrickedUpGameConfig,
  awaitingServe: boolean,
  modifiers: ArcadeBrickedUpModifiers,
  magnetHeldBallId: string | null,
): {
  ball: ArcadeBrickedUpBall | null;
  bricks: ArcadeBrickedUpBrick[];
  bricksBroken: number;
  scoreDelta: number;
  drops: ArcadeBrickedUpMysteryDrop[];
  magnetHeldBallId: string | null;
} {
  const ballRadius = effectiveArcadeBrickedUpBallRadius(modifiers);
  const paddleWidth = effectiveArcadeBrickedUpPaddleWidth(config, modifiers);
  const timeScale = modifiers.timeScale;

  if (magnetHeldBallId === ball.id) {
    return {
      ball: {
        ...ball,
        launched: false,
        x: paddleX + arcadeBrickedUpBallPaddleXOffset(ball.id, config),
        y: ARCADE_BRICKED_UP_PADDLE_Y - ballRadius - 0.4,
        vx: 0,
        vy: 0,
      },
      bricks,
      bricksBroken: 0,
      scoreDelta: 0,
      drops: [],
      magnetHeldBallId,
    };
  }

  if (!ball.launched) {
    return {
      ball: {
        ...ball,
        x: paddleX + arcadeBrickedUpBallPaddleXOffset(ball.id, config),
        y: ARCADE_BRICKED_UP_PADDLE_Y - ballRadius - 0.4,
      },
      bricks,
      bricksBroken: 0,
      scoreDelta: 0,
      drops: [],
      magnetHeldBallId,
    };
  }

  let nextBall = {
    ...ball,
    x: ball.x + ball.vx * timeScale,
    y: ball.y + ball.vy * timeScale,
  };

  nextBall = reflectBallOnWalls(nextBall, ballRadius);

  const paddleTop = ARCADE_BRICKED_UP_PADDLE_Y - ARCADE_BRICKED_UP_PADDLE_HEIGHT / 2;

  if (
    nextBall.vy > 0 &&
    nextBall.y + ballRadius >= paddleTop &&
    nextBall.y - ballRadius <= ARCADE_BRICKED_UP_PADDLE_Y + ARCADE_BRICKED_UP_PADDLE_HEIGHT / 2 &&
    nextBall.x >= paddleX - paddleWidth / 2 &&
    nextBall.x <= paddleX + paddleWidth / 2
  ) {
    if (modifiers.hasMagnet && magnetHeldBallId === null) {
      return {
        ball: {
          ...nextBall,
          launched: false,
          vx: 0,
          vy: 0,
        },
        bricks,
        bricksBroken: 0,
        scoreDelta: 0,
        drops: [],
        magnetHeldBallId: ball.id,
      };
    }

    nextBall = bounceBallFromPaddle(nextBall, paddleX, paddleWidth);
  }

  if (nextBall.y - ballRadius >= ARCADE_BRICKED_UP_DEATH_Y) {
    return {
      ball: null,
      bricks,
      bricksBroken: 0,
      scoreDelta: 0,
      drops: [],
      magnetHeldBallId,
    };
  }

  let nextBricks = bricks;
  let bricksBroken = 0;
  let scoreDelta = 0;
  const spawnedDrops: ArcadeBrickedUpMysteryDrop[] = [];

  for (const brick of bricks) {
    if (!ballIntersectsBrick(nextBall, brick, ballRadius)) {
      continue;
    }

    const damaged = damageBrick(nextBricks, brick.id);
    nextBricks = damaged.bricks;
    bricksBroken += damaged.bricksBroken;
    scoreDelta += damaged.scoreDelta;
    spawnedDrops.push(...maybeSpawnMysteryDrop(damaged.brokenBrick));
    nextBall = bounceBallFromBrick(nextBall, brick);
    break;
  }

  return {
    ball: nextBall,
    bricks: nextBricks,
    bricksBroken,
    scoreDelta,
    drops: spawnedDrops,
    magnetHeldBallId,
  };
}

export function updateArcadeBrickedUpState(
  state: ArcadeBrickedUpState,
  config: ArcadeBrickedUpGameConfig,
  input: -1 | 0 | 1 | ArcadeBrickedUpUpdateInput = 0,
): ArcadeBrickedUpState {
  const paddleDirection = typeof input === 'number' ? input : input.paddleDirection;
  const releaseMagnet = typeof input === 'number' ? false : input.releaseMagnet ?? false;

  const tick = state.tick + 1;
  let activeEffects = expireArcadeBrickedUpEffects(state.activeEffects, tick);
  const modifiers = computeArcadeBrickedUpModifiers(activeEffects, tick);
  const paddleWidth = effectiveArcadeBrickedUpPaddleWidth(config, modifiers);

  let paddleX = moveArcadeBrickedUpPaddle(state.paddleX, paddleDirection, config, modifiers);
  let bricks = state.bricks;
  let bricksBroken = state.bricksBroken;
  let score = state.score;
  let lives = state.lives;
  let awaitingServe = state.awaitingServe;
  let levelIndex = state.levelIndex;
  let completed = state.completed;
  let magnetHeldBallId = state.magnetHeldBallId;
  let drops = state.drops;
  let hazards = state.hazards;
  let projectiles = state.projectiles;
  let explosions = state.explosions.filter((explosion) => explosion.expiresAtTick > tick);
  let hazardInvulnUntilTick = state.hazardInvulnUntilTick;
  let nextHazardSpawnTick = state.nextHazardSpawnTick;
  let nextMeteorSpawnTick = state.nextMeteorSpawnTick;
  let shooterCooldownTicks = Math.max(0, state.shooterCooldownTicks - 1);
  let nextSkillBallLaunchTick = state.nextSkillBallLaunchTick;
  const nextBalls: ArcadeBrickedUpBall[] = [];

  let ballsToUpdate = state.balls;

  if (
    config.mode === ARCADE_SKILL_DIFF_MODE &&
    nextSkillBallLaunchTick !== null &&
    tick >= nextSkillBallLaunchTick &&
    !awaitingServe
  ) {
    const firstHeld = ballsToUpdate.find((ball) => !ball.launched);

    if (firstHeld) {
      ballsToUpdate = ballsToUpdate.map((ball) =>
        ball.id === firstHeld.id
          ? releaseArcadeBrickedUpBallFromPaddle(ball, paddleX, paddleWidth)
          : ball,
      );
      const hasMoreHeld = ballsToUpdate.some((ball) => !ball.launched);
      nextSkillBallLaunchTick = hasMoreHeld
        ? tick + ARCADE_BRICKED_UP_SKILL_BALL_LAUNCH_LAG_TICKS
        : null;
    } else {
      nextSkillBallLaunchTick = null;
    }
  }

  if (releaseMagnet && magnetHeldBallId !== null) {
    const heldId = magnetHeldBallId;
    magnetHeldBallId = null;
    nextSkillBallLaunchTick = null;
    ballsToUpdate = state.balls.map((ball) =>
      ball.id === heldId
        ? releaseArcadeBrickedUpBallFromPaddle(ball, paddleX, paddleWidth)
        : ball,
    );
  }

  if (modifiers.hasShooter && shooterCooldownTicks === 0 && !awaitingServe) {
    projectiles = [
      ...projectiles,
      {
        id: nextArcadeBrickedUpId('shot'),
        x: paddleX,
        y: ARCADE_BRICKED_UP_PADDLE_Y - 1.5,
        vy: -1.35,
      },
    ];
    shooterCooldownTicks = ARCADE_BRICKED_UP_SHOOTER_INTERVAL_TICKS;
  }

  const hazardSpawnInterval = Math.max(
    45,
    Math.round(config.hazardSpawnIntervalTicks / modifiers.hazardSpawnIntervalDivisor),
  );

  if (tick >= nextHazardSpawnTick) {
    hazards = [...hazards, spawnArcadeBrickedUpHazard('shard', modifiers)];

    if (Math.random() < ARCADE_BRICKED_UP_HAZARD_DROP_CHANCE) {
      drops = [...drops, spawnArcadeBrickedUpSkyDrop()];
    }

    nextHazardSpawnTick = tick + hazardSpawnInterval;
  }

  if (modifiers.hasGiantMeteor && tick >= nextMeteorSpawnTick) {
    hazards = [...hazards, spawnArcadeBrickedUpHazard('explosive', modifiers)];

    if (Math.random() < ARCADE_BRICKED_UP_HAZARD_DROP_CHANCE + 0.15) {
      drops = [...drops, spawnArcadeBrickedUpSkyDrop()];
    }

    nextMeteorSpawnTick = tick + Math.max(90, Math.round(hazardSpawnInterval * 1.4));
  }

  hazards = hazards.filter(
    (hazard) => hazard.kind !== 'explosive' || modifiers.hasGiantMeteor,
  );

  const hazardUpdate = updateArcadeBrickedUpHazards(
    hazards,
    modifiers,
    tick,
    paddleX,
    paddleWidth,
    lives,
    hazardInvulnUntilTick,
  );
  hazards = hazardUpdate.hazards;
  lives = hazardUpdate.lives;
  hazardInvulnUntilTick = hazardUpdate.hazardInvulnUntilTick;

  const explosionUpdate = updateArcadeBrickedUpExplosions(
    explosions,
    hazardUpdate.explosions,
    tick,
    paddleX,
    paddleWidth,
    lives,
    hazardInvulnUntilTick,
  );
  explosions = explosionUpdate.explosions;
  lives = explosionUpdate.lives;
  hazardInvulnUntilTick = explosionUpdate.hazardInvulnUntilTick;

  for (const ball of ballsToUpdate) {
    const updated = updateArcadeBrickedUpBall(
      ball,
      paddleX,
      bricks,
      config,
      awaitingServe,
      modifiers,
      magnetHeldBallId,
    );
    bricks = updated.bricks;
    bricksBroken += updated.bricksBroken;
    score += updated.scoreDelta;
    drops = [...drops, ...updated.drops];
    magnetHeldBallId = updated.magnetHeldBallId;

    if (updated.ball !== null) {
      nextBalls.push(updated.ball);
    } else if (config.mode === ARCADE_SKILL_DIFF_MODE) {
      nextBalls.push(respawnArcadeBrickedUpSkillBall(paddleX, config));
    }
  }

  const projectileUpdate = updateArcadeBrickedUpProjectiles(projectiles, bricks, modifiers);
  projectiles = projectileUpdate.projectiles;
  bricks = projectileUpdate.bricks;
  bricksBroken += projectileUpdate.bricksBroken;
  score += projectileUpdate.scoreDelta;
  drops = [...drops, ...projectileUpdate.drops];

  const dropUpdate = updateArcadeBrickedUpDrops(drops, modifiers, paddleX, paddleWidth, {
    ...state,
    tick,
    activeEffects,
    balls: nextBalls,
    bricks,
    bricksBroken,
    score,
    lives,
    awaitingServe,
    levelIndex,
    completed,
    drops,
    hazards,
    projectiles,
    explosions,
    magnetHeldBallId,
    nextHazardSpawnTick,
    nextMeteorSpawnTick,
    shooterCooldownTicks,
    hazardInvulnUntilTick,
  }, config);
  drops = dropUpdate.drops;

  let nextState = dropUpdate.state;
  activeEffects = nextState.activeEffects;
  nextBalls.splice(0, nextBalls.length, ...nextState.balls);
  score = nextState.score;

  if (!awaitingServe && nextBalls.length === 0 && config.mode !== ARCADE_SKILL_DIFF_MODE) {
    lives = Math.max(0, lives - 1);

    if (lives > 0) {
      awaitingServe = true;
      magnetHeldBallId = null;
      nextSkillBallLaunchTick = null;
      nextBalls.push(...createArcadeBrickedUpBalls(paddleX, config));
    }
  }

  if (bricks.length === 0 && !completed) {
    score += ARCADE_BRICKED_UP_LEVEL_CLEAR_BONUS;
    const nextLevel = levelIndex + 1;

    if (nextLevel >= config.levelCount) {
      completed = true;
      score += ARCADE_BRICKED_UP_COMPLETE_BONUS;
      awaitingServe = false;

      return {
        levelIndex: nextLevel,
        lives,
        paddleX,
        balls: [],
        bricks: [],
        bricksBroken,
        score,
        awaitingServe,
        completed,
        tick,
        drops: [],
        hazards,
        projectiles: [],
        explosions,
        activeEffects,
        magnetHeldBallId: null,
        nextHazardSpawnTick,
        nextMeteorSpawnTick,
        shooterCooldownTicks,
        hazardInvulnUntilTick,
        nextSkillBallLaunchTick: null,
      };
    }

    levelIndex = nextLevel;
    bricks = createArcadeBrickedUpBricks(levelIndex, config);
    awaitingServe = true;
    magnetHeldBallId = null;
    nextSkillBallLaunchTick = null;
    nextBalls.splice(0, nextBalls.length, ...createArcadeBrickedUpBalls(paddleX, config));
  }

  return {
    levelIndex,
    lives,
    paddleX,
    balls: nextBalls,
    bricks,
    bricksBroken,
    score,
    awaitingServe,
    completed,
    tick,
    drops,
    hazards,
    projectiles,
    explosions,
    activeEffects,
    magnetHeldBallId,
    nextHazardSpawnTick,
    nextMeteorSpawnTick,
    shooterCooldownTicks,
    hazardInvulnUntilTick,
    nextSkillBallLaunchTick,
  };
}

export function isArcadeBrickedUpDefeated(state: ArcadeBrickedUpState): boolean {
  return state.lives <= 0 && !state.completed;
}

export function isArcadeBrickedUpVictory(state: ArcadeBrickedUpState, config: ArcadeBrickedUpGameConfig): boolean {
  return state.completed && state.levelIndex >= config.levelCount;
}

export function readArcadeBrickedUpPaddleDirection(keys: Set<string>): -1 | 0 | 1 {
  const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
  const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');

  if (left && !right) {
    return -1;
  }

  if (right && !left) {
    return 1;
  }

  return 0;
}

export function formatArcadeBrickedUpEffectRemainingSeconds(remainingTicks: number): number {
  return Math.max(0, Math.ceil(remainingTicks / ARCADE_BRICKED_UP_EFFECT_TICKS_PER_SECOND));
}

export function arcadeBrickedUpEffectProgress(remainingTicks: number): number {
  return Math.max(0, Math.min(1, remainingTicks / ARCADE_BRICKED_UP_EFFECT_DURATION_TICKS));
}

export function readArcadeBrickedUpActiveEffectChips(
  state: ArcadeBrickedUpState,
): Array<{
  id: string;
  label: string;
  isPowerDown: boolean;
  remainingTicks: number;
  remainingSeconds: number;
  progress: number;
}> {
  return state.activeEffects
    .filter((effect) => effect.expiresAtTick > state.tick)
    .map((effect) => {
      const remainingTicks = effect.expiresAtTick - state.tick;

      return {
        id: effect.id,
        label: arcadeBrickedUpEffectLabel(effect.type),
        isPowerDown: isArcadeBrickedUpPowerDown(effect.type),
        remainingTicks,
        remainingSeconds: formatArcadeBrickedUpEffectRemainingSeconds(remainingTicks),
        progress: arcadeBrickedUpEffectProgress(remainingTicks),
      };
    });
}

export function isArcadeBrickedUpHazardFlashing(state: ArcadeBrickedUpState): boolean {
  return state.tick < state.hazardInvulnUntilTick;
}