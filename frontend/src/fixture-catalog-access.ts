import { shouldUseDevFixtures } from './app-config.js';
import type { NamiChannel, NamiMember } from './domain/types.js';
import {
  channels as rawSeedChannels,
  members as rawSeedMembers,
} from './fixtures/seed-data.js';

/** Seed catalog channels — dev fixtures only; test launch uses created channels from the server. */
export function readSeedChannels(): NamiChannel[] {
  if (shouldUseDevFixtures()) {
    return rawSeedChannels;
  }

  return [];
}

/** Seed catalog members — dev fixtures only; test launch uses registered accounts from the server. */
export function readSeedMembers(): NamiMember[] {
  if (shouldUseDevFixtures()) {
    return rawSeedMembers;
  }

  return [];
}

export function findSeedChannelById(channelId: string): NamiChannel | undefined {
  return readSeedChannels().find((channel) => channel.id === channelId);
}

export function findSeedMemberById(memberId: string): NamiMember | undefined {
  return readSeedMembers().find((member) => member.id === memberId);
}