export type ConductSignal = 'Green' | 'Orange' | 'Red' | 'Black';

export type NamiPage =
  | 'hub'
  | 'gamehub'
  | 'subscriptions'
  | 'userProfile'
  | 'passport'
  | 'channelProfile'
  | 'studioProfile'
  | 'chat'
  | 'channelEvents'
  | 'memberProfile'
  | 'safetyCenter'
  | 'guilds'
  | 'messages'
  | 'events'
  | 'settings';

export type ChannelModule = {
  label: string;
  description: string;
};

export type VerifiedLink = {
  label: string;
  verified: boolean;
};

export type NamiChannel = {
  id: string;
  surfaceType: 'game';
  name: string;
  handle: string;
  owner: string;
  developerId: string;
  developerName: string;
  developerLogoSeed: string;
  coverArtSeed: string;
  coverArtStyle: 'neon' | 'ocean' | 'cozy' | 'arcade' | 'builder';
  coverImageUrl?: string;
  verifiedGame: boolean;
  genre: string;
  platforms: string[];
  subscribers: number;
  verified: boolean;
  partner: boolean;
  signal: ConductSignal;
  tagline: string;
  banner: string;
  theme: string;
  modules: ChannelModule[];
  officialBadges: string[];
  customBadges: string[];
  verifiedLinks: VerifiedLink[];
  announcements: string[];
};

export type NamiDeveloperProfile = {
  id: string;
  surfaceType: 'developer';
  name: string;
  handle: string;
  logoSeed: string;
  logoImageUrl?: string;
  proofStatus: 'Verified Studio' | 'Community Maintainer' | 'Unverified Creator';
  approved: boolean;
  gameIds: string[];
  studioSignal: ConductSignal;
};

export type UserProfile = {
  displayName: string;
  handle: string;
  wallet: string;
  passportId: string;
  tier: 'NPC' | 'Adventurer' | 'Pro' | 'Elite';
  level: number;
  xp: number;
  reputation: string;
  conductSignal: ConductSignal;
  bio: string;
  favoritePlatforms: string[];
  ownedBadges: string[];
  titles: string[];
  cosmetics: string[];
};

export type NamiMember = {
  id: string;
  surfaceType: 'member';
  name: string;
  avatarSeed: string;
  avatarImageUrl?: string;
  signal: ConductSignal;
  tier: 'NPC' | 'Adventurer' | 'Pro' | 'Elite';
  badge: string;
};

export type ChatMessage = {
  id: string;
  time: string;
  author: string;
  signal: ConductSignal;
  body: string;
};

const defaultModules: ChannelModule[] = [
  { label: 'Game Chat', description: 'Main live community chat.' },
  { label: 'Timeline', description: 'Official posts and community updates.' },
  { label: 'Guilds', description: 'Guilds created inside this channel.' },
  { label: 'Events', description: 'Upcoming events and tournaments.' },
  { label: 'Esports', description: 'Competitive channel space.' },
  { label: 'Party Chats', description: 'Find squads and party members.' },
  { label: 'Patch Notes', description: 'Official change logs and notes.' },
  { label: 'Support', description: 'Support links and help channels.' },
  { label: 'Badges', description: 'Channel badge progression.' },
  { label: 'Badge Gated', description: 'Badge-gated channel areas.' }
];

