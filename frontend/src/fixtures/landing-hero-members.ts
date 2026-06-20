import type { NamiMember } from '../domain/types.js';
import { members as seedMembers } from './seed-data.js';

/** Marketing-only passport samples — always available, even when DEV_FIXTURES is off. */
export const LANDING_HERO_OFFICIAL_MEMBER: NamiMember =
  seedMembers.find((member) => member.isNamiTeam) ?? seedMembers[0]!;

export const LANDING_HERO_ELITE_MEMBER: NamiMember =
  seedMembers.find((member) => member.tier === 'Elite' && member.signal === 'Green') ??
  seedMembers.find((member) => member.tier === 'Elite') ??
  seedMembers[7]!;

export const LANDING_HERO_PRO_MEMBER: NamiMember =
  seedMembers.find((member) => member.tier === 'Pro' && member.signal === 'Green' && !member.isNamiTeam) ??
  seedMembers.find((member) => member.tier === 'Pro' && !member.isNamiTeam) ??
  seedMembers[9]!;