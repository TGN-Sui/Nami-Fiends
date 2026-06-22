import { shouldUseDevFixtures } from './app-config.js';
import type { NamiChannel, NamiMember } from './domain/types.js';
import {
  channels as rawSeedChannels,
  members as rawSeedMembers,
} from './fixtures/seed-data.js';

/** Seed catalog channels — empty when test launch or dev fixtures are disabled. */
export function readSeedChannels(): NamiChannel[] {
  return shouldUseDevFixtures() ? rawSeedChannels : [];
}

/** Seed catalog members — empty when test launch or dev fixtures are disabled. */
export function readSeedMembers(): NamiMember[] {
  return shouldUseDevFixtures() ? rawSeedMembers : [];
}

export function findSeedChannelById(channelId: string): NamiChannel | undefined {
  return readSeedChannels().find((channel) => channel.id === channelId);
}

export function findSeedMemberById(memberId: string): NamiMember | undefined {
  return readSeedMembers().find((member) => member.id === memberId);
}