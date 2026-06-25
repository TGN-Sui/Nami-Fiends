import { describe, expect, it } from 'vitest';

import {
  normalizeBannerShoutoutFields,
  resolveBannerShoutoutMember,
} from './channel-banner-shoutout.js';
import { members } from './uiMockData.js';

describe('channel-banner-shoutout', () => {
  it('resolves a known member id', () => {
    const member = members[0]!;

    expect(resolveBannerShoutoutMember(member.id)).toEqual({
      memberId: member.id,
      memberName: member.name,
    });
  });

  it('clears invalid shoutout ids', () => {
    expect(normalizeBannerShoutoutFields({ shoutoutMemberId: 'missing-member' })).toEqual({
      shoutoutMemberId: null,
      shoutoutMemberName: null,
    });
  });

  it('keeps valid shoutout ids and names aligned', () => {
    const member = members[1]!;

    expect(
      normalizeBannerShoutoutFields({
        shoutoutMemberId: member.id,
        shoutoutMemberName: 'stale label',
      }),
    ).toEqual({
      shoutoutMemberId: member.id,
      shoutoutMemberName: member.name,
    });
  });
});