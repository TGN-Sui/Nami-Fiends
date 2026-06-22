import type { NamiMember } from '../domain/types.js';

import {
  functionalMockSuiGameChannels,
  functionalMockSuiGameDevelopers,
} from './sui-game-catalog.js';

/** Verified members for squad invite / boost testing when full dev fixtures are off. */
export const FUNCTIONAL_MOCK_MEMBERS: NamiMember[] = [
  {
    id: 'm2',
    surfaceType: 'member',
    avatarSeed: 'HM',
    name: 'HarborMint',
    signal: 'Green',
    tier: 'Adventurer',
    badge: 'Builder',
  },
  {
    id: 'm3',
    surfaceType: 'member',
    avatarSeed: 'ZL',
    name: 'ZenithLoop',
    signal: 'Green',
    tier: 'Pro',
    badge: 'Strategist',
  },
];

export type FunctionalMockSquad = {
  id: string;
  name: string;
  memberIds: string[];
  maxSlots: number;
};

export const FUNCTIONAL_MOCK_SQUADS: FunctionalMockSquad[] = [
  {
    id: 'squad-panzerdogs-raid',
    name: 'PanzerDogs Raid Team',
    memberIds: ['m1', 'm2'],
    maxSlots: 3,
  },
  {
    id: 'squad-pawtato-land',
    name: 'Pawtato Land Crew',
    memberIds: ['m1', 'm3'],
    maxSlots: 3,
  },
];

export function functionalMockChannels() {
  return functionalMockSuiGameChannels();
}

export function functionalMockDevelopers() {
  return functionalMockSuiGameDevelopers();
}