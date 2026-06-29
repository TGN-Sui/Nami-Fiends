export const ARCADE_STEALTH_GOON_GAME_ID = 'nami-stealth-goon';

export const ARCADE_STEALTH_GOON_GRID_SIZE = 18;
export const ARCADE_STEALTH_GOON_GAME_DURATION_MS = 60_000;
export const ARCADE_STEALTH_GOON_LEADERBOARD_SIZE = 10;
export const ARCADE_STEALTH_GOON_LINK_SCORE = 2;
export const ARCADE_STEALTH_GOON_SURVIVE_BONUS = 8;
export const ARCADE_STEALTH_GOON_STARTING_LENGTH = 3;

import {
  arcadeSkillDiffFasterSpawnInterval,
  arcadeSkillDiffScaledSpeed,
  ARCADE_SKILL_DIFF_MODE,
  ARCADE_SKILL_DIFF_MODE_LABEL,
} from './arcade-skill-diff.js';

export type ArcadeStealthGoonMode = 'normal' | 'hard' | typeof ARCADE_SKILL_DIFF_MODE;
export type ArcadeStealthGoonDirection = 'up' | 'down' | 'left' | 'right';

export type ArcadeStealthGoonPoint = {
  x: number;
  y: number;
};

export type ArcadeStealthGoonHeatAgent = {
  id: string;
  x: number;
  y: number;
  direction: ArcadeStealthGoonDirection;
};

export type ArcadeStealthGoonGameConfig = {
  mode: ArcadeStealthGoonMode;
  tickMs: number;
  heatAgentCount: number;
  heatMoveEveryTicks: number;
};

export type ArcadeStealthGoonState = {
  snake: ArcadeStealthGoonPoint[];
  direction: ArcadeStealthGoonDirection;
  queuedDirection: ArcadeStealthGoonDirection | null;
  link: ArcadeStealthGoonPoint | null;
  heatAgents: ArcadeStealthGoonHeatAgent[];
  linksCollected: number;
  score: number;
  dead: boolean;
  completed: boolean;
  tick: number;
};

const DIRECTION_DELTA: Record<ArcadeStealthGoonDirection, ArcadeStealthGoonPoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTION: Record<ArcadeStealthGoonDirection, ArcadeStealthGoonDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const HEAT_DIRECTIONS: ArcadeStealthGoonDirection[] = ['up', 'down', 'left', 'right'];

let stealthGoonIdCounter = 0;

function nextStealthGoonId(prefix: string): string {
  stealthGoonIdCounter += 1;
  return prefix + '-' + stealthGoonIdCounter;
}

export function resetArcadeStealthGoonIdCounterForTests(): void {
  stealthGoonIdCounter = 0;
}

export function arcadeStealthGoonGameConfig(mode: ArcadeStealthGoonMode): ArcadeStealthGoonGameConfig {
  if (mode === 'hard') {
    return {
      mode,
      tickMs: 120,
      heatAgentCount: 2,
      heatMoveEveryTicks: 2,
    };
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return {
      mode,
      tickMs: Math.max(70, Math.round(arcadeSkillDiffFasterSpawnInterval(110) / 2)),
      heatAgentCount: 4,
      heatMoveEveryTicks: 1,
    };
  }

  return {
    mode,
    tickMs: 180,
    heatAgentCount: 0,
    heatMoveEveryTicks: 2,
  };
}

export function arcadeStealthGoonModeLabel(mode: ArcadeStealthGoonMode): string {
  if (mode === 'hard') {
    return 'Heat Patrol';
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return ARCADE_SKILL_DIFF_MODE_LABEL;
  }

  return 'Low Profile';
}

