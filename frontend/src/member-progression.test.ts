import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NamiMember } from './uiMockData.js';

const SELF_MEMBER: NamiMember = {
  id: 'm1',
  surfaceType: 'member',
  name: 'Traveler',
  avatarSeed: 'NA',
  signal: 'Green',
  tier: 'NPC',
  badge: 'Hearth Basic',
};

const OTHER_MEMBER: NamiMember = {
  id: 'm2',
  surfaceType: 'member',
  name: 'Fixture Member',
  avatarSeed: 'NB',
  signal: 'Green',
  tier: 'Pro',
  badge: 'Wave Rider',
};

vi.mock('./app-config.js', () => ({
  readAppConfig: () => ({
    testLaunch: true,
    devFixtures: false,
  }),
  shouldUseDevFixtures: () => false,
}));

vi.mock('./uiMockData.js', () => ({
  members: [SELF_MEMBER, OTHER_MEMBER],
}));

describe('member-progression genesis snapshot', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns level 1 with zero xp for the signed-in self member', async () => {
    const { getNamiProgression, GENESIS_PROGRESSION } = await import('./member-progression.js');

    expect(getNamiProgression(SELF_MEMBER)).toEqual(GENESIS_PROGRESSION);
  });

  it('keeps fixture progression for non-self members', async () => {
    const { getNamiProgression } = await import('./member-progression.js');
    const progression = getNamiProgression(OTHER_MEMBER);

    expect(progression.level).toBeGreaterThan(1);
    expect(progression.currentXp).toBeGreaterThan(0);
  });
});