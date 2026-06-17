import { type CSSProperties, type ReactElement } from 'react';

import { memberRainbowBorderClass } from './channel-surface.js';
import { MemberStreamingLiveDot, signalClass } from './member-avatar.js';
import { useSelfAvatarImageUrl, useSelfMember } from './member-avatar-store.js';
import { useMemberStreamingOnline } from './member-online-store.js';

type PinnedProfileAvatarProps = {
  level: number;
};

function pinnedAvatarBackground(avatarImageUrl: string | null): CSSProperties | undefined {
  if (!avatarImageUrl) {
    return undefined;
  }

  return {
    backgroundImage: 'url(' + JSON.stringify(avatarImageUrl) + ')',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  };
}

export function PinnedProfileAvatar(props: PinnedProfileAvatarProps): ReactElement {
  const member = useSelfMember();
  const avatarImageUrl = useSelfAvatarImageUrl();
  const isStreamingOnline = useMemberStreamingOnline(member.id);

  return (
    <div
      className={
        'pinned-profile-avatar-shell member-avatar-live-shell is-pinned-profile-avatar-shell' +
        (isStreamingOnline ? ' has-member-streaming-live' : '')
      }
    >
      <div
        className={
          'pinned-profile-avatar ' +
          signalClass(member.signal) +
          (avatarImageUrl ? ' has-pinned-avatar-photo' : '') +
          memberRainbowBorderClass(member)
        }
        style={pinnedAvatarBackground(avatarImageUrl)}
      >
        {!avatarImageUrl ? (
          <span className="pinned-profile-avatar-initials">{member.name.slice(0, 2).toUpperCase()}</span>
        ) : null}
        <strong className="pinned-profile-level-chip">{props.level}</strong>
      </div>
      <MemberStreamingLiveDot memberId={member.id} />
    </div>
  );
}