import type { NamiChannel, NamiMember } from './uiMockData.js';

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

export function isOfficialNamiGalaxyMember(member: NamiMember): boolean {
  return isNamiBossMember(member) || isNamiTeamMember(member);
}

export function officialNamiGalaxyBadgeLabel(member: NamiMember): string | null {
  if (isNamiBossMember(member)) {
    return 'Official Nami Boss';
  }

  if (isNamiTeamMember(member)) {
    return 'Official Nami Team';
  }

  return null;
}

export function officialNamiPassportMarkLabel(member: NamiMember): string {
  if (isNamiBossMember(member)) {
    return 'Official Nami Boss Passport';
  }

  if (isNamiTeamMember(member)) {
    return 'Official Nami Team Passport';
  }

  return 'Nami Passport';
}

export function memberRainbowBorderClass(member: NamiMember): string {
  return isOfficialNamiGalaxyMember(member) ? ' is-nami-rainbow-foil-border' : '';
}