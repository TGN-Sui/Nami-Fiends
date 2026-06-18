import { isMemberVerified } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

export function canPublishMemberFeed(member: NamiMember): boolean {
  return (member.tier === 'Pro' || member.tier === 'Elite') && isMemberVerified(member);
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