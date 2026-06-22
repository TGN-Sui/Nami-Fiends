import { describe, expect, it } from 'vitest';

import {
  buildNamiChannelFromSuiGame,
  FUNCTIONAL_MOCK_SUI_GAME_IDS,
  functionalMockSuiGameChannels,
  SUI_GAME_CATALOG,
} from './sui-game-catalog.js';

describe('sui-game-catalog', () => {
  it('defines real Sui games with accurate studio names', () => {
    expect(SUI_GAME_CATALOG.panzerdogs.developerName).toBe('Lucky Kat Games');
    expect(SUI_GAME_CATALOG.pawtato.name).toBe('Pawtato Land');
    expect(SUI_GAME_CATALOG.xociety.developerName).toBe('Team NDUS');
    expect(SUI_GAME_CATALOG.fiends.name).toBe('Sui Goonies');
  });

  it('exposes two functional mock channels for boost and squad flows', () => {
    const channels = functionalMockSuiGameChannels();

    expect(FUNCTIONAL_MOCK_SUI_GAME_IDS).toEqual(['panzerdogs', 'pawtato']);
    expect(channels).toHaveLength(2);
    expect(channels.map((channel) => channel.id)).toEqual(['panzerdogs', 'pawtato']);
    expect(channels.every((channel) => channel.platforms.includes('Sui'))).toBe(true);
  });

  it('builds channel records with verified Sui-native metadata', () => {
    const panzerdogs = buildNamiChannelFromSuiGame('panzerdogs');

    expect(panzerdogs.verifiedGame).toBe(true);
    expect(panzerdogs.genre).toBe('Action / PvP');
    expect(panzerdogs.developerName).toBe('Lucky Kat Games');
  });
});