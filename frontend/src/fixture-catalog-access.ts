import { shouldUseDevFixtures, shouldUseTestLaunchShowcaseCatalog } from './app-config.js';
import type { NamiChannel, NamiMember } from './domain/types.js';
import {
  testLaunchShowcaseChannels,
  testLaunchShowcaseMembers,
} from './fixtures/test-launch-showcase-catalog.js';
import {
  channels as rawSeedChannels,
  members as rawSeedMembers,
} from './fixtures/seed-data.js';

/** Seed catalog channels — dev fixtures or local testnet showcase when discovery is empty. */
export function readSeedChannels(): NamiChannel[] {
  if (shouldUseDevFixtures()) {
    return rawSeedChannels;
  }

  if (shouldUseTestLaunchShowcaseCatalog()) {
    return testLaunchShowcaseChannels;
  }

  return [];
}

/** Seed catalog members — dev fixtures or local testnet showcase when discovery is empty. */
export function readSeedMembers(): NamiMember[] {
  if (shouldUseDevFixtures()) {
    return rawSeedMembers;
  }

  if (shouldUseTestLaunchShowcaseCatalog()) {
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