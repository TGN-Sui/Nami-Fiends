export type ConductSignal = 'Green' | 'Orange' | 'Red' | 'Black';

export type NamiPage =
  | 'entry'
  | 'hub'
  | 'gamehub'
  | 'arcade'
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
  | 'guildDetail'
  | 'squadDetail'
  | 'messages'
  | 'messageLog'
  | 'events'
  | 'eventDetail'
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
  officialNami?: boolean;
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
  isNamiTeam?: boolean;
  isNamiBoss?: boolean;
};

export type ChatMessage = {
  id: string;
  time: string;
  author: string;
  signal: ConductSignal;
  body: string;
};

export type NavItem = {
  page: NamiPage;
  label: string;
  shortLabel: string;
};