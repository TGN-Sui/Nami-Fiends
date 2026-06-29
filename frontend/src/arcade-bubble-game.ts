export const ARCADE_BUBBLE_GAME_ID = 'nami-bubble-pop';

import {
  arcadeSkillDiffDoubledSpawnCount,
  arcadeSkillDiffFasterSpawnInterval,
  arcadeSkillDiffScaledSpeed,
  ARCADE_SKILL_DIFF_MODE,
  ARCADE_SKILL_DIFF_MODE_LABEL,
} from './arcade-skill-diff.js';

export type ArcadeBubbleMode = 'normal' | 'hard' | typeof ARCADE_SKILL_DIFF_MODE;

export const ARCADE_BUBBLE_GAME_DURATION_MS = 60_000;
export const ARCADE_BUBBLE_LEADERBOARD_SIZE = 10;

export const ARCADE_BUBBLE_POP_ANIMATION_MS = 320;
export const ARCADE_BUBBLE_POP_CLICK_HIT_MS = 180;
export const ARCADE_BUBBLE_CURSOR_RADIUS = 140;

export type ArcadeBubbleSize = 'small' | 'big';

export type ArcadeBubbleGameConfig = {
  mode: ArcadeBubbleMode;
  smallClicksRequired: number;
  bigClicksRequired: number;
  smallPoints: number;
  bigPoints: number;
  riseSpeedMin: number;
  riseSpeedMax: number;
  lifetimeMinMs: number;
  lifetimeMaxMs: number;
  maxBubbles: number;
  spawnIntervalMs: number;
  spawnsPerTick: number;
};

export type ArcadeBubbleEntity = {
  id: string;
  size: ArcadeBubbleSize;
  label: string;
  points: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  scale: number;
  riseSpeed: number;
  opacity: number;
  bornAt: number;
  lifetimeMs: number;
  popClicks: number;
  popClicksRequired: number;
  poppedAt: number | null;
  lastClickAt: number;
};

export const GOON_POP_BUBBLE_LABELS = [
  'G',
  'CREW',
  'HEAT',
  'GHOST',
  'GLOW',
  'COIN',
  'DRIFT',
  'RISE',
] as const;

export function arcadeBubbleGameConfig(mode: ArcadeBubbleMode): ArcadeBubbleGameConfig {
  if (mode === 'hard') {
    return {
      mode,
      smallClicksRequired: 2,
      bigClicksRequired: 4,
      smallPoints: 1,
      bigPoints: 2,
      riseSpeedMin: 1.1,
      riseSpeedMax: 2.35,
      lifetimeMinMs: 5_500,
      lifetimeMaxMs: 12_500,
      maxBubbles: 16,
      spawnIntervalMs: 1_700,
      spawnsPerTick: 1,
    };
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return {
      mode,
      smallClicksRequired: 1,
      bigClicksRequired: 3,
      smallPoints: 1,
      bigPoints: 2,
      riseSpeedMin: arcadeSkillDiffScaledSpeed(0.55),
      riseSpeedMax: arcadeSkillDiffScaledSpeed(1.9),
      lifetimeMinMs: 5_500,
      lifetimeMaxMs: 12_000,
      maxBubbles: 22,
      spawnIntervalMs: arcadeSkillDiffFasterSpawnInterval(2_000),
      spawnsPerTick: arcadeSkillDiffDoubledSpawnCount(1),
    };
  }

  return {
    mode,
    smallClicksRequired: 1,
    bigClicksRequired: 3,
    smallPoints: 1,
    bigPoints: 2,
    riseSpeedMin: 0.55,
    riseSpeedMax: 1.9,
    lifetimeMinMs: 7_500,
    lifetimeMaxMs: 16_500,
    maxBubbles: 14,
    spawnIntervalMs: 2_000,
    spawnsPerTick: 1,
  };
}

export function arcadeBubbleModeLabel(mode: ArcadeBubbleMode): string {
  if (mode === 'hard') {
    return 'Heat Run';
  }

  if (mode === ARCADE_SKILL_DIFF_MODE) {
    return ARCADE_SKILL_DIFF_MODE_LABEL;
  }

  return 'Alley Run';
}

export { formatArcadeG, formatArcadeG as formatGoonPopG } from './arcade-score.js';

function randomBubbleLabel(): string {
  return GOON_POP_BUBBLE_LABELS[Math.floor(Math.random() * GOON_POP_BUBBLE_LABELS.length)]!;
}

function randomLifetimeMs(config: ArcadeBubbleGameConfig): number {
  const spread = config.lifetimeMaxMs - config.lifetimeMinMs;

  return config.lifetimeMinMs + Math.floor(Math.random() * spread);
}

function bubbleSizeFromRoll(roll: number): ArcadeBubbleSize {
  return roll < 0.38 ? 'big' : 'small';
}

function bubbleScaleForSize(size: ArcadeBubbleSize): number {
  if (size === 'big') {
    return 1.55 + Math.random() * 0.3;
  }

  return 1.22 + Math.random() * 0.24;
}

function bubbleRadiusForScale(scale: number): number {
  return (24 + Math.random() * 6) * scale;
}

export function spawnArcadeBubble(
  width: number,
  height: number,
  now: number,
  config: ArcadeBubbleGameConfig,
): ArcadeBubbleEntity {
  const size = bubbleSizeFromRoll(Math.random());
  const scale = bubbleScaleForSize(size);
  const radius = bubbleRadiusForScale(scale);
  const spawnLeft = Math.random() < 0.5;
  const sidePadding = width * 0.08;
  const sideWidth = width * 0.34;
  const riseSpeed = config.riseSpeedMin + Math.random() * (config.riseSpeedMax - config.riseSpeedMin);
  const x = spawnLeft
    ? sidePadding + Math.random() * sideWidth
    : width - sidePadding - Math.random() * sideWidth;

  return {
    id: 'arcade-bubble-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    size,
    points: size === 'big' ? config.bigPoints : config.smallPoints,
    x,
    y: height + radius + 10,
    vx: (Math.random() - 0.5) * 0.42,
    vy: -riseSpeed - Math.random() * 0.45,
    radius,
    scale,
    riseSpeed,
    opacity: 0,
    bornAt: now,
    lifetimeMs: randomLifetimeMs(config),
    popClicks: 0,
    popClicksRequired: size === 'big' ? config.bigClicksRequired : config.smallClicksRequired,
    poppedAt: null,
    lastClickAt: 0,
    label: randomBubbleLabel(),
  };
}

export function arcadeBubbleLifeProgress(bubble: ArcadeBubbleEntity, now: number): number {
  return (now - bubble.bornAt) / bubble.lifetimeMs;
}

export function arcadeBubbleIdSignature(bubbles: ArcadeBubbleEntity[]): string {
  return bubbles.map((bubble) => bubble.id).join('|');
}