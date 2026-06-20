import type {
  NamiChannel,
  NamiDeveloperProfile,
  NamiMember,
} from '../domain/types.js';

export type ShellGuildRecord = {
  id: string;
  name: string;
  ownerMemberId: string;
  memberIds: string[];
  isPublic: boolean;
};

export type ShellSquadRecord = {
  id: string;
  name: string;
  memberIds: string[];
  maxSlots: number;
};

/** Minimal self member when fixture catalogs are disabled (test launch / live indexer). */
export function createShellSelfMember(): NamiMember {
  return {
    id: 'm1',
    surfaceType: 'member',
    name: 'Traveler',
    avatarSeed: 'NA',
    signal: 'Green',
    tier: 'NPC',
    badge: 'Unset',
  };
}

/** Routing placeholder — not shown in discovery when live catalogs are empty. */
export function createShellChannel(): NamiChannel {
  return {
    id: 'shell-channel',
    surfaceType: 'game',
    name: 'Channel',
    handle: '@channel',
    owner: 'Unset',
    developerId: 'shell-developer',
    developerName: 'Unset',
    developerLogoSeed: 'NA',
    coverArtSeed: 'shell',
    coverArtStyle: 'ocean',
    verifiedGame: false,
    genre: 'Unset',
    platforms: [],
    subscribers: 0,
    verified: false,
    partner: false,
    signal: 'Green',
    tagline: '',
    banner: '',
    theme: 'ocean',
    modules: [],
    officialBadges: [],
    customBadges: [],
    verifiedLinks: [],
    announcements: [],
  };
}

export function createShellDeveloper(): NamiDeveloperProfile {
  return {
    id: 'shell-developer',
    surfaceType: 'developer',
    name: 'Studio',
    handle: '@studio',
    logoSeed: 'NA',
    proofStatus: 'Unverified Creator',
    approved: false,
    gameIds: [],
    studioSignal: 'Green',
  };
}

export function createShellGuild(): ShellGuildRecord {
  return {
    id: 'shell-guild',
    name: 'Guild',
    ownerMemberId: 'm1',
    memberIds: ['m1'],
    isPublic: false,
  };
}

export function createShellSquad(): ShellSquadRecord {
  return {
    id: 'shell-squad',
    name: 'Squad',
    memberIds: ['m1'],
    maxSlots: 8,
  };
}