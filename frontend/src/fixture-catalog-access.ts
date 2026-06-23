import { isTestLaunchMode, shouldUseDevFixtures } from './app-config.js';
import type { NamiChannel, NamiMember } from './domain/types.js';
import {
  channels as rawSeedChannels,
  members as rawSeedMembers,
} from './fixtures/seed-data.js';
import {
  testLaunchShowcaseChannels,
  testLaunchShowcaseMembers,
} from './fixtures/test-launch-showcase-catalog.js';

/** Seed catalog channels — empty when dev fixtures and test launch showcase are disabled. */
export function readSeedChannels(): NamiChannel[] {
  if (shouldUseDevFixtures()) {
    return rawSeedChannels;
  }

  if (isTestLaunchMode()) {
    return testLaunchShowcaseChannels;
  }

  return [];
}

/** Seed catalog members — empty when dev fixtures and test launch showcase are disabled. */
export function readSeedMembers(): NamiMember[] {
  if (shouldUseDevFixtures()) {
    return rawSeedMembers;
  }

  if (isTestLaunchMode()) {
    return testLaunchShowcaseMembers;
  }

  return [];
}

export function findSeedChannelById(channelId: string): NamiChannel | undefined {
  return readSeedChannels().find((channel) => channel.id === channelId);
}

export function findSeedMemberById(memberId: string): NamiMember | undefined {
  return readSeedMembers().find((member) => member.id === memberId);
}