export const channels: NamiChannel[] = [
  {
    id: 'fiends',
      surfaceType: 'game',
    name: 'FIENDS',
    handle: '@fiends',
    owner: 'Goonie Labs',
      developerId: 'goonie-labs',
      developerName: 'Goonie Labs',
      developerLogoSeed: 'GL',
      coverArtSeed: 'cyber-alley',
      coverArtStyle: 'neon',
      verifiedGame: true,
    genre: 'Gaming / Social',
    platforms: ['PC', 'Sui', 'Streaming'],
    subscribers: 128,
    verified: true,
    partner: true,
    signal: 'Green',
    tagline: 'Discuss, vibe, and game out with the rest of the squad.',
    banner: 'Official cyber alley banner',
    theme: 'crimson',
    modules: defaultModules,
    officialBadges: ['Verified Channel', '1 Year Channel', 'Top 10 Channel'],
    customBadges: ['Founder Room', 'Guild Ally', 'Event Regular'],
    verifiedLinks: [
      { label: 'Official Website', verified: true },
      { label: 'X / Social', verified: true },
      { label: 'Discord Mirror', verified: true }
    ],
    announcements: [
      'Official event banner is live for this weekend.',
      'Guild recruitment window opens Friday.',
      'New badge-gated chat areas are being prepared.'
    ]
  },
  {
    id: 'walrus',
      surfaceType: 'game',
    name: 'Walrus Raiders',
    handle: '@walrus',
    owner: 'Walrus Community',
      developerId: 'walrus-community',
      developerName: 'Walrus Community',
      developerLogoSeed: 'WC',
      coverArtSeed: 'ocean-raid',
      coverArtStyle: 'ocean',
      verifiedGame: true,
    genre: 'Adventure',
    platforms: ['PC', 'Console'],
    subscribers: 1228,
    verified: true,
    partner: false,
    signal: 'Orange',
    tagline: 'Serious co-op crews, friendly strategy, and raids.',
    banner: 'Ocean raid banner',
    theme: 'blue',
    modules: defaultModules,
    officialBadges: ['Verified Channel', 'Raid Partner'],
    customBadges: ['Deep Diver', 'Squad Captain', 'Loot Runner'],
    verifiedLinks: [
      { label: 'Official Website', verified: true },
      { label: 'Raid Calendar', verified: true }
    ],
    announcements: [
      'Raid schedule updated for the next cycle.',
      'New orange-signal strategy rooms are available.',
      'Support tickets now route through the channel support tab.'
    ]
  },
  {
    id: 'pawtato',
      surfaceType: 'game',
    name: 'Pawtato',
    handle: '@pawtato',
    owner: 'Pawtato Community',
      developerId: 'pawtato-community',
      developerName: 'Pawtato Community',
      developerLogoSeed: 'PC',
      coverArtSeed: 'cozy-forest',
      coverArtStyle: 'cozy',
      verifiedGame: false,
    genre: 'Casual / Cozy',
    platforms: ['Mobile', 'PC'],
    subscribers: 2668,
    verified: false,
    partner: false,
    signal: 'Green',
    tagline: 'Casual community for cozy players and collectors.',
    banner: 'Cozy forest banner',
    theme: 'green',
    modules: defaultModules,
    officialBadges: ['Community Favorite'],
    customBadges: ['Collector', 'Cozy Crew', 'Garden Friend'],
    verifiedLinks: [
      { label: 'Community Page', verified: false },
      { label: 'Event Board', verified: false }
    ],
    announcements: [
      'Cozy night starts Saturday.',
      'Collector badge submissions are open.',
      'New player welcome thread is pinned.'
    ]
  },
  {
    id: 'retro',
      surfaceType: 'game',
    name: 'Retro Arena',
    handle: '@retro',
    owner: 'Retro Arcade',
      developerId: 'retro-arcade',
      developerName: 'Retro Arcade',
      developerLogoSeed: 'RA',
      coverArtSeed: 'neon-arcade',
      coverArtStyle: 'arcade',
      verifiedGame: false,
    genre: 'Arcade / PvP',
    platforms: ['PC', 'Console'],
    subscribers: 877,
    verified: false,
    partner: false,
    signal: 'Red',
    tagline: 'High-intensity retro PvP and arcade events.',
    banner: 'Neon arcade banner',
    theme: 'violet',
    modules: defaultModules,
    officialBadges: ['PvP Arena'],
    customBadges: ['Combo Master', 'Arena Regular', 'Boss Rush'],
    verifiedLinks: [
      { label: 'Tournament Board', verified: false },
      { label: 'Match Rules', verified: false }
    ],
    announcements: [
      'PvP bracket opens tonight.',
      'Red-signal rooms are high intensity by default.',
      'Arena badge rewards rotate weekly.'
    ]
  },
  {
    id: 'pebble',
      surfaceType: 'game',
    name: 'Pebble',
    handle: '@pebble',
    owner: 'Pebble Labs',
      developerId: 'pebble-labs',
      developerName: 'Pebble Labs',
      developerLogoSeed: 'PL',
      coverArtSeed: 'builder-wave',
      coverArtStyle: 'builder',
      verifiedGame: true,
    genre: 'Builder / Creative',
    platforms: ['Sui', 'Web'],
    subscribers: 23771,
    verified: true,
    partner: true,
    signal: 'Green',
    tagline: 'Builder community with verified creative channels.',
    banner: 'Builder wave banner',
    theme: 'teal',
    modules: defaultModules,
    officialBadges: ['Verified Channel', 'Partner Channel', 'Builder Hub'],
    customBadges: ['Creator', 'Module Maker', 'Early Builder'],
    verifiedLinks: [
      { label: 'Official Website', verified: true },
      { label: 'Builder Docs', verified: true },
      { label: 'Social Updates', verified: true }
    ],
    announcements: [
      'Builder showcase submissions are open.',
      'Partner spotlight starts next week.',
      'Creative guilds can now request featured placement.'
    ]
  }
];

