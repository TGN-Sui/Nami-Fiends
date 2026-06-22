import { describe, expect, it } from 'vitest';

import { readOfficialNamiArcadeGames } from './nami-arcade-games.js';

describe('nami-arcade-games', () => {
  it('lists official Nami Arcade cabinets', () => {
    const games = readOfficialNamiArcadeGames();

    expect(games.length).toBeGreaterThanOrEqual(5);
    expect(games.every((game) => game.title.length > 0)).toBe(true);
    expect(games.some((game) => game.status === 'live')).toBe(true);
  });
});