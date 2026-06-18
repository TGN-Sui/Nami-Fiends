import type { ChatMessage, NamiChannel, NamiDeveloperProfile, NamiMember, UserProfile } from '../domain/types.js';

export const emptyChannels: NamiChannel[] = [];
export const emptyDevelopers: NamiDeveloperProfile[] = [];
export const emptyMembers: NamiMember[] = [];
export const emptyChatMessages: ChatMessage[] = [];

export function createEmptyUserProfile(): UserProfile {
  return {
    displayName: '',
    handle: '',
    wallet: '',
    passportId: '',
    tier: 'NPC',
    level: 1,
    xp: 0,
    reputation: '',
    conductSignal: 'Green',
    bio: '',
    favoritePlatforms: [],
    ownedBadges: [],
    titles: [],
    cosmetics: [],
  };
}