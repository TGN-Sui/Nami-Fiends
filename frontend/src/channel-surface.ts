import type { NamiChannel, NamiMember } from './uiMockData.js';

/** Exclusive owner rank label — not NPC, membership tier, or earned titles. */
export const OFFICIAL_OWNER_RANK_LABEL = 'FIEND';

export function isOfficialNamiChannel(channel: NamiChannel): boolean {
  return channel.officialNami === true || channel.partner === true;
}

export function channelRainbowBorderClass(channel: NamiChannel): string {
  return isOfficialNamiChannel(channel) ? ' is-nami-rainbow-foil-border' : '';
}

export function isNamiTeamMember(member: NamiMember): boolean {
  return member.isNamiTeam === true;
}

export function isNamiBossMember(member: NamiMember): boolean {
  return member.isNamiBoss === true;
}

export function isFiendMember(member: NamiMember): boolean {
  return isNamiBossMember(member);
}

/** Galaxy foil + rainbow borders are reserved for the official owner (FIEND). */
export function isOfficialNamiGalaxyMember(member: NamiMember): boolean {
  return isFiendMember(member);
}

export function memberDisplayRankLabel(member: NamiMember): string {
  if (isFiendMember(member)) {
    return OFFICIAL_OWNER_RANK_LABEL;
  }

  return member.tier;
}

export function officialNamiGalaxyBadgeLabel(member: NamiMember): string | null {
  if (isFiendMember(member)) {
    return OFFICIAL_OWNER_RANK_LABEL;
  }

  return null;
}

export function officialNamiTeamBadgeLabel(member: NamiMember): string | null {
  if (isNamiTeamMember(member) && !isFiendMember(member)) {
    return 'Official Nami Team';
  }

  return null;
}

export function memberProfileExclusiveBadgeLabel(member: NamiMember): string | null {
  return officialNamiGalaxyBadgeLabel(member) ?? officialNamiTeamBadgeLabel(member);
}

export function officialNamiPassportMarkLabel(member: NamiMember): string {
  if (isFiendMember(member)) {
    return OFFICIAL_OWNER_RANK_LABEL + ' Passport';
  }

  if (isNamiTeamMember(member)) {
    return 'Official Nami Team Passport';
  }

  return 'Nami Passport';
}

export function memberRainbowBorderClass(member: NamiMember): string {
  return isOfficialNamiGalaxyMember(member) ? ' is-nami-rainbow-foil-border' : '';
}