import { describe, expect, it } from 'vitest';

import {
  channelRainbowBorderClass,
  isFiendMember,
  isOfficialNamiGalaxyMember,
  memberDisplayRankLabel,
  memberRainbowBorderClass,
  OFFICIAL_OWNER_RANK_LABEL,
  officialNamiGalaxyBadgeLabel,
  officialNamiPassportMarkLabel,
  officialNamiTeamBadgeLabel,
} from './channel-surface.js';
import type { NamiChannel, NamiMember } from './uiMockData.js';

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

describe('channel-surface game channel styling', () => {
  it('does not apply rainbow foil borders to game channels', () => {
    const partnerChannel = {
      id: 'pebble',
      surfaceType: 'game',
      name: 'Pebble',
      handle: '@pebble',
      owner: 'Pebble Labs',
      developerId: 'pebble-labs',
      developerName: 'Pebble Labs',
      developerLogoSeed: 'PL',
      coverArtSeed: 'builder-wave',
      coverArtStyle: 'ocean',
      verifiedGame: true,
      genre: 'Builder',
      platforms: ['Sui'],
      subscribers: 1000,
      verified: true,
      partner: true,
      officialNami: true,
      signal: 'Green',
      tagline: 'Builder community',
      banner: 'Banner',
      theme: 'teal',
      modules: [],
      officialBadges: [],
      customBadges: [],
      verifiedLinks: [],
      announcements: [],
    } satisfies NamiChannel;

    expect(channelRainbowBorderClass(partnerChannel)).toBe('');
  });
});

describe('channel-surface FIEND owner identity', () => {
  it('reserves galaxy styling for the official owner only', () => {
    const owner = createMember({ isNamiBoss: true });
    const team = createMember({ isNamiTeam: true });

    expect(isFiendMember(owner)).toBe(true);
    expect(isOfficialNamiGalaxyMember(owner)).toBe(true);
    expect(memberRainbowBorderClass(owner)).toBe(' is-nami-rainbow-foil-border');
    expect(officialNamiGalaxyBadgeLabel(owner)).toBe(OFFICIAL_OWNER_RANK_LABEL);
    expect(officialNamiPassportMarkLabel(owner)).toBe('FIEND Passport');
    expect(memberDisplayRankLabel(owner)).toBe(OFFICIAL_OWNER_RANK_LABEL);

    expect(isOfficialNamiGalaxyMember(team)).toBe(false);
    expect(memberRainbowBorderClass(team)).toBe('');
    expect(officialNamiGalaxyBadgeLabel(team)).toBeNull();
    expect(officialNamiTeamBadgeLabel(team)).toBe('Official Nami Team');
    expect(memberDisplayRankLabel(team)).toBe('NPC');
  });

  it('does not apply FIEND styling to regular members', () => {
    const member = createMember();

    expect(isFiendMember(member)).toBe(false);
    expect(isOfficialNamiGalaxyMember(member)).toBe(false);
    expect(memberRainbowBorderClass(member)).toBe('');
    expect(officialNamiGalaxyBadgeLabel(member)).toBeNull();
    expect(memberDisplayRankLabel(member)).toBe('NPC');
  });
});