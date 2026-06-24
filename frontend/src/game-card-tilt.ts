import { useCallback, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

export const GAME_CARD_TILT_IDLE_STYLE = {
  '--game-card-tilt-x': '0deg',
  '--game-card-tilt-y': '0deg',
  '--game-card-foil-x': '50%',
  '--game-card-foil-y': '50%',
  '--game-card-foil-opacity': '0',
} as CSSProperties;

export function computeGameCardTiltStyle(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): CSSProperties {
  const rect = element.getBoundingClientRect();
  const pointerX = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  const pointerY = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);

  return {
    '--game-card-tilt-x': ((pointerX - 0.5) * 12).toFixed(2) + 'deg',
    '--game-card-tilt-y': ((0.5 - pointerY) * 10).toFixed(2) + 'deg',
    '--game-card-foil-x': (pointerX * 100).toFixed(2) + '%',
    '--game-card-foil-y': (pointerY * 100).toFixed(2) + '%',
    '--game-card-foil-opacity': '1',
  } as CSSProperties;
}

export function useGameCardTilt(): {
  isTilting: boolean;
  tiltClassName: string;
  tiltStyle: CSSProperties;
  resetTilt: () => void;
  tiltHandlers: {
    onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => void;
  };
} {
  const [tiltStyle, setTiltStyle] = useState<CSSProperties>(GAME_CARD_TILT_IDLE_STYLE);
  const [isTilting, setIsTilting] = useState(false);

  const resetTilt = useCallback(() => {
    setIsTilting(false);
    setTiltStyle(GAME_CARD_TILT_IDLE_STYLE);
  }, []);

  const onPointerEnter = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    setIsTilting(true);
    setTiltStyle(computeGameCardTiltStyle(event.currentTarget, event.clientX, event.clientY));
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    setIsTilting(true);
    setTiltStyle(computeGameCardTiltStyle(event.currentTarget, event.clientX, event.clientY));
  }, []);

  const onPointerLeave = useCallback(() => {
    resetTilt();
  }, [resetTilt]);

  return {
    isTilting,
    tiltClassName: isTilting ? 'is-game-card-tilting' : '',
    tiltStyle,
    resetTilt,
    tiltHandlers: {
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
    },
  };
}

/** @deprecated Use useGameCardTilt — direct DOM writes are cleared by React re-renders. */
export function updateGameCardTilt(element: HTMLElement, clientX: number, clientY: number): void {
  const style = computeGameCardTiltStyle(element, clientX, clientY);

  for (const [key, value] of Object.entries(style)) {
    if (typeof value === 'string') {
      element.style.setProperty(key, value);
    }
  }
}

/** @deprecated Use useGameCardTilt */
export function resetGameCardTilt(element: HTMLElement): void {
  for (const [key, value] of Object.entries(GAME_CARD_TILT_IDLE_STYLE)) {
    if (typeof value === 'string') {
      element.style.setProperty(key, value);
    }
  }
}