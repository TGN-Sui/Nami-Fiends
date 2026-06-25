import { members } from './uiMockData.js';

export type BannerShoutoutTarget = {
  memberId: string;
  memberName: string;
};

export function resolveBannerShoutoutMember(
  memberId: string | null | undefined,
): BannerShoutoutTarget | null {
  if (!memberId?.trim()) {
    return null;
  }

  const member = members.find((entry) => entry.id === memberId);

  if (!member) {
    return null;
  }

  return {
    memberId: member.id,
    memberName: member.name,
  };
}

export function normalizeBannerShoutoutFields(content: {
  shoutoutMemberId?: string | null;
  shoutoutMemberName?: string | null;
}): {
  shoutoutMemberId: string | null;
  shoutoutMemberName: string | null;
} {
  const resolved = resolveBannerShoutoutMember(content.shoutoutMemberId ?? null);

  if (!resolved) {
    return {
      shoutoutMemberId: null,
      shoutoutMemberName: null,
    };
  }

  return {
    shoutoutMemberId: resolved.memberId,
    shoutoutMemberName: resolved.memberName,
  };
}