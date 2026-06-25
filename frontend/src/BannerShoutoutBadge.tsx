import type { ReactElement } from 'react';

import type { BannerShoutoutTarget } from './channel-banner-shoutout.js';

export function BannerShoutoutBadge(props: {
  shoutout: BannerShoutoutTarget;
  onOpenMember?: (memberId: string) => void;
}): ReactElement {
  const label = 'Shoutout · ' + props.shoutout.memberName;

  if (!props.onOpenMember) {
    return (
      <span className="channel-banner-shoutout-badge" title={label}>
        <span className="mini-badge">Shoutout</span>
        <strong>{props.shoutout.memberName}</strong>
      </span>
    );
  }

  return (
    <button
      className="channel-banner-shoutout-badge is-clickable-banner-shoutout"
      onClick={(event) => {
        event.stopPropagation();
        props.onOpenMember?.(props.shoutout.memberId);
      }}
      title={'Open ' + props.shoutout.memberName + ' profile'}
      type="button"
    >
      <span className="mini-badge">Shoutout</span>
      <strong>{props.shoutout.memberName}</strong>
    </button>
  );
}