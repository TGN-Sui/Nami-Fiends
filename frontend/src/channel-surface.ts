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

export function memberRainbowBorderClass(member: NamiMember): string {
  return isNamiTeamMember(member) ? ' is-nami-rainbow-foil-border' : '';
}