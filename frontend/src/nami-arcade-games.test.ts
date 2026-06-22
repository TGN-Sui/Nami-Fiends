import { describe, expect, it } from 'vitest';

import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import { resetArcadeBubbleGameStoreForTests } from './arcade-bubble-game-store.js';
import { readOfficialNamiArcadeGames } from './nami-arcade-games.js';

describe('nami-arcade-games', () => {
  it('lists the live Nami Bubble Pop cabinet', () => {
    resetArcadeBubbleGameStoreForTests();
    const games = readOfficialNamiArcadeGames();

    expect(games).toHaveLength(1);
    expect(games[0]?.id).toBe(ARCADE_BUBBLE_GAME_ID);
    expect(games[0]?.status).toBe('live');
    expect(games[0]?.title).toBe('Nami Bubble Pop');
  });
});