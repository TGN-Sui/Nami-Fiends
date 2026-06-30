import {
  isLocalDevEnvironment,
  isMockMembershipCheckoutEnabled,
  readAppConfig,
  type AppConfig,
} from './app-config.js';
import { SELF_MEMBER_ID } from './member-access.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { members, type NamiMember } from './uiMockData.js';

/** Dev / fixture builds can simulate live-stream gifts without wallet checkout. */
export function canMockStreamGifts(config: AppConfig = readAppConfig()): boolean {
  if (isLocalDevEnvironment(config)) {
    return true;
  }

  if (isMockMembershipCheckoutEnabled(config)) {
    return true;
  }

  return config.devFixtures;
}

/** Official owner catalog preview — still gated to the configured owner wallet. */
export function canPreviewMockStreamGifts(owner: string | null | undefined): boolean {
  if (!isOfficialOwner(owner ?? null)) {
    return false;
  }

  return canMockStreamGifts();
}

export function mockStreamGiftSenders(targetMemberId: string): NamiMember[] {
  return members.filter(
    (member) =>
      member.id !== targetMemberId &&
      member.id !== SELF_MEMBER_ID &&
      member.signal !== 'Black'
  );
}