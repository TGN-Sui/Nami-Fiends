import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { giftTierLabel } from './gift-catalog.js';
import { hydrateGiftCatalog, useGiftCatalog } from './gift-catalog-store.js';
import { mockStreamGiftSenders } from './gift-mock-preview.js';
import { GiftIcon } from './GiftIcon.js';
import { triggerMockStreamGift } from './gift-store.js';
import type { NamiMember } from './uiMockData.js';

export type MockStreamGiftPanelProps = {
  streamKey: string;
  targetMember: NamiMember;
  className?: string;
  onSent?: (message: string) => void;
};

export function MockStreamGiftPanel(props: MockStreamGiftPanelProps): ReactElement {
  const catalog = useGiftCatalog();
  const senderOptions = useMemo(
    () => mockStreamGiftSenders(props.targetMember.id),
    [props.targetMember.id]
  );
  const [senderMemberId, setSenderMemberId] = useState(senderOptions[0]?.id ?? '');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void hydrateGiftCatalog();
  }, []);

  useEffect(() => {
    if (!senderOptions.some((member) => member.id === senderMemberId) && senderOptions[0]) {
      setSenderMemberId(senderOptions[0].id);
    }
  }, [senderMemberId, senderOptions]);

  const selectedSender =
    senderOptions.find((member) => member.id === senderMemberId) ?? senderOptions[0] ?? null;

  function fireMockGift(giftId: string, giftLabel: string): void {
    if (!selectedSender) {
      setStatus('No mock sender is available in the roster.');
      return;
    }

    const ok = triggerMockStreamGift({
      giftId,
      streamKey: props.streamKey,
      targetMemberId: props.targetMember.id,
      targetMemberName: props.targetMember.name,
      senderMemberId: selectedSender.id,
      senderMemberName: selectedSender.name,
    });

    const message = ok
      ? selectedSender.name + ' sent ' + giftLabel + ' on this live stream.'
      : 'Could not fire mock gift.';

    setStatus(message);
    props.onSent?.(message);
  }

  return (
    <div className={'mock-stream-gift-panel' + (props.className ? ' ' + props.className : '')}>
      <p className="mock-stream-gift-panel-copy">
        Simulate another member gifting <strong>{props.targetMember.name}</strong> during this live
        stream. No wallet or checkout required.
      </p>

      <label className="mock-stream-gift-sender-field">
        <span>Mock sender</span>
        <select
          onChange={(event) => setSenderMemberId(event.target.value)}
          value={senderMemberId}
        >
          {senderOptions.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mock-stream-gift-tier-groups">
        {(['common', 'rare', 'legendary'] as const).map((tier) => (
          <section className="mock-stream-gift-tier-group" key={tier}>
            <h4>{giftTierLabel(tier)}</h4>
            <div className="mock-stream-gift-grid">
              {catalog
                .filter((gift) => gift.tier === tier)
                .map((gift) => (
                  <button
                    className="nami-surface-button mock-stream-gift-item"
                    key={'mock-stream-' + gift.id}
                    onClick={() => fireMockGift(gift.id, gift.label)}
                    type="button"
                  >
                    <GiftIcon
                      emoji={gift.emoji}
                      iconUrl={gift.iconUrl}
                      imageClassName="mock-stream-gift-thumb"
                    />
                    <span>{gift.label}</span>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>

      {status ? <p className="mock-stream-gift-status">{status}</p> : null}
    </div>
  );
}