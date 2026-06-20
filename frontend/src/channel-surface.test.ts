import { describe, expect, it } from 'vitest';

import {
  isNamiBossMember,
  isOfficialNamiGalaxyMember,
  memberRainbowBorderClass,
  officialNamiGalaxyBadgeLabel,
  officialNamiPassportMarkLabel,
} from './channel-surface.js';
import type { NamiMember } from './uiMockData.js';

function createMember(overrides: Partial<NamiMember> = {}): NamiMember {
  return {
    id: 'm1',
    surfaceType: 'member',
    name: 'Traveler',
    avatarSeed: 'NA',
    signal: 'Green',
    tier: 'NPC',
    badge: 'Hearth Basic',
    ...overrides,
  };
}

describe('channel-surface official galaxy identity', () => {
  it('treats official boss members as galaxy passport holders', () => {
    const boss = createMember({ isNamiBoss: true });

    expect(isNamiBossMember(boss)).toBe(true);
    expect(isOfficialNamiGalaxyMember(boss)).toBe(true);
    expect(memberRainbowBorderClass(boss)).toBe(' is-nami-rainbow-foil-border');
    expect(officialNamiGalaxyBadgeLabel(boss)).toBe('Official Nami Boss');
    expect(officialNamiPassportMarkLabel(boss)).toBe('Official Nami Boss Passport');
  });

  it('keeps team labels separate from boss labels', () => {
    const team = createMember({ isNamiTeam: true });

    expect(isOfficialNamiGalaxyMember(team)).toBe(true);
    expect(officialNamiGalaxyBadgeLabel(team)).toBe('Official Nami Team');
    expect(officialNamiPassportMarkLabel(team)).toBe('Official Nami Team Passport');
  });

  it('does not apply galaxy styling to regular members', () => {
    const member = createMember();

    expect(isOfficialNamiGalaxyMember(member)).toBe(false);
    expect(memberRainbowBorderClass(member)).toBe('');
    expect(officialNamiGalaxyBadgeLabel(member)).toBeNull();
  });
});