export const developers: NamiDeveloperProfile[] = [
  {
    id: 'goonie-labs',
    surfaceType: 'developer',
    name: 'Goonie Labs',
    handle: '@goonie-labs',
    logoSeed: 'GL',
    proofStatus: 'Verified Studio',
    approved: true,
    gameIds: ['fiends'],
    studioSignal: 'Green'
  },
  {
    id: 'walrus-community',
    surfaceType: 'developer',
    name: 'Walrus Community',
    handle: '@walrus-dev',
    logoSeed: 'WC',
    proofStatus: 'Verified Studio',
    approved: true,
    gameIds: ['walrus'],
    studioSignal: 'Orange'
  },
  {
    id: 'pawtato-community',
    surfaceType: 'developer',
    name: 'Pawtato Community',
    handle: '@pawtato-dev',
    logoSeed: 'PC',
    proofStatus: 'Community Maintainer',
    approved: false,
    gameIds: ['pawtato'],
    studioSignal: 'Green'
  },
  {
    id: 'retro-arcade',
    surfaceType: 'developer',
    name: 'Retro Arcade',
    handle: '@retro-arcade-dev',
    logoSeed: 'RA',
    proofStatus: 'Community Maintainer',
    approved: false,
    gameIds: ['retro'],
    studioSignal: 'Red'
  },
  {
    id: 'pebble-labs',
    surfaceType: 'developer',
    name: 'Pebble Labs',
    handle: '@pebble-labs',
    logoSeed: 'PL',
    proofStatus: 'Verified Studio',
    approved: true,
    gameIds: ['pebble'],
    studioSignal: 'Green'
  }
];

export const userProfile: UserProfile = {
  displayName: 'NPC Gamer',
  handle: '@npcgamer',
  wallet: '0xUSER',
  passportId: '0xPASSPORT',
  tier: 'Adventurer',
  level: 18,
  xp: 1840,
  reputation: 'Gamester',
  conductSignal: 'Green',
  bio: 'Portable gamer identity powered by Sui. This is the user-owned profile area, separate from channel/game profiles.',
  favoritePlatforms: ['PC', 'Sui', 'Console'],
  ownedBadges: ['First Quest', 'Community Event', 'Verified Completion'],
  titles: ['Gamester', 'Goblin', 'Guild Ally'],
  cosmetics: ['Genesis Frame', 'Wave Passport Theme', 'Signal Ring']
};

export const members: NamiMember[] = [
  { id: 'm1', surfaceType: 'member', avatarSeed: 'NO', name: 'Nozomi', signal: 'Green', tier: 'Pro', badge: 'Top Helper' },
  { id: 'm2', surfaceType: 'member', avatarSeed: 'DS', name: 'DeadlySin', signal: 'Orange', tier: 'Adventurer', badge: 'Raider' },
  { id: 'm3', surfaceType: 'member', avatarSeed: 'RH', name: 'Rhokdelar', signal: 'Red', tier: 'Elite', badge: 'PvP' },
  { id: 'm4', surfaceType: 'member', avatarSeed: 'PF', name: 'PebbleFan', signal: 'Green', tier: 'NPC', badge: 'Newbie' },
  { id: 'm5', surfaceType: 'member', avatarSeed: 'MG', name: 'MutedGhost', signal: 'Black', tier: 'Adventurer', badge: 'Respawn' }
];

export const chatMessages: ChatMessage[] = [
  {
    id: 'c1',
    time: '02:22',
    author: 'Nozomi',
    signal: 'Green',
    body: 'Looking for members for tonight’s guild run.'
  },
  {
    id: 'c2',
    time: '02:23',
    author: 'DeadlySin',
    signal: 'Orange',
    body: 'Party queue open. Serious run but friendly lobby.'
  },
  {
    id: 'c3',
    time: '02:24',
    author: 'Rhokdelar',
    signal: 'Red',
    body: 'PvP room is live. High intensity only.'
  },
  {
    id: 'c4',
    time: '02:25',
    author: 'PebbleFan',
    signal: 'Green',
    body: 'NPC check-in. I am here for the cozy event board.'
  },
  {
    id: 'c5',
    time: '02:27',
    author: 'Nozomi',
    signal: 'Green',
    body: 'Official event banner just dropped. Check announcements.'
  }
];

export const navItems: Array<{
  page: NamiPage;
  label: string;
  shortLabel: string;
}> = [
  { page: 'hub', label: 'Nami Hub', shortLabel: 'Hub' },
  { page: 'userProfile', label: 'My Profile', shortLabel: 'Profile' },
  { page: 'messages', label: 'Messages', shortLabel: 'Messages' },
  { page: 'events', label: 'My Events', shortLabel: 'Events' },
  { page: 'settings', label: 'Settings', shortLabel: 'Settings' }
];
