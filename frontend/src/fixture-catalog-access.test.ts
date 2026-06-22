import { beforeEach, describe, expect, it, vi } from 'vitest';

let fixturesEnabled = true;

vi.mock('./app-config.js', () => ({
  shouldUseDevFixtures: () => fixturesEnabled,
}));

import {
  findSeedChannelById,
  readSeedChannels,
  readSeedMembers,
} from './fixture-catalog-access.js';

describe('fixture-catalog-access', () => {
  beforeEach(() => {
    fixturesEnabled = true;
  });

  it('returns seed catalogs when dev fixtures are enabled', () => {
    expect(readSeedChannels().length).toBeGreaterThan(0);
    expect(readSeedMembers().length).toBeGreaterThan(0);
    expect(findSeedChannelById('vortex')?.id).toBe('vortex');
  });

  it('returns empty catalogs when dev fixtures are disabled', () => {
    fixturesEnabled = false;

    expect(readSeedChannels()).toEqual([]);
    expect(readSeedMembers()).toEqual([]);
    expect(findSeedChannelById('vortex')).toBeUndefined();
  });
});