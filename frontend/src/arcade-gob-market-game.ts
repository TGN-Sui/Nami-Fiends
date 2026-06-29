export const ARCADE_GOB_MARKET_GAME_ID = 'nami-gob-market';

export const ARCADE_GOB_MARKET_GRID_SIZE = 15;
export const ARCADE_GOB_MARKET_GAME_DURATION_MS = 60_000;
export const ARCADE_GOB_MARKET_LEADERBOARD_SIZE = 10;
export const ARCADE_GOB_MARKET_TOKEN_SCORE = 3;
export const ARCADE_GOB_MARKET_SURVIVE_BONUS = 8;
export const ARCADE_GOB_MARKET_STARTING_LIVES = 3;

import {
  arcadeSkillDiffDoubledSpawnCount,
  arcadeSkillDiffFasterSpawnInterval,
  ARCADE_SKILL_DIFF_MODE,
  ARCADE_SKILL_DIFF_MODE_LABEL,
} from './arcade-skill-diff.js';

export type ArcadeGobMarketMode = 'normal' | 'hard' | typeof ARCADE_SKILL_DIFF_MODE;
export type ArcadeGobMarketDirection = 'up' | 'down' | 'left' | 'right';

export type ArcadeGobMarketPoint = {
  x: number;
  y: number;
};

export type ArcadeGobMarketToken = {
  id: string;
  x: number;
  y: number;
};

export type ArcadeGobMarketBouncer = {
  id: string;
  x: number;
  y: number;
  direction: ArcadeGobMarketDirection;
};

export type ArcadeGobMarketGameConfig = {
  mode: ArcadeGobMarketMode;
  tickMs: number;
  tokenTarget: number;
  bouncerCount: number;
  bouncerMoveEveryTicks: number;
};

export type ArcadeGobMarketState = {
  player: ArcadeGobMarketPoint;
  direction: ArcadeGobMarketDirection | null;
  tokens: ArcadeGobMarketToken[];
  bouncers: ArcadeGobMarketBouncer[];
  tokensCollected: number;
  lives: number;
  score: number;
  completed: boolean;
  tick: number;
};

const DIRECTION_DELTA: Record<ArcadeGobMarketDirection, ArcadeGobMarketPoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTION: Record<ArcadeGobMarketDirection, ArcadeGobMarketDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const BOUNCER_DIRECTIONS: ArcadeGobMarketDirection[] = ['up', 'down', 'left', 'right'];

/** Fully connected VIP-floor maze — every open cell is reachable from spawn. */
const GOB_MARKET_MAZE = [
  '###############',
  '#.............#',
  '#.#.###.###.#.#',
  '#...#...#...#.#',
  '###.#.#.#.#.#.#',
  '#...#.#.#.#...#',
  '#.###.#.#.###.#',
  '#.....#.#.....#',
  '#.#####.#####.#',
  '#.....#.#.....#',
  '#.###.#.#.###.#',
  '#...#.#.#.#...#',
  '#.#.###.###.#.#',
  '#.............#',
  '###############',
] as const;

const GOB_MARKET_SPAWN: ArcadeGobMarketPoint = { x: 1, y: 1 };

let gobMarketIdCounter = 0;

function nextGobMarketId(prefix: string): string {
  gobMarketIdCounter += 1;
  return prefix + '-' + gobMarketIdCounter;
}

export function resetArcadeGobMarketIdCounterForTests(): void {
  gobMarketIdCounter = 0;
}

export function arcadeGobMarketGameConfig(mode: ArcadeGobMarketMode): ArcadeGobMarketGameConfig {
  if (mode === 'hard') {
    return {
      mode,
      tickMs: 130,
      tokenTarget: 10,
      bouncerCount: 2,
      bouncerMoveEveryTicks: 2,
    };
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return {
      mode,
      tickMs: Math.max(80, Math.round(arcadeSkillDiffFasterSpawnInterval(120) / 2)),
      tokenTarget: arcadeSkillDiffDoubledSpawnCount(6),
      bouncerCount: 4,
      bouncerMoveEveryTicks: 1,
    };
  }

  return {
    mode,
    tickMs: 170,
    tokenTarget: 8,
    bouncerCount: 0,
    bouncerMoveEveryTicks: 2,
  };
}

export function arcadeGobMarketModeLabel(mode: ArcadeGobMarketMode): string {
  if (mode === 'hard') {
    return 'VIP Floor';
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return ARCADE_SKILL_DIFF_MODE_LABEL;
  }

  return 'Guest List';
}

export function isArcadeGobMarketWall(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= ARCADE_GOB_MARKET_GRID_SIZE || y >= ARCADE_GOB_MARKET_GRID_SIZE) {
    return true;
  }

  return GOB_MARKET_MAZE[y]?.[x] === '#';
}

