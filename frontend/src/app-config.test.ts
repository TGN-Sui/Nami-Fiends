import { describe, expect, it, vi } from 'vitest';

import {
  isDemoSimulationEnabled,
  isDemoWalletOnboardingEnabled,
  isLocalDevEnvironment,
  isLocalIndexerUrl,
  isMockMembershipCheckoutEnabled,
  shouldAutoSeedLocalData,
  shouldUseDemoOwnerFallback,
  shouldUseDevFixtures,
  shouldUseFixtureCatalogFallback,
  shouldUseFunctionalMockCatalog,
  shouldUseTestLaunchShowcaseCatalog,
  type AppConfig,
} from './app-config.js';

function createConfig(overrides: Partial<AppConfig>): AppConfig {
  return {
    network: 'testnet',
    packageId: null,
    indexerUrl: null,
    officialOwner: null,
    demoOwner: null,
    adminCapId: null,
    requireWalletAuth: false,
    testLaunch: false,
    devFixtures: true,
    ...overrides,
  };
}

describe('app-config seed policy', () => {
  it('allows auto-seed in dev fixture mode', () => {
    expect(shouldAutoSeedLocalData(createConfig({}))).toBe(true);
  });

  it('blocks auto-seed during public test launch', () => {
    expect(
      shouldAutoSeedLocalData(
        createConfig({ testLaunch: true, indexerUrl: 'https://nami-backend.example' })
      )
    ).toBe(false);
  });

  it('allows auto-seed during local test launch', () => {
    vi.stubEnv('VITE_NAMI_LOCAL_DEV', '');

    expect(
      shouldAutoSeedLocalData(
        createConfig({ testLaunch: true, indexerUrl: 'http://127.0.0.1:8787' })
      )
    ).toBe(true);
  });

  it('blocks auto-seed when dev fixtures are disabled', () => {
    expect(shouldAutoSeedLocalData(createConfig({ devFixtures: false }))).toBe(false);
  });

  it('blocks auto-seed when test launch and fixtures are both disabled', () => {
    expect(
      shouldAutoSeedLocalData(createConfig({ testLaunch: true, devFixtures: false }))
    ).toBe(false);
  });
});

describe('app-config directory fallback', () => {
  it('keeps fixture catalogs during dev polish when live discovery is empty', () => {
    expect(shouldUseFixtureCatalogFallback(0, 'ready', createConfig({}))).toBe(true);
  });

  it('skips fixture fallback when live rows are present', () => {
    expect(shouldUseFixtureCatalogFallback(2, 'ready', createConfig({}))).toBe(false);
  });

  it('disables functional mock catalog in favor of real created accounts', () => {
    expect(shouldUseFunctionalMockCatalog(createConfig({ devFixtures: false }))).toBe(false);
    expect(shouldUseFixtureCatalogFallback(0, 'ready', createConfig({ devFixtures: false }))).toBe(
      false
    );
  });

  it('disables fixture fallback during public test launch when live discovery is empty', () => {
    expect(
      shouldUseFixtureCatalogFallback(
        0,
        'ready',
        createConfig({
          testLaunch: true,
          devFixtures: false,
          indexerUrl: 'https://nami-backend.example',
        })
      )
    ).toBe(false);
  });

  it('enables showcase fallback during local test launch when live discovery is empty', () => {
    vi.stubEnv('VITE_NAMI_LOCAL_DEV', '');

    const config = createConfig({
      testLaunch: true,
      devFixtures: false,
      indexerUrl: 'http://127.0.0.1:8787',
    });

    expect(shouldUseTestLaunchShowcaseCatalog(config)).toBe(true);
    expect(shouldUseFixtureCatalogFallback(0, 'ready', config)).toBe(true);
  });

  it('keeps fixture catalogs visible while discovery is still loading', () => {
    expect(shouldUseFixtureCatalogFallback(0, 'loading', createConfig({}))).toBe(true);
  });
});

describe('app-config mock checkout policy', () => {
  it('allows mock checkout in dev fixture mode', () => {
    expect(isMockMembershipCheckoutEnabled(createConfig({}))).toBe(true);
  });

  it('blocks mock checkout during test launch', () => {
    expect(isMockMembershipCheckoutEnabled(createConfig({ testLaunch: true }))).toBe(false);
  });
});

describe('app-config local indexer detection', () => {
  it('detects localhost and loopback indexer URLs', () => {
    expect(isLocalIndexerUrl('http://127.0.0.1:8787')).toBe(true);
    expect(isLocalIndexerUrl('http://localhost:8787')).toBe(true);
    expect(isLocalIndexerUrl('https://nami-backend-rv0o.onrender.com')).toBe(false);
  });

  it('treats local indexer as local dev during test launch', () => {
    vi.stubEnv('VITE_NAMI_LOCAL_DEV', '');

    expect(
      isLocalDevEnvironment(
        createConfig({ testLaunch: true, indexerUrl: 'http://127.0.0.1:8787' })
      )
    ).toBe(true);
  });

  it('honors VITE_NAMI_LOCAL_DEV=false on localhost indexer URLs', () => {
    vi.stubEnv('VITE_NAMI_LOCAL_DEV', 'false');

    expect(
      isLocalDevEnvironment(
        createConfig({ testLaunch: true, indexerUrl: 'http://127.0.0.1:8787' })
      )
    ).toBe(false);
  });
});

describe('app-config test launch policy', () => {
  it('disables fixture catalogs when test launch is enabled', () => {
    expect(shouldUseDevFixtures(createConfig({ testLaunch: true, devFixtures: true }))).toBe(false);
  });

  it('disables demo simulation surfaces during test launch', () => {
    expect(isDemoSimulationEnabled(createConfig({ testLaunch: true, devFixtures: true }))).toBe(
      false
    );
  });

  it('blocks demo owner fallback during test launch', () => {
    expect(
      shouldUseDemoOwnerFallback(
        createConfig({ testLaunch: true, devFixtures: true, demoOwner: '0xabc' })
      )
    ).toBe(false);
  });

  it('blocks demo wallet onboarding during test launch', () => {
    expect(isDemoWalletOnboardingEnabled(createConfig({ testLaunch: true, devFixtures: true }))).toBe(
      false
    );
  });
});