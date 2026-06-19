import { prefersReducedMotion } from './perf-utils.js';

const SPOTLIGHT_PATH = [
  { x: 20, y: 18 },
  { x: 76, y: 22 },
  { x: 68, y: 70 },
  { x: 24, y: 74 },
] as const;

const SPOTLIGHT_DURATION_MS = 36000;

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function interpolateSpotlight(progress: number): { x: number; y: number } {
  const normalized = ((progress % 1) + 1) % 1;
  const scaled = normalized * SPOTLIGHT_PATH.length;
  const segmentIndex = Math.floor(scaled) % SPOTLIGHT_PATH.length;
  const segmentProgress = scaled - Math.floor(scaled);
  const eased = easeInOutCubic(segmentProgress);
  const from = SPOTLIGHT_PATH[segmentIndex] ?? SPOTLIGHT_PATH[0];
  const to = SPOTLIGHT_PATH[(segmentIndex + 1) % SPOTLIGHT_PATH.length] ?? SPOTLIGHT_PATH[0];

  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
  };
}

export function applySpotlightPosition(x: number, y: number): void {
  document.documentElement.style.setProperty('--nami-spotlight-x', String(x) + '%');
  document.documentElement.style.setProperty('--nami-spotlight-y', String(y) + '%');
}

export function clearSpotlightPosition(): void {
  document.documentElement.style.removeProperty('--nami-spotlight-x');
  document.documentElement.style.removeProperty('--nami-spotlight-y');
}

export function startSpotlightMotion(isPaused: () => boolean): () => void {
  if (prefersReducedMotion()) {
    applySpotlightPosition(50, 40);
    return () => clearSpotlightPosition();
  }

  const startedAt = performance.now();
  let frameId: number | null = null;

  function frame(now: number): void {
    if (!isPaused()) {
      const position = interpolateSpotlight((now - startedAt) / SPOTLIGHT_DURATION_MS);
      applySpotlightPosition(position.x, position.y);
    }

    frameId = window.requestAnimationFrame(frame);
  }

  frameId = window.requestAnimationFrame(frame);

  return () => {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
    }

    clearSpotlightPosition();
  };
}