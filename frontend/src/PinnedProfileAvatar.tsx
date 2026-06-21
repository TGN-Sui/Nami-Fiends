import { type CSSProperties, type ReactElement } from 'react';
import { isOfficialNamiGalaxyMember, memberRainbowBorderClass } from './channel-surface.js';
import { DEFAULT_MEMBER_AVATAR_PLACEHOLDER_URL } from './default-member-avatar-placeholder.js';
import { MemberStreamingLiveDot, signalClass } from './member-avatar.js';
import { resolveMemberAvatarImageUrl, useSelfMember } from './member-avatar-store.js';
import { resolveOwnerAssetUrl } from './nami-owner-edit-mode-store.js';
import { useNamiOwnerAssets } from './nami-owner-assets-store.js';
import { useMemberStreamingOnline } from './member-online-store.js';


type PinnedProfileAvatarProps = {
  level: number;
};

function pinnedAvatarStyle(avatarImageUrl: string | null): CSSProperties {
  if (!avatarImageUrl) {
    return {
      '--member-avatar-image': 'none',
      '--member-avatar-image-opacity': '0',
    } as CSSProperties;
  }
  const cssUrl = 'url("' + avatarImageUrl.replace(/"/g, '\\u0022') + '")';
  return {
    '--member-avatar-image': cssUrl,
    '--member-avatar-image-opacity': '1',
  } as CSSProperties;
}

export function PinnedProfileAvatar(props: PinnedProfileAvatarProps): ReactElement {
  const member = useSelfMember();
  const persistedAssets = useNamiOwnerAssets();
  const avatarImageUrl =
    resolveMemberAvatarImageUrl(member) ??
    resolveOwnerAssetUrl('default-member-avatar', persistedAssets) ??
    DEFAULT_MEMBER_AVATAR_PLACEHOLDER_URL;

  const isStreamingOnline = useMemberStreamingOnline(member.id);

  const rainbowClass = isOfficialNamiGalaxyMember(member)
    ? 'is-nami-rainbow-foil-border is-fiend-rainbow'
    : memberRainbowBorderClass(member);

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
          (avatarImageUrl ? ' has-pinned-avatar-photo has-member-avatar-image' : '') +
          ' ' + rainbowClass
        }
        style={pinnedAvatarStyle(avatarImageUrl)}
      >
        {!avatarImageUrl ? (
          <span className="pinned-profile-avatar-initials">{member.name.slice(0, 2).toUpperCase()}</span>
        ) : null}
      </div>
      <strong className="pinned-profile-level-chip">{props.level}</strong>
      <MemberStreamingLiveDot memberId={member.id} />
    </div>
  );
}