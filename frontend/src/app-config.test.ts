import { describe, expect, it } from 'vitest';

import {
  isDemoSimulationEnabled,
  isDemoWalletOnboardingEnabled,
  isMockMembershipCheckoutEnabled,
  shouldAutoSeedLocalData,
  shouldUseDemoOwnerFallback,
  shouldUseDevFixtures,
  shouldUseFixtureCatalogFallback,
  shouldUseFunctionalMockCatalog,
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

  it('blocks auto-seed during test launch', () => {
    expect(shouldAutoSeedLocalData(createConfig({ testLaunch: true }))).toBe(false);
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