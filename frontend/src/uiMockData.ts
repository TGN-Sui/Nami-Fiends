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

import type { NamiChannel, NamiDeveloperProfile, NamiMember } from './domain/types.js';
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

function resolveChannels(): NamiChannel[] {
  if (fixturesEnabled) {
    return seedChannels;
  }

  return emptyChannels;
}

function resolveDevelopers(): NamiDeveloperProfile[] {
  if (fixturesEnabled) {
    return seedDevelopers;
  }

  return [createShellDeveloper()];
}

function resolveMembers(): NamiMember[] {
  if (fixturesEnabled) {
    return seedMembers;
  }

  return [createShellSelfMember()];
}

export const channels = resolveChannels();
export const developers = resolveDevelopers();
export const members = resolveMembers();
export const chatMessages = fixturesEnabled ? seedChatMessages : emptyChatMessages;
export const userProfile = fixturesEnabled ? seedUserProfile : createEmptyUserProfile();