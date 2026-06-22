import {
  isMemberVerified,
  isOfficialOwnerSelfMember,
  isProOrHigherTier,
} from './member-access.js';
import type { NamiMember } from './uiMockData.js';

export function canPublishMemberFeed(member: NamiMember): boolean {
  if (!isMemberVerified(member)) {
    return false;
  }

  return isProOrHigherTier(member) || isOfficialOwnerSelfMember(member);
}

export function canViewMemberFeeds(viewer: NamiMember): boolean {
  return isMemberVerified(viewer);
}

export function canReportMemberFeedAbuse(reporter: NamiMember): boolean {
  return isMemberVerified(reporter);
}

export function canUseMemberFeedFeatures(member: NamiMember): boolean {
  return canPublishMemberFeed(member) || canViewMemberFeeds(member);
}