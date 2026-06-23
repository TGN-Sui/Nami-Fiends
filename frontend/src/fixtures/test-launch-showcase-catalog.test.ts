import { describe, expect, it } from 'vitest';

import {
  testLaunchShowcaseChannels,
  testLaunchShowcaseDevelopers,
  testLaunchShowcaseMembers,
} from './test-launch-showcase-catalog.js';

describe('test-launch-showcase-catalog', () => {
  it('exposes curated game channels for testers', () => {
    expect(testLaunchShowcaseChannels.length).toBeGreaterThanOrEqual(6);
    expect(testLaunchShowcaseChannels.every((channel) => channel.surfaceType === 'game')).toBe(true);
    expect(testLaunchShowcaseChannels.some((channel) => channel.id === 'fiends')).toBe(true);
    expect(testLaunchShowcaseChannels.some((channel) => channel.id === 'pebble')).toBe(true);
  });

  it('marks every showcase member as NPC', () => {
    expect(testLaunchShowcaseMembers.length).toBeGreaterThanOrEqual(8);
    expect(testLaunchShowcaseMembers.every((member) => member.tier === 'NPC')).toBe(true);
    expect(testLaunchShowcaseMembers.every((member) => !member.isNamiTeam)).toBe(true);
  });

  it('includes developers for showcased game channels', () => {
    const showcasedIds = new Set(testLaunchShowcaseChannels.map((channel) => channel.id));

    expect(testLaunchShowcaseDevelopers.length).toBeGreaterThan(0);
    expect(
      testLaunchShowcaseDevelopers.every((developer) =>
        developer.gameIds.some((gameId) => showcasedIds.has(gameId))
      )
    ).toBe(true);
  });
});