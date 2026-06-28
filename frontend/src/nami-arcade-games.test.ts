import { describe, expect, it } from 'vitest';

import { ARCADE_ALLEY_PUSH_GAME_ID } from './arcade-alley-push-game.js';
import { resetArcadeAlleyPushGameStoreForTests } from './arcade-alley-push-game-store.js';
import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import { resetArcadeBubbleGameStoreForTests } from './arcade-bubble-game-store.js';
import { readOfficialNamiArcadeGames } from './nami-arcade-games.js';

describe('nami-arcade-games', () => {
  it('lists the live tier 1 arcade cabinets', () => {
    resetArcadeBubbleGameStoreForTests();
    resetArcadeAlleyPushGameStoreForTests();
    const games = readOfficialNamiArcadeGames();

    expect(games).toHaveLength(2);
    expect(games[0]?.id).toBe(ARCADE_BUBBLE_GAME_ID);
    expect(games[0]?.cabinetId).toBe('goon-pop');
    expect(games[0]?.status).toBe('live');
    expect(games[0]?.title).toBe('Goon Pop');
    expect(games[1]?.id).toBe(ARCADE_ALLEY_PUSH_GAME_ID);
    expect(games[1]?.cabinetId).toBe('alley-push');
    expect(games[1]?.status).toBe('live');
    expect(games[1]?.title).toBe('Alley Push');
  });
});