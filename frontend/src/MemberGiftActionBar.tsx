import { useState, type ReactElement } from 'react';

import { GiftSendPanel } from './GiftSendPanel.js';
import { isMemberVerified } from './member-access.js';
import { useSelfMember } from './member-avatar-store.js';
import { isSelfMember } from './surface-preferences.js';
import type { NamiMember } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

export type MemberGiftActionTarget = {
  targetType: 'member' | 'stream';
  streamKey?: string;
  streamTitle?: string;
};

export function MemberGiftActionBar(props: {
  member: NamiMember;
  giftTarget?: MemberGiftActionTarget;
  className?: string;
}): ReactElement | null {
  const selfMember = useSelfMember();
  const { owner } = useProtocolOwner();
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftStatus, setGiftStatus] = useState<string | null>(null);

  const canGift =
    !isSelfMember(props.member.id) &&
    Boolean(owner?.startsWith('0x')) &&
    isMemberVerified(selfMember);

  if (!canGift) {
    return null;
  }

  const targetType = props.giftTarget?.targetType ?? 'member';

  return (
    <div className={'member-gift-action-bar' + (props.className ? ' ' + props.className : '')}>
      <button
        className={'nami-surface-button is-primary-surface-button member-gift-action-trigger' + (giftOpen ? ' is-active-surface-button' : '')}
        onClick={() => setGiftOpen((open) => !open)}
        type="button"
      >
        {giftOpen ? 'Close gifts' : 'Send gift'}
      </button>

      {giftOpen ? (
        <GiftSendPanel
          onClose={() => setGiftOpen(false)}
          onSent={(message) => {
            setGiftStatus(message);
            setGiftOpen(false);
          }}
          target={{
            targetType,
            targetMember: props.member,
            streamKey: props.giftTarget?.streamKey,
            streamTitle: props.giftTarget?.streamTitle,
          }}
        />
      ) : null}

      {giftStatus ? <p className="member-gift-action-status">{giftStatus}</p> : null}
    </div>
  );
}