import { describe, expect, it } from 'vitest';

import { ARCADE_ALLEY_PUSH_GAME_ID } from './arcade-alley-push-game.js';
import { resetArcadeAlleyPushGameStoreForTests } from './arcade-alley-push-game-store.js';
import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import { resetArcadeBubbleGameStoreForTests } from './arcade-bubble-game-store.js';
import {
  memberMeetsCabinetMembership,
  OFFICIAL_ARCADE_CABINETS,
  readArcadeCabinetsForMember,
  resolveArcadeCabinetAccess,
} from './arcade-cabinets.js';
import type { NamiMember } from './uiMockData.js';

function memberWithTier(tier: NamiMember['tier']): NamiMember {
  return {
    id: 'm-test',
    surfaceType: 'member',
    name: 'Tester',
    avatarSeed: 'T',
    signal: 'Green',
    tier,
    badge: 'Tester',
  };
}

describe('arcade-cabinets', () => {
  it('lists all planned goonie cabinets', () => {
    expect(OFFICIAL_ARCADE_CABINETS).toHaveLength(8);
    expect(OFFICIAL_ARCADE_CABINETS[0]?.id).toBe('goon-pop');
    expect(OFFICIAL_ARCADE_CABINETS[0]?.gameId).toBe(ARCADE_BUBBLE_GAME_ID);
  });

  it('locks higher tier cabinets for lower membership tiers', () => {
    resetArcadeBubbleGameStoreForTests();
    resetArcadeAlleyPushGameStoreForTests();

    const adventurerCabinets = readArcadeCabinetsForMember(memberWithTier('Adventurer'));
    const goonPop = adventurerCabinets.find((cabinet) => cabinet.id === 'goon-pop');
    const alleyPush = adventurerCabinets.find((cabinet) => cabinet.id === 'alley-push');
    const squidMarket = adventurerCabinets.find((cabinet) => cabinet.id === 'squid-market');

    expect(goonPop?.access).toBe('live');
    expect(alleyPush?.access).toBe('live');
    expect(alleyPush?.gameId).toBe(ARCADE_ALLEY_PUSH_GAME_ID);
    expect(squidMarket?.access).toBe('locked');

    const eliteCabinets = readArcadeCabinetsForMember(memberWithTier('Elite'));
    const eliteSquid = eliteCabinets.find((cabinet) => cabinet.id === 'squid-market');

    expect(eliteSquid?.access).toBe('offline');
  });

  it('evaluates membership requirements', () => {
    expect(memberMeetsCabinetMembership('NPC', 'Adventurer')).toBe(false);
    expect(memberMeetsCabinetMembership('Pro', 'Pro')).toBe(true);
    expect(resolveArcadeCabinetAccess(OFFICIAL_ARCADE_CABINETS[0]!, 'Adventurer')).toBe('live');
  });
});