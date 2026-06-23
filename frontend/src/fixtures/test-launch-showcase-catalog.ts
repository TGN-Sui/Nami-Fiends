import type { NamiChannel, NamiDeveloperProfile, NamiMember } from '../domain/types.js';
import {
  channels as seedChannels,
  developers as seedDevelopers,
  members as seedMembers,
} from './seed-data.js';

/** Game channels surfaced for testnet testers when live discovery is empty. */
const SHOWCASE_CHANNEL_IDS = [
  'fiends',
  'pebble',
  'vortex',
  'emberquest',
  'panzerdogs',
  'pawtato',
  'forgelands',
  'novasocial',
] as const;

/** Member spotlight roster — all NPC tier for tester previews. */
const SHOWCASE_MEMBER_IDS = [
  'm2',
  'm3',
  'm4',
  'm6',
  'm9',
  'm10',
  'm12',
  'm13',
  'm15',
  'm17',
  'm18',
  'm19',
] as const;

function toNpcShowcaseMember(member: NamiMember): NamiMember {
  return {
    ...member,
    tier: 'NPC',
    isNamiTeam: false,
    isNamiBoss: false,
  };
}

export const testLaunchShowcaseChannels: NamiChannel[] = seedChannels.filter((channel) =>
  (SHOWCASE_CHANNEL_IDS as readonly string[]).includes(channel.id)
);

export const testLaunchShowcaseMembers: NamiMember[] = seedMembers
  .filter((member) => (SHOWCASE_MEMBER_IDS as readonly string[]).includes(member.id))
  .map(toNpcShowcaseMember);

const showcaseChannelIdSet = new Set<string>(SHOWCASE_CHANNEL_IDS);

export const testLaunchShowcaseDevelopers: NamiDeveloperProfile[] = seedDevelopers.filter(
  (developer) => developer.gameIds.some((gameId) => showcaseChannelIdSet.has(gameId))
);