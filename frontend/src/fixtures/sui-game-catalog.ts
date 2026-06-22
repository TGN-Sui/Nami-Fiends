import type { ChannelModule, NamiChannel, NamiDeveloperProfile } from '../domain/types.js';

const defaultModules: ChannelModule[] = [
  { label: 'Game Chat', description: 'Main live community chat.' },
  { label: 'Timeline', description: 'Official posts and community updates.' },
  { label: 'Guilds', description: 'Guilds created inside this channel.' },
  { label: 'Events', description: 'Upcoming events and tournaments.' },
  { label: 'Party Chats', description: 'Find squads and party members.' },
];

function demoChannelCover(title: string, gradientStart: string, gradientMid: string, accent: string): string {
  const label = title.slice(0, 14).toUpperCase();
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' +
    gradientStart +
    '"/>' +
    '<stop offset=".55" stop-color="' +
    gradientMid +
    '"/>' +
    '<stop offset="1" stop-color="#05070d"/>' +
    '</linearGradient></defs>' +
    '<rect width="900" height="1200" fill="url(#g)"/>' +
    '<circle cx="700" cy="230" r="180" fill="' +
    accent +
    '" opacity=".28"/>' +
    '<rect x="96" y="96" width="708" height="1008" rx="58" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="10"/>' +
    '<text x="92" y="610" font-family="Arial Black, Arial" font-size="108" fill="#ffffff">' +
    label +
    '</text>' +
    '<text x="104" y="700" font-family="Arial" font-size="42" fill="#ffffff" opacity=".72">SUI GAME</text>' +
    '</svg>';

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export type SuiGameCatalogEntry = {
  channelId: string;
  name: string;
  handle: string;
  developerId: string;
  developerName: string;
  developerHandle: string;
  developerLogoSeed: string;
  coverArtSeed: string;
  coverArtStyle: NamiChannel['coverArtStyle'];
  coverImageUrl: string;
  genre: string;
  platforms: string[];
  tagline: string;
  theme: string;
  verifiedGame: boolean;
  verified: boolean;
  partner: boolean;
  officialNami?: boolean;
  signal: NamiChannel['signal'];
  subscribers: number;
  officialBadges: string[];
  customBadges: string[];
  verifiedLinks: NamiChannel['verifiedLinks'];
  announcements: string[];
  proofStatus: NamiDeveloperProfile['proofStatus'];
  developerApproved: boolean;
};

/** Canonical metadata for real games building on Sui (sources: sui.io/gaming, sui.directory, official sites). */
export const SUI_GAME_CATALOG: Record<string, SuiGameCatalogEntry> = {
  panzerdogs: {
    channelId: 'panzerdogs',
    name: 'PanzerDogs',
    handle: '@panzerdogs',
    developerId: 'lucky-kat-games',
    developerName: 'Lucky Kat Games',
    developerHandle: '@lucky-kat-games',
    developerLogoSeed: 'LK',
    coverArtSeed: 'tank-arena',
    coverArtStyle: 'arcade',
    coverImageUrl: demoChannelCover('PanzerDogs', '#f59e0b', '#3b2208', '#fef08a'),
    genre: 'Action / PvP',
    platforms: ['Mobile', 'PC', 'Sui'],
    tagline:
      'Own every tank and battle on Sui — fast PvP tank combat with onchain assets (Sui Directory · SuiPlay0X1).',
    theme: 'amber',
    verifiedGame: true,
    verified: true,
    partner: true,
    signal: 'Green',
    subscribers: 18420,
    officialBadges: ['Verified Channel', 'Sui Directory', 'SuiPlay0X1'],
    customBadges: ['Tank Captain', 'Smackdown Regular', 'Crew Leader'],
    verifiedLinks: [
      { label: 'panzerdogs.io', verified: true },
      { label: 'Discord', verified: true },
      { label: 'X / Twitter', verified: true },
    ],
    announcements: [
      'PanzerDogs is live on SuiPlay0X1 — squad up for Smackdown tournaments.',
      'Tank loadouts and onchain cosmetics sync across mobile and PC builds.',
      'Weekly raid brackets posted in the Events tab.',
    ],
    proofStatus: 'Verified Studio',
    developerApproved: true,
  },
  pawtato: {
    channelId: 'pawtato',
    name: 'Pawtato Land',
    handle: '@pawtato',
    developerId: 'pawtato-finance',
    developerName: 'Pawtato Finance Corp',
    developerHandle: '@pawtato-finance',
    developerLogoSeed: 'PT',
    coverArtSeed: 'cozy-forest',
    coverArtStyle: 'cozy',
    coverImageUrl: demoChannelCover('Pawtato Land', '#86efac', '#1a3d2d', '#fef08a'),
    genre: 'MMO / Social',
    platforms: ['Web', 'Mobile', 'Sui'],
    tagline: 'Player-driven NFT MMO on Sui powered by $TATO — build, socialize, and grow your land.',
    theme: 'green',
    verifiedGame: true,
    verified: true,
    partner: false,
    signal: 'Green',
    subscribers: 26680,
    officialBadges: ['Verified Channel', 'Sui Native'],
    customBadges: ['Land Owner', 'TATO Farmer', 'Cozy Crew'],
    verifiedLinks: [
      { label: 'land.pawtato.app', verified: true },
      { label: 'Community Hub', verified: true },
    ],
    announcements: [
      'Pawtato Land genesis plots are open for verified Adventurers.',
      'Weekly $TATO community events run through the channel Events board.',
      'Squad up for land raids and co-op farming sessions.',
    ],
    proofStatus: 'Verified Studio',
    developerApproved: true,
  },
  xociety: {
    channelId: 'xociety',
    name: 'XOCIETY',
    handle: '@xociety',
    developerId: 'team-ndus',
    developerName: 'Team NDUS',
    developerHandle: '@team-ndus',
    developerLogoSeed: 'XN',
    coverArtSeed: 'extraction-shooter',
    coverArtStyle: 'neon',
    coverImageUrl: demoChannelCover('XOCIETY', '#38bdf8', '#0f2a44', '#c4b5fd'),
    genre: 'Shooter / Extraction',
    platforms: ['PC', 'Sui'],
    tagline:
      'Third-person POP shooter with extraction-based RPG progression — featured on sui.io/gaming.',
    theme: 'blue',
    verifiedGame: true,
    verified: true,
    partner: true,
    signal: 'Green',
    subscribers: 14280,
    officialBadges: ['Verified Channel', 'Sui Gaming', 'Epic Playtest'],
    customBadges: ['Extraction Lead', 'POP Squad', 'Frontier Runner'],
    verifiedLinks: [
      { label: 'xociety.io', verified: true },
      { label: 'Epic Games Store', verified: true },
    ],
    announcements: [
      'Early access playtests are scheduled through the official XOCIETY site.',
      'Extraction squads can recruit verified members in Party Chats.',
      'Patch notes for PC builds publish after each playtest window.',
    ],
    proofStatus: 'Verified Studio',
    developerApproved: true,
  },
  fiends: {
    channelId: 'fiends',
    name: 'Sui Goonies',
    handle: '@sui-goonies',
    developerId: 'goonie-labs',
    developerName: 'Goonie Labs',
    developerHandle: '@goonie-labs',
    developerLogoSeed: 'GL',
    coverArtSeed: 'goon-squad',
    coverArtStyle: 'neon',
    coverImageUrl: demoChannelCover('Sui Goonies', '#ff3152', '#221020', '#75d7ff'),
    genre: 'Gaming / Social',
    platforms: ['Sui', 'PC'],
    tagline: 'Goonie Labs onchain gaming community — collect, squad up, and raid on Sui.',
    theme: 'crimson',
    verifiedGame: true,
    verified: true,
    partner: true,
    officialNami: true,
    signal: 'Green',
    subscribers: 9120,
    officialBadges: ['Verified Channel', 'Sui Native', 'Community Hub'],
    customBadges: ['Goon Crew', 'Raid Regular', 'Founder Room'],
    verifiedLinks: [
      { label: 'goonielabs.com', verified: true },
      { label: 'X / SuiGoonies', verified: true },
    ],
    announcements: [
      'Sui Goonies mint windows and community raids post in the Events tab.',
      'Verified guild allies can request featured placement this cycle.',
      'Party chat slots open for weekend co-op runs.',
    ],
    proofStatus: 'Verified Studio',
    developerApproved: true,
  },
};

/** Primary pair used for boost + squad functional mocks outside the full dev fixture catalog. */
export const FUNCTIONAL_MOCK_SUI_GAME_IDS = ['panzerdogs', 'pawtato'] as const;

export function buildNamiChannelFromSuiGame(
  gameId: keyof typeof SUI_GAME_CATALOG | string,
  overrides: Partial<NamiChannel> = {}
): NamiChannel {
  const entry = SUI_GAME_CATALOG[gameId];

  if (!entry) {
    throw new Error('Unknown Sui game catalog entry: ' + gameId);
  }

  return {
    id: entry.channelId,
    surfaceType: 'game',
    name: entry.name,
    handle: entry.handle,
    owner: entry.developerName,
    developerId: entry.developerId,
    developerName: entry.developerName,
    developerLogoSeed: entry.developerLogoSeed,
    coverArtSeed: entry.coverArtSeed,
    coverArtStyle: entry.coverArtStyle,
    coverImageUrl: entry.coverImageUrl,
    verifiedGame: entry.verifiedGame,
    genre: entry.genre,
    platforms: [...entry.platforms],
    subscribers: entry.subscribers,
    verified: entry.verified,
    partner: entry.partner,
    ...(entry.officialNami ? { officialNami: true } : {}),
    signal: entry.signal,
    tagline: entry.tagline,
    banner: entry.name + ' on Sui',
    theme: entry.theme,
    modules: defaultModules,
    officialBadges: [...entry.officialBadges],
    customBadges: [...entry.customBadges],
    verifiedLinks: entry.verifiedLinks.map((link) => ({ ...link })),
    announcements: [...entry.announcements],
    ...overrides,
  };
}

export function buildDeveloperFromSuiGame(gameId: string): NamiDeveloperProfile {
  const entry = SUI_GAME_CATALOG[gameId];

  if (!entry) {
    throw new Error('Unknown Sui game catalog entry: ' + gameId);
  }

  return {
    id: entry.developerId,
    surfaceType: 'developer',
    name: entry.developerName,
    handle: entry.developerHandle,
    logoSeed: entry.developerLogoSeed,
    proofStatus: entry.proofStatus,
    approved: entry.developerApproved,
    gameIds: [entry.channelId],
    studioSignal: entry.signal,
  };
}

export function functionalMockSuiGameChannels(): NamiChannel[] {
  return FUNCTIONAL_MOCK_SUI_GAME_IDS.map((gameId) => buildNamiChannelFromSuiGame(gameId));
}

export function functionalMockSuiGameDevelopers(): NamiDeveloperProfile[] {
  return FUNCTIONAL_MOCK_SUI_GAME_IDS.map((gameId) => buildDeveloperFromSuiGame(gameId));
}