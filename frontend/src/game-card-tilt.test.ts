import { describe, expect, it } from 'vitest';

import { computeGameCardTiltStyle, GAME_CARD_TILT_IDLE_STYLE } from './game-card-tilt.js';

describe('game-card-tilt', () => {
  it('returns idle foil opacity at rest', () => {
    expect(GAME_CARD_TILT_IDLE_STYLE['--game-card-foil-opacity']).toBe('0');
    expect(GAME_CARD_TILT_IDLE_STYLE['--game-card-tilt-x']).toBe('0deg');
  });

  it('computes tilt and foil from pointer position', () => {
    const element = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 200,
        height: 280,
        right: 200,
        bottom: 280,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    } as HTMLElement;

    const style = computeGameCardTiltStyle(element, 150, 70);

    expect(style['--game-card-tilt-x']).toBe('3.00deg');
    expect(style['--game-card-tilt-y']).toBe('2.50deg');
    expect(style['--game-card-foil-x']).toBe('75.00%');
    expect(style['--game-card-foil-y']).toBe('25.00%');
    expect(style['--game-card-foil-opacity']).toBe('1');
  });
});