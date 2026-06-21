export type {
  ChannelModule,
  ChatMessage,
  ConductSignal,
  NamiChannel,
  NamiDeveloperProfile,
  NamiMember,
  NamiPage,
  NavItem,
  UserProfile,
  VerifiedLink,
} from './domain/types.js';

export { navItems } from './domain/navigation.js';

import { shouldUseDevFixtures } from './app-config.js';
import {
  createEmptyUserProfile,
  emptyChannels,
  emptyChatMessages,
  emptyDevelopers,
} from './fixtures/empty-catalog.js';
import { createShellDeveloper, createShellSelfMember } from './fixtures/shell-catalog.js';
import {
  channels as seedChannels,
  chatMessages as seedChatMessages,
  developers as seedDevelopers,
  members as seedMembers,
  userProfile as seedUserProfile,
} from './fixtures/seed-data.js';

const fixturesEnabled = shouldUseDevFixtures();

export const channels = fixturesEnabled ? seedChannels : emptyChannels;
export const developers = fixturesEnabled ? seedDevelopers : [createShellDeveloper()];
export const members = fixturesEnabled ? seedMembers : [createShellSelfMember()];
export const chatMessages = fixturesEnabled ? seedChatMessages : emptyChatMessages;
export const userProfile = fixturesEnabled ? seedUserProfile : createEmptyUserProfile();