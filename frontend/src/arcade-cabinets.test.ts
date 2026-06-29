import { describe, expect, it } from 'vitest';

import { ARCADE_ALLEY_PUSH_GAME_ID } from './arcade-alley-push-game.js';
import { resetArcadeAlleyPushGameStoreForTests } from './arcade-alley-push-game-store.js';
import { ARCADE_BRICKED_UP_GAME_ID } from './arcade-bricked-up-game.js';
import { resetArcadeBrickedUpGameStoreForTests } from './arcade-bricked-up-game-store.js';
import { ARCADE_GOB_MARKET_GAME_ID } from './arcade-gob-market-game.js';
import { resetArcadeGobMarketGameStoreForTests } from './arcade-gob-market-game-store.js';
import { ARCADE_INTEL_STACK_GAME_ID } from './arcade-intel-stack-game.js';
import { resetArcadeIntelStackGameStoreForTests } from './arcade-intel-stack-game-store.js';
import { ARCADE_STEALTH_GOON_GAME_ID } from './arcade-stealth-goon-game.js';
import { resetArcadeStealthGoonGameStoreForTests } from './arcade-stealth-goon-game-store.js';
import { ARCADE_DROP_WINDOW_GAME_ID } from './arcade-drop-window-game.js';
import { resetArcadeDropWindowGameStoreForTests } from './arcade-drop-window-game-store.js';
import { ARCADE_STASH_DEFENSE_GAME_ID } from './arcade-stash-defense-game.js';
import { resetArcadeStashDefenseGameStoreForTests } from './arcade-stash-defense-game-store.js';
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
    resetArcadeStashDefenseGameStoreForTests();
    resetArcadeDropWindowGameStoreForTests();
    resetArcadeBrickedUpGameStoreForTests();
    resetArcadeStealthGoonGameStoreForTests();
    resetArcadeGobMarketGameStoreForTests();
    resetArcadeIntelStackGameStoreForTests();

    const adventurerCabinets = readArcadeCabinetsForMember(memberWithTier('Adventurer'));
    const goonPop = adventurerCabinets.find((cabinet) => cabinet.id === 'goon-pop');
    const alleyPush = adventurerCabinets.find((cabinet) => cabinet.id === 'alley-push');
    const stashDefense = adventurerCabinets.find((cabinet) => cabinet.id === 'stash-defense');
    const dropWindow = adventurerCabinets.find((cabinet) => cabinet.id === 'drop-window');
    const hawkeyeGallery = adventurerCabinets.find((cabinet) => cabinet.id === 'hawkeye-gallery');
    const stealthGoon = adventurerCabinets.find((cabinet) => cabinet.id === 'stealth-goon');
    const squidMarket = adventurerCabinets.find((cabinet) => cabinet.id === 'squid-market');
    const intelStack = adventurerCabinets.find((cabinet) => cabinet.id === 'intel-stack');

    expect(goonPop?.access).toBe('live');
    expect(alleyPush?.access).toBe('live');
    expect(alleyPush?.gameId).toBe(ARCADE_ALLEY_PUSH_GAME_ID);
    expect(stashDefense?.access).toBe('locked');
    expect(stashDefense?.gameId).toBe(ARCADE_STASH_DEFENSE_GAME_ID);
    expect(dropWindow?.access).toBe('locked');
    expect(dropWindow?.gameId).toBe(ARCADE_DROP_WINDOW_GAME_ID);
    expect(hawkeyeGallery?.access).toBe('locked');
    expect(hawkeyeGallery?.gameId).toBe(ARCADE_BRICKED_UP_GAME_ID);
    expect(stealthGoon?.access).toBe('locked');
    expect(stealthGoon?.gameId).toBe(ARCADE_STEALTH_GOON_GAME_ID);

    const proCabinets = readArcadeCabinetsForMember(memberWithTier('Pro'));
    const proStash = proCabinets.find((cabinet) => cabinet.id === 'stash-defense');
    const proDropWindow = proCabinets.find((cabinet) => cabinet.id === 'drop-window');
    const proBrickedUp = proCabinets.find((cabinet) => cabinet.id === 'hawkeye-gallery');
    const proStealthGoon = proCabinets.find((cabinet) => cabinet.id === 'stealth-goon');

    expect(proStash?.access).toBe('live');
    expect(proDropWindow?.access).toBe('live');
    expect(proBrickedUp?.access).toBe('live');
    expect(proBrickedUp?.gameId).toBe(ARCADE_BRICKED_UP_GAME_ID);
    expect(proStealthGoon?.access).toBe('live');
    expect(proStealthGoon?.gameId).toBe(ARCADE_STEALTH_GOON_GAME_ID);
    expect(squidMarket?.access).toBe('locked');
    expect(squidMarket?.gameId).toBe(ARCADE_GOB_MARKET_GAME_ID);
    expect(intelStack?.access).toBe('locked');
    expect(intelStack?.gameId).toBe(ARCADE_INTEL_STACK_GAME_ID);

    const eliteCabinets = readArcadeCabinetsForMember(memberWithTier('Elite'));
    const eliteSquid = eliteCabinets.find((cabinet) => cabinet.id === 'squid-market');
    const eliteIntel = eliteCabinets.find((cabinet) => cabinet.id === 'intel-stack');

    expect(eliteSquid?.access).toBe('live');
    expect(eliteSquid?.gameId).toBe(ARCADE_GOB_MARKET_GAME_ID);
    expect(eliteIntel?.access).toBe('live');
    expect(eliteIntel?.gameId).toBe(ARCADE_INTEL_STACK_GAME_ID);
  });

  it('evaluates membership requirements', () => {
    expect(memberMeetsCabinetMembership('NPC', 'Adventurer')).toBe(false);
    expect(memberMeetsCabinetMembership('Pro', 'Pro')).toBe(true);
    expect(resolveArcadeCabinetAccess(OFFICIAL_ARCADE_CABINETS[0]!, 'Adventurer')).toBe('live');
  });
});