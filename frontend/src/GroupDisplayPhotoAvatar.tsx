import type { CSSProperties, ReactElement } from 'react';

import {
  resolveGroupDisplayPhotoUrl,
  useGroupDisplayPhotoVersion,
  type GroupDisplayPhotoKind,
} from './group-display-photo-store.js';

type GroupDisplayPhotoAvatarProps = {
  groupId: string;
  groupName: string;
  kind: GroupDisplayPhotoKind;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'guild' | 'squad';
};

export function GroupDisplayPhotoAvatar(props: GroupDisplayPhotoAvatarProps): ReactElement {
  useGroupDisplayPhotoVersion();

  const photoUrl = resolveGroupDisplayPhotoUrl(props.kind, props.groupId);
  const label = props.groupName.slice(0, 2).toUpperCase();
  const size = props.size ?? 'md';
  const tone = props.tone ?? (props.kind === 'guild' ? 'guild' : 'squad');

  return (
    <div
      aria-hidden="true"
      className={
        'group-display-photo-avatar group-display-photo-avatar-' +
        size +
        ' is-tone-' +
        tone +
        (photoUrl ? ' has-group-display-photo' : '')
      }
      style={
        photoUrl
          ? ({
              backgroundImage: 'url("' + photoUrl.replace(/"/g, '') + '")',
            } as CSSProperties)
          : undefined
      }
    >
      <span>{label}</span>
    </div>
  );
}