export const NAMI_MODULES = [
  'admin',
  'appeals',
  'badge',
  'badge_issuer',
  'boost',
  'channel',
  'channel_access',
  'conduct',
  'cosmetics',
  'errors',
  'guild',
  'identity',
  'jury',
  'membership',
  'moderation',
  'passport',
  'profile',
  'recovery',
  'squad',
  'title',
  'verification'
] as const;

export type NamiModule = (typeof NAMI_MODULES)[number];

export const NAMI_CORE_OBJECTS = {
  identity: 'Identity',
  passport: 'Passport',
  profile: 'Profile',
  conductStatus: 'ConductStatus',
  channel: 'Channel',
  channelAccessPolicy: 'ChannelAccessPolicy',
  guild: 'Guild',
  squad: 'Squad',
  titleDisplay: 'TitleDisplay',
  earnedTitle: 'EarnedTitle',
  cosmeticLoadout: 'CosmeticLoadout',
  cosmeticUnlock: 'CosmeticUnlock',
  recoveryRequest: 'RecoveryRequest',
  adminCap: 'AdminCap'
} as const;