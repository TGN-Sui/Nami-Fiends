import { useEffect, type ReactElement } from 'react';

import { GiftIcon } from './GiftIcon.js';
import { recentGiftsForMember, syncGiftShowcase, useGiftShowcase } from './gift-store.js';

type GiftShowcaseRowProps = {
  memberId: string;
  memberName: string;
};

export function GiftShowcaseRow(props: GiftShowcaseRowProps): ReactElement | null {
  useGiftShowcase();

  useEffect(() => {
    void syncGiftShowcase({ memberId: props.memberId, limit: 12 });
  }, [props.memberId]);

  const gifts = recentGiftsForMember(props.memberId);

  if (gifts.length === 0) {
    return null;
  }

  return (
    <section className="member-profile-gift-showcase">
      <div className="member-profile-gift-showcase-head">
        <strong>Recent gifts</strong>
        <small>{props.memberName} received</small>
      </div>
      <div className="member-profile-gift-showcase-row">
        {gifts.slice(0, 8).map((gift) => (
          <article
            className={
              'member-profile-gift-chip member-profile-gift-chip-' + gift.giftTier
            }
            key={gift.id}
            title={
              gift.senderMemberName +
              ' sent ' +
              gift.giftLabel +
              ' · ' +
              gift.goonAmount.toLocaleString() +
              ' $GOON'
            }
          >
            <GiftIcon
              className="member-profile-gift-chip-emoji"
              emoji={gift.giftEmoji}
              iconUrl={gift.giftIconUrl}
              imageClassName="member-profile-gift-chip-icon"
            />
            <span className="member-profile-gift-chip-label">{gift.giftLabel}</span>
            <small>{gift.senderMemberName}</small>
          </article>
        ))}
      </div>
    </section>
  );
}