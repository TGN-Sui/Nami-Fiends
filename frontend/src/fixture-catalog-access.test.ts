import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fixturesEnabled, testLaunchMode } = vi.hoisted(() => ({
  fixturesEnabled: { value: true },
  testLaunchMode: { value: false },
}));

vi.mock('./app-config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./app-config.js')>();

  return {
    ...actual,
    shouldUseDevFixtures: () => fixturesEnabled.value,
    isTestLaunchMode: () => testLaunchMode.value,
    shouldUseTestLaunchShowcaseCatalog: () => false,
  };
});

import {
  findSeedChannelById,
  readSeedChannels,
  readSeedMembers,
} from './fixture-catalog-access.js';

describe('fixture-catalog-access', () => {
  beforeEach(() => {
    fixturesEnabled.value = true;
    testLaunchMode.value = false;
  });

  it('returns seed catalogs when dev fixtures are enabled', () => {
    expect(readSeedChannels().length).toBeGreaterThan(0);
    expect(readSeedMembers().length).toBeGreaterThan(0);
    expect(findSeedChannelById('vortex')?.id).toBe('vortex');
  });

  it('returns empty catalogs during test launch when dev fixtures are disabled', () => {
    fixturesEnabled.value = false;
    testLaunchMode.value = true;

    expect(readSeedChannels()).toEqual([]);
    expect(readSeedMembers()).toEqual([]);
    expect(findSeedChannelById('vortex')).toBeUndefined();
  });

  it('returns empty catalogs when dev fixtures and test launch showcase are disabled', () => {
    fixturesEnabled.value = false;
    testLaunchMode.value = false;

    expect(readSeedChannels()).toEqual([]);
    expect(readSeedMembers()).toEqual([]);
    expect(findSeedChannelById('vortex')).toBeUndefined();
  });
});