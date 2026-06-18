import { describe, expect, it } from 'vitest';

import {
  shouldAutoSeedLocalData,
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