export function readArcadeStealthGoonDirectionFromKey(key: string): ArcadeStealthGoonDirection | null {
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

export function resolveArcadeStealthGoonDirection(
  current: ArcadeStealthGoonDirection,
  next: ArcadeStealthGoonDirection,
): ArcadeStealthGoonDirection {
  if (OPPOSITE_DIRECTION[current] === next) {
    return current;
  }

  return next;
}

function pointsEqual(left: ArcadeStealthGoonPoint, right: ArcadeStealthGoonPoint): boolean {
  return left.x === right.x && left.y === right.y;
}

function isOccupied(
  point: ArcadeStealthGoonPoint,
  snake: ArcadeStealthGoonPoint[],
  heatAgents: ArcadeStealthGoonHeatAgent[],
): boolean {
  return (
    snake.some((segment) => pointsEqual(segment, point)) ||
    heatAgents.some((agent) => agent.x === point.x && agent.y === point.y)
  );
}

export function spawnArcadeStealthGoonLink(
  snake: ArcadeStealthGoonPoint[],
  heatAgents: ArcadeStealthGoonHeatAgent[],
): ArcadeStealthGoonPoint | null {
  const openCells: ArcadeStealthGoonPoint[] = [];

  for (let y = 0; y < ARCADE_STEALTH_GOON_GRID_SIZE; y += 1) {
    for (let x = 0; x < ARCADE_STEALTH_GOON_GRID_SIZE; x += 1) {
      const point = { x, y };

      if (!isOccupied(point, snake, heatAgents)) {
        openCells.push(point);
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  return openCells[Math.floor(Math.random() * openCells.length)] ?? null;
}

function createInitialSnake(): ArcadeStealthGoonPoint[] {
  const center = Math.floor(ARCADE_STEALTH_GOON_GRID_SIZE / 2);

  return [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ];
}

function spawnArcadeStealthGoonHeatAgents(count: number): ArcadeStealthGoonHeatAgent[] {
  const snake = createInitialSnake();
  const agents: ArcadeStealthGoonHeatAgent[] = [];

  for (let index = 0; index < count; index += 1) {
    const point = spawnArcadeStealthGoonLink(snake, agents);

    if (!point) {
      break;
    }

    agents.push({
      id: nextStealthGoonId('heat'),
      x: point.x,
      y: point.y,
      direction: HEAT_DIRECTIONS[index % HEAT_DIRECTIONS.length] ?? 'up',
    });
  }

  return agents;
}

export function createArcadeStealthGoonState(config: ArcadeStealthGoonGameConfig): ArcadeStealthGoonState {
  const snake = createInitialSnake();
  const heatAgents = spawnArcadeStealthGoonHeatAgents(config.heatAgentCount);

  return {
    snake,
    direction: 'right',
    queuedDirection: null,
    link: spawnArcadeStealthGoonLink(snake, heatAgents),
    heatAgents,
    linksCollected: 0,
    score: 0,
    dead: false,
    completed: false,
    tick: 0,
  };
}

function turnHeatAgent(
  agent: ArcadeStealthGoonHeatAgent,
  snake: ArcadeStealthGoonPoint[],
  heatAgents: ArcadeStealthGoonHeatAgent[],
): ArcadeStealthGoonHeatAgent {
  const delta = DIRECTION_DELTA[agent.direction];
  const nextPoint = { x: agent.x + delta.x, y: agent.y + delta.y };
  const blocked =
    nextPoint.x < 0 ||
    nextPoint.y < 0 ||
    nextPoint.x >= ARCADE_STEALTH_GOON_GRID_SIZE ||
    nextPoint.y >= ARCADE_STEALTH_GOON_GRID_SIZE ||
    isOccupied(nextPoint, snake, heatAgents.filter((entry) => entry.id !== agent.id));

  if (!blocked) {
    return {
      ...agent,
      x: nextPoint.x,
      y: nextPoint.y,
    };
  }

  const options = HEAT_DIRECTIONS.map((direction) => {
    const optionDelta = DIRECTION_DELTA[direction];
    const candidate = { x: agent.x + optionDelta.x, y: agent.y + optionDelta.y };
    const candidateBlocked =
      candidate.x < 0 ||
      candidate.y < 0 ||
      candidate.x >= ARCADE_STEALTH_GOON_GRID_SIZE ||
      candidate.y >= ARCADE_STEALTH_GOON_GRID_SIZE ||
      isOccupied(candidate, snake, heatAgents.filter((entry) => entry.id !== agent.id));

    return candidateBlocked ? null : direction;
  }).filter((direction): direction is ArcadeStealthGoonDirection => direction !== null);

  const nextDirection = options[0] ?? agent.direction;
  const nextDelta = DIRECTION_DELTA[nextDirection];

  return {
    ...agent,
    direction: nextDirection,
    x: agent.x + nextDelta.x,
    y: agent.y + nextDelta.y,
  };
}

export function moveArcadeStealthGoonHeatAgents(
  heatAgents: ArcadeStealthGoonHeatAgent[],
  snake: ArcadeStealthGoonPoint[],
  config: ArcadeStealthGoonGameConfig,
): ArcadeStealthGoonHeatAgent[] {
  if (heatAgents.length === 0) {
    return heatAgents;
  }

  const speedScale = config.mode === ARCADE_SKILL_DIFF_MODE ? arcadeSkillDiffScaledSpeed(1) : 1;
  const steps = Math.max(1, Math.round(speedScale));

  let nextAgents = heatAgents;

  for (let step = 0; step < steps; step += 1) {
    nextAgents = nextAgents.map((agent) => turnHeatAgent(agent, snake, nextAgents));
  }

  return nextAgents;
}

export function queueArcadeStealthGoonDirection(
  state: ArcadeStealthGoonState,
  direction: ArcadeStealthGoonDirection,
): ArcadeStealthGoonState {
  if (state.dead || state.completed) {
    return state;
  }

  const baseDirection = state.queuedDirection ?? state.direction;
  const nextDirection = resolveArcadeStealthGoonDirection(baseDirection, direction);

  if (nextDirection === baseDirection) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection,
  };
}

export function updateArcadeStealthGoonState(
  state: ArcadeStealthGoonState,
  config: ArcadeStealthGoonGameConfig,
): ArcadeStealthGoonState {
  if (state.dead || state.completed) {
    return state;
  }

  const direction = state.queuedDirection ?? state.direction;
  const head = state.snake[0];

  if (!head) {
    return { ...state, dead: true };
  }

  const delta = DIRECTION_DELTA[direction];
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y };

  if (
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= ARCADE_STEALTH_GOON_GRID_SIZE ||
    nextHead.y >= ARCADE_STEALTH_GOON_GRID_SIZE
  ) {
    return { ...state, direction, queuedDirection: null, dead: true, tick: state.tick + 1 };
  }

  if (state.snake.some((segment) => pointsEqual(segment, nextHead))) {
    return { ...state, direction, queuedDirection: null, dead: true, tick: state.tick + 1 };
  }

  if (state.heatAgents.some((agent) => agent.x === nextHead.x && agent.y === nextHead.y)) {
    return { ...state, direction, queuedDirection: null, dead: true, tick: state.tick + 1 };
  }

  const ateLink = state.link !== null && pointsEqual(state.link, nextHead);
  const nextSnake = [nextHead, ...state.snake];

  if (!ateLink) {
    nextSnake.pop();
  }

  let linksCollected = state.linksCollected;
  let score = state.score;
  let link = state.link;

  if (ateLink) {
    linksCollected += 1;
    score += ARCADE_STEALTH_GOON_LINK_SCORE;
    link = spawnArcadeStealthGoonLink(nextSnake, state.heatAgents);
  }

  let heatAgents = state.heatAgents;
  const nextTick = state.tick + 1;

  if (config.heatAgentCount > 0 && nextTick % config.heatMoveEveryTicks === 0) {
    heatAgents = moveArcadeStealthGoonHeatAgents(heatAgents, nextSnake, config);

    if (heatAgents.some((agent) => agent.x === nextHead.x && agent.y === nextHead.y)) {
      return {
        ...state,
        snake: nextSnake,
        direction,
        queuedDirection: null,
        link,
        heatAgents,
        linksCollected,
        score,
        dead: true,
        tick: nextTick,
      };
    }
  }

  return {
    ...state,
    snake: nextSnake,
    direction,
    queuedDirection: null,
    link,
    heatAgents,
    linksCollected,
    score,
    tick: nextTick,
  };
}

export function finalizeArcadeStealthGoonRun(
  state: ArcadeStealthGoonState,
  survived: boolean,
): ArcadeStealthGoonState {
  if (state.completed) {
    return state;
  }

  const bonus = survived && state.score > 0 ? ARCADE_STEALTH_GOON_SURVIVE_BONUS : 0;

  return {
    ...state,
    completed: true,
    score: state.score + bonus,
  };
}