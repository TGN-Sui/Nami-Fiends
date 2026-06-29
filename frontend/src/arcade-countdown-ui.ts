import type { CSSProperties } from 'react';

export const ARCADE_COUNTDOWN_WARNING_MS = 10_000;

export function arcadeCountdownWarningScale(remainingMs: number): number {
  if (remainingMs > ARCADE_COUNTDOWN_WARNING_MS) {
    return 1;
  }

  const urgency = (ARCADE_COUNTDOWN_WARNING_MS - remainingMs) / ARCADE_COUNTDOWN_WARNING_MS;

  return 1.08 + urgency * 0.48;
}

export function arcadeCountdownWarningStyle(remainingMs: number): CSSProperties | undefined {
  if (remainingMs > ARCADE_COUNTDOWN_WARNING_MS) {
    return undefined;
  }

  return {
    '--arcade-time-warning-scale': arcadeCountdownWarningScale(remainingMs),
  } as CSSProperties;
}

export function isArcadeCountdownWarning(remainingMs: number): boolean {
  return remainingMs <= ARCADE_COUNTDOWN_WARNING_MS && remainingMs > 0;
}