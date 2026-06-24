import { beforeEach, describe, expect, it, vi } from 'vitest';

let fixturesEnabled = true;
let testLaunchMode = false;

vi.mock('./app-config.js', () => ({
  shouldUseDevFixtures: () => fixturesEnabled,
  isTestLaunchMode: () => testLaunchMode,
}));

import {
  findSeedChannelById,
  readSeedChannels,
  readSeedMembers,
} from './fixture-catalog-access.js';

describe('fixture-catalog-access', () => {
  beforeEach(() => {
    fixturesEnabled = true;
    testLaunchMode = false;
  });

  it('returns seed catalogs when dev fixtures are enabled', () => {
    expect(readSeedChannels().length).toBeGreaterThan(0);
    expect(readSeedMembers().length).toBeGreaterThan(0);
    expect(findSeedChannelById('vortex')?.id).toBe('vortex');
  });

  it('returns empty catalogs during test launch when dev fixtures are disabled', () => {
    fixturesEnabled = false;
    testLaunchMode = true;

    expect(readSeedChannels()).toEqual([]);
    expect(readSeedMembers()).toEqual([]);
    expect(findSeedChannelById('vortex')).toBeUndefined();
  });

  it('returns empty catalogs when dev fixtures and test launch showcase are disabled', () => {
    fixturesEnabled = false;
    testLaunchMode = false;

    expect(readSeedChannels()).toEqual([]);
    expect(readSeedMembers()).toEqual([]);
    expect(findSeedChannelById('vortex')).toBeUndefined();
  });
});