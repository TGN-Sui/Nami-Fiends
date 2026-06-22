import { describe, expect, it } from 'vitest';

import {
  isDemoSimulationEnabled,
  isDemoWalletOnboardingEnabled,
  isMockMembershipCheckoutEnabled,
  shouldAutoSeedLocalData,
  shouldUseDevFixtures,
  shouldUseFixtureCatalogFallback,
  type AppConfig,
} from './app-config.js';
import { resolveChannelDirectory } from './channel-directory-provider.js';
import { resolveMemberDirectory } from './member-directory-provider.js';
import { listHubGlobalChats } from './global-chats.js';

function testLaunchConfig(): AppConfig {
  return {
    network: 'testnet',
    packageId: '0xd4ccad8f0687e31aaee2524db96c7a1d9509abaeadc949e0136c6522a631e058',
    indexerUrl: 'https://api.example',
    officialOwner: '0xowner',
    demoOwner: null,
    adminCapId: '0xadmin',
    requireWalletAuth: true,
    testLaunch: true,
    devFixtures: false,
  };
}

describe('live surface audit — test launch policy', () => {
  const config = testLaunchConfig();

  it('disables fixture catalogs and demo surfaces', () => {
    expect(shouldUseDevFixtures(config)).toBe(false);
    expect(isDemoSimulationEnabled(config)).toBe(false);
    expect(isDemoWalletOnboardingEnabled(config)).toBe(false);
    expect(shouldAutoSeedLocalData(config)).toBe(false);
    expect(isMockMembershipCheckoutEnabled(config)).toBe(false);
    expect(shouldUseFixtureCatalogFallback(0, 'ready', config)).toBe(false);
  });

  it('returns empty channel directory without live or fixture fallback', () => {
    const items = resolveChannelDirectory({
      liveRankings: [],
      loadState: 'ready',
      liveQueryEnabled: true,
      fixtureChannels: [],
      localChannels: [],
    });

    expect(items).toEqual([]);
  });

  it('returns empty member directory without live or fixture fallback', () => {
    const items = resolveMemberDirectory({
      liveMembers: [],
      loadState: 'ready',
      liveQueryEnabled: false,
      fixtureMembers: [],
      localMembers: [],
    });

    expect(items).toEqual([]);
  });

  it('does not enrich live discovery rows with fixture metadata when fixtures are empty', () => {
    const items = resolveChannelDirectory({
      liveRankings: [
        {
          channel_id: 'vortex',
          owner: '0xowner',
          is_verified: true,
          is_public: true,
          boost_power: 40,
          boost_count: 1,
          score: 120,
          week_id: 3,
          rank: 1,
          signals: ['green'],
        },
      ],
      loadState: 'ready',
      liveQueryEnabled: true,
      fixtureChannels: [],
      localChannels: [],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe('live');
    expect(items[0]?.channel.name).toBe('Channel vortex');
    expect(items[0]?.channel.tagline).toBe('Indexed discovery channel.');
  });
});

describe('live surface audit — hub global chats', () => {
  it('exposes only the official global room during test launch', () => {
    const chats = listHubGlobalChats(true);

    expect(chats).toHaveLength(1);
    expect(chats[0]?.id).toBe('official-nami-global');
  });

  it('keeps dev lounge rooms outside test launch', () => {
    const chats = listHubGlobalChats(false);

    expect(chats.length).toBeGreaterThan(1);
  });
});