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

  it('returns test launch showcase catalogs when fixtures are disabled but test launch is on', () => {
    fixturesEnabled = false;
    testLaunchMode = true;

    const channels = readSeedChannels();
    const members = readSeedMembers();

    expect(channels.length).toBeGreaterThan(0);
    expect(members.length).toBeGreaterThan(0);
    expect(channels.every((channel) => channel.surfaceType === 'game')).toBe(true);
    expect(members.every((member) => member.tier === 'NPC')).toBe(true);
    expect(findSeedChannelById('vortex')?.id).toBe('vortex');
  });

  it('returns empty catalogs when dev fixtures and test launch showcase are disabled', () => {
    fixturesEnabled = false;
    testLaunchMode = false;

    expect(readSeedChannels()).toEqual([]);
    expect(readSeedMembers()).toEqual([]);
    expect(findSeedChannelById('vortex')).toBeUndefined();
  });
});