const GOB_MARKET_DIRECTION_DELTAS: ArcadeGobMarketPoint[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

export function listArcadeGobMarketOpenCellsFrom(
  origin: ArcadeGobMarketPoint = GOB_MARKET_SPAWN,
): ArcadeGobMarketPoint[] {
  const visited = new Set<string>();
  const openCells: ArcadeGobMarketPoint[] = [];
  const queue: ArcadeGobMarketPoint[] = [{ ...origin }];

  while (queue.length > 0) {
    const point = queue.shift()!;

    if (isArcadeGobMarketWall(point.x, point.y)) {
      continue;
    }

    const key = point.x + ':' + point.y;

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);
    openCells.push(point);

    for (const delta of GOB_MARKET_DIRECTION_DELTAS) {
      queue.push({ x: point.x + delta.x, y: point.y + delta.y });
    }
  }

  return openCells;
}

export function countArcadeGobMarketOpenCells(): number {
  let count = 0;

  for (let y = 0; y < ARCADE_GOB_MARKET_GRID_SIZE; y += 1) {
    for (let x = 0; x < ARCADE_GOB_MARKET_GRID_SIZE; x += 1) {
      if (!isArcadeGobMarketWall(x, y)) {
        count += 1;
      }
    }
  }

  return count;
}

function pointsEqual(left: ArcadeGobMarketPoint, right: ArcadeGobMarketPoint): boolean {
  return left.x === right.x && left.y === right.y;
}

function isOccupied(
  point: ArcadeGobMarketPoint,
  player: ArcadeGobMarketPoint,
  tokens: ArcadeGobMarketToken[],
  bouncers: ArcadeGobMarketBouncer[],
): boolean {
  return (
    pointsEqual(point, player) ||
    tokens.some((token) => token.x === point.x && token.y === point.y) ||
    bouncers.some((bouncer) => bouncer.x === point.x && bouncer.y === point.y)
  );
}

export function listArcadeGobMarketOpenCells(
  player: ArcadeGobMarketPoint,
  tokens: ArcadeGobMarketToken[],
  bouncers: ArcadeGobMarketBouncer[],
): ArcadeGobMarketPoint[] {
  const openCells: ArcadeGobMarketPoint[] = [];

  for (let y = 0; y < ARCADE_GOB_MARKET_GRID_SIZE; y += 1) {
    for (let x = 0; x < ARCADE_GOB_MARKET_GRID_SIZE; x += 1) {
      const point = { x, y };

      if (!isArcadeGobMarketWall(x, y) && !isOccupied(point, player, tokens, bouncers)) {
        openCells.push(point);
      }
    }
  }

  return openCells;
}

export function spawnArcadeGobMarketTokens(
  count: number,
  player: ArcadeGobMarketPoint,
  bouncers: ArcadeGobMarketBouncer[],
  existing: ArcadeGobMarketToken[] = [],
): ArcadeGobMarketToken[] {
  const tokens = [...existing];
  const openCells = listArcadeGobMarketOpenCells(player, tokens, bouncers).filter(
    (point) => !pointsEqual(point, GOB_MARKET_SPAWN),
  );

  for (let index = 0; index < count && openCells.length > 0; index += 1) {
    const pickIndex = Math.floor(Math.random() * openCells.length);
    const point = openCells.splice(pickIndex, 1)[0]!;

    tokens.push({
      id: nextGobMarketId('token'),
      x: point.x,
      y: point.y,
    });
  }

  return tokens;
}

function spawnArcadeGobMarketBouncers(count: number): ArcadeGobMarketBouncer[] {
  const bouncers: ArcadeGobMarketBouncer[] = [];
  const openCells = listArcadeGobMarketOpenCells(GOB_MARKET_SPAWN, [], []).filter(
    (point) => !pointsEqual(point, GOB_MARKET_SPAWN),
  );

  for (let index = 0; index < count; index += 1) {
    const pickIndex = Math.floor(Math.random() * openCells.length);
    const point = openCells.splice(pickIndex, 1)[0];

    if (!point) {
      break;
    }

    bouncers.push({
      id: nextGobMarketId('bouncer'),
      x: point.x,
      y: point.y,
      direction: BOUNCER_DIRECTIONS[index % BOUNCER_DIRECTIONS.length] ?? 'left',
    });
  }

  return bouncers;
}

export function createArcadeGobMarketState(config: ArcadeGobMarketGameConfig): ArcadeGobMarketState {
  const bouncers = spawnArcadeGobMarketBouncers(config.bouncerCount);

  return {
    player: { ...GOB_MARKET_SPAWN },
    direction: null,
    tokens: spawnArcadeGobMarketTokens(config.tokenTarget, GOB_MARKET_SPAWN, bouncers),
    bouncers,
    tokensCollected: 0,
    lives: ARCADE_GOB_MARKET_STARTING_LIVES,
    score: 0,
    completed: false,
    tick: 0,
  };
}

export function readArcadeGobMarketDirectionFromKey(key: string): ArcadeGobMarketDirection | null {
  if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    return 'up';
  }

  if (key === 'ArrowDown' || key === 's' || key === 'S') {
    return 'down';
  }

  if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    return 'left';
  }

  if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    return 'right';
  }

  return null;
}

export function setArcadeGobMarketDirection(
  state: ArcadeGobMarketState,
  direction: ArcadeGobMarketDirection,
): ArcadeGobMarketState {
  if (state.completed || state.lives <= 0) {
    return state;
  }

  if (state.direction && OPPOSITE_DIRECTION[state.direction] === direction) {
    return state;
  }

  return {
    ...state,
    direction,
  };
}

function turnArcadeGobMarketBouncer(
  bouncer: ArcadeGobMarketBouncer,
  player: ArcadeGobMarketPoint,
  tokens: ArcadeGobMarketToken[],
  bouncers: ArcadeGobMarketBouncer[],
): ArcadeGobMarketBouncer {
  const delta = DIRECTION_DELTA[bouncer.direction];
  const nextPoint = { x: bouncer.x + delta.x, y: bouncer.y + delta.y };
  const blocked =
    isArcadeGobMarketWall(nextPoint.x, nextPoint.y) ||
    isOccupied(nextPoint, player, tokens, bouncers.filter((entry) => entry.id !== bouncer.id));

  if (!blocked) {
    return {
      ...bouncer,
      x: nextPoint.x,
      y: nextPoint.y,
    };
  }

  const options = BOUNCER_DIRECTIONS.map((direction) => {
    const optionDelta = DIRECTION_DELTA[direction];
    const candidate = { x: bouncer.x + optionDelta.x, y: bouncer.y + optionDelta.y };
    const candidateBlocked =
      isArcadeGobMarketWall(candidate.x, candidate.y) ||
      isOccupied(candidate, player, tokens, bouncers.filter((entry) => entry.id !== bouncer.id));

    return candidateBlocked ? null : direction;
  }).filter((direction): direction is ArcadeGobMarketDirection => direction !== null);

  const nextDirection = options[0] ?? bouncer.direction;
  const nextDelta = DIRECTION_DELTA[nextDirection];

  return {
    ...bouncer,
    direction: nextDirection,
    x: bouncer.x + nextDelta.x,
    y: bouncer.y + nextDelta.y,
  };
}

export function moveArcadeGobMarketBouncers(
  bouncers: ArcadeGobMarketBouncer[],
  player: ArcadeGobMarketPoint,
  tokens: ArcadeGobMarketToken[],
): ArcadeGobMarketBouncer[] {
  return bouncers.map((bouncer) => turnArcadeGobMarketBouncer(bouncer, player, tokens, bouncers));
}

function respawnArcadeGobMarketPlayer(state: ArcadeGobMarketState): ArcadeGobMarketState {
  return {
    ...state,
    player: { ...GOB_MARKET_SPAWN },
    direction: null,
  };
}

export function updateArcadeGobMarketState(
  state: ArcadeGobMarketState,
  config: ArcadeGobMarketGameConfig,
): ArcadeGobMarketState {
  if (state.completed || state.lives <= 0 || !state.direction) {
    return state;
  }

  const delta = DIRECTION_DELTA[state.direction];
  const nextPlayer = {
    x: state.player.x + delta.x,
    y: state.player.y + delta.y,
  };

  if (isArcadeGobMarketWall(nextPlayer.x, nextPlayer.y)) {
    return { ...state, direction: null, tick: state.tick + 1 };
  }

  let tokens = state.tokens;
  let tokensCollected = state.tokensCollected;
  let score = state.score;
  let lives = state.lives;
  let player = nextPlayer;
  let bouncers = state.bouncers;
  const nextTick = state.tick + 1;

  const tokenIndex = tokens.findIndex((token) => token.x === player.x && token.y === player.y);

  if (tokenIndex >= 0) {
    tokens = tokens.filter((_, index) => index !== tokenIndex);
    tokensCollected += 1;
    score += ARCADE_GOB_MARKET_TOKEN_SCORE;

    if (tokens.length === 0) {
      tokens = spawnArcadeGobMarketTokens(config.tokenTarget, player, bouncers);
    }
  }

  if (config.bouncerCount > 0 && nextTick % config.bouncerMoveEveryTicks === 0) {
    bouncers = moveArcadeGobMarketBouncers(bouncers, player, tokens);
  }

  if (bouncers.some((bouncer) => bouncer.x === player.x && bouncer.y === player.y)) {
    lives = Math.max(0, lives - 1);
    const respawned = respawnArcadeGobMarketPlayer({
      ...state,
      player,
      tokens,
      bouncers,
      tokensCollected,
      score,
      lives,
      tick: nextTick,
    });

    return {
      ...respawned,
      direction: null,
    };
  }

  return {
    ...state,
    player,
    tokens,
    bouncers,
    tokensCollected,
    score,
    lives,
    tick: nextTick,
  };
}

export function finalizeArcadeGobMarketRun(
  state: ArcadeGobMarketState,
  survived: boolean,
): ArcadeGobMarketState {
  if (state.completed) {
    return state;
  }

  const bonus = survived && state.score > 0 ? ARCADE_GOB_MARKET_SURVIVE_BONUS : 0;

  return {
    ...state,
    completed: true,
    score: state.score + bonus,
  };
}