import { describe, expect, it, vi } from 'vitest';

import type { AppConfig } from './app-config.js';

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

vi.mock('./app-config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./app-config.js')>();
  const config = testLaunchConfig();

  return {
    ...actual,
    readAppConfig: () => config,
    shouldUseDevFixtures: (appConfig?: AppConfig) =>
      actual.shouldUseDevFixtures(appConfig ?? config),
    isTestLaunchMode: (appConfig?: AppConfig) => actual.isTestLaunchMode(appConfig ?? config),
    shouldUseFixtureCatalogFallback: (
      liveItemCount: number,
      loadState: 'idle' | 'loading' | 'ready' | 'error',
      appConfig?: AppConfig
    ) => actual.shouldUseFixtureCatalogFallback(liveItemCount, loadState, appConfig ?? config),
  };
});

import {
  isDemoSimulationEnabled,
  isDemoWalletOnboardingEnabled,
  isMockMembershipCheckoutEnabled,
  shouldAutoSeedLocalData,
  shouldUseDevFixtures,
  shouldUseFixtureCatalogFallback,
} from './app-config.js';
import { resolveChannelDirectory } from './channel-directory-provider.js';
import { readSeedMembers } from './fixture-catalog-access.js';
import { testLaunchShowcaseMembers } from './fixtures/test-launch-showcase-catalog.js';
import { resolveMemberDirectory } from './member-directory-provider.js';
import { listHubGlobalChats } from './global-chats.js';

describe('live surface audit — test launch policy', () => {
  const config = testLaunchConfig();

  it('disables dev fixture catalogs, demo surfaces, and showcase fallback during test launch', () => {
    expect(shouldUseDevFixtures(config)).toBe(false);
    expect(isDemoSimulationEnabled(config)).toBe(false);
    expect(isDemoWalletOnboardingEnabled(config)).toBe(false);
    expect(shouldAutoSeedLocalData(config)).toBe(false);
    expect(isMockMembershipCheckoutEnabled(config)).toBe(false);
    expect(shouldUseFixtureCatalogFallback(0, 'ready', config)).toBe(false);
  });

  it('returns an empty channel directory during test launch when no created channels exist', () => {
    const items = resolveChannelDirectory({
      liveRankings: [],
      loadState: 'ready',
      liveQueryEnabled: true,
      localChannels: [],
      fixtureChannels: [],
    });

    expect(items).toEqual([]);
  });

  it('returns an empty member directory during test launch when no registered accounts exist', () => {
    expect(readSeedMembers()).toEqual([]);

    const items = resolveMemberDirectory({
      liveMembers: [],
      loadState: 'ready',
      liveQueryEnabled: false,
      localMembers: [],
      fixtureMembers: testLaunchShowcaseMembers,
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