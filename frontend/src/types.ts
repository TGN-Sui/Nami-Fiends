export type MembershipTier = 'NPC' | 'Adventurer' | 'Pro' | 'Elite';

export type ConductSignal = 'Green' | 'Orange' | 'Red' | 'Black';

export interface PassportSummary {
  owner: string;
  passportId: string;
  identityId: string;
  level: number;
  xp: number;
  reputation: string;
  membershipTier: MembershipTier;
  conductSignal: ConductSignal;
}

export interface ProfileSummary {
  displayName: string;
  bio: string;
  avatarRef: string;
  isPublic: boolean;
}

export interface BadgeSummary {
  label: string;
  badgeType: string;
  points: number;
}

export interface TitleSummary {
  label: string;
  equipped: boolean;
}

export interface CosmeticSummary {
  label: string;
  cosmeticType: string;
  equipped: boolean;
}

export interface ChannelSummary {
  name: string;
  verified: boolean;
  allowNpcChat: boolean;
}

export interface CommunitySummary {
  squads: number;
  guilds: number;
}