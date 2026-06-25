import type { ReactElement } from 'react';

import {
  unlockedChatOverlayRewardsForMember,
  type ResolvedChatOverlay,
} from './chat-overlay-rewards.js';
import { useOfficialChatOverlayRewards } from './official-chat-overlay-rewards-store.js';
import type { NamiMember } from './uiMockData.js';

export function ChatOverlayEquipPicker(props: {
  member: NamiMember;
  selectedOverlayId: string;
  onSelect: (overlayId: string) => void;
}): ReactElement {
  const catalog = useOfficialChatOverlayRewards();
  const unlocked = unlockedChatOverlayRewardsForMember(props.member, catalog);

  if (unlocked.length === 0) {
    return (
      <p className="protocol-hint">
        No chat overlays unlocked yet. Verify your passport or climb membership tiers to earn rewards.
      </p>
    );
  }

  return (
    <div className="chat-overlay-equip-grid" role="list">
      <button
        aria-pressed={!props.selectedOverlayId}
        className={
          'nami-surface-button chat-overlay-equip-option' +
          (!props.selectedOverlayId ? ' is-active-view' : '')
        }
        onClick={() => props.onSelect('')}
        type="button"
      >
        Default bubble
      </button>
      {unlocked.map((reward) => (
        <button
          aria-pressed={props.selectedOverlayId === reward.id}
          className={
            'nami-surface-button chat-overlay-equip-option' +
            (props.selectedOverlayId === reward.id ? ' is-active-view' : '')
          }
          key={reward.id}
          onClick={() => props.onSelect(reward.id)}
          type="button"
        >
          <span className="chat-overlay-equip-option-label">{reward.name}</span>
          <small>
            {reward.borderStyle.replace('-', ' ')} ·{' '}
            {reward.motion === 'premium-loop' ? 'Premium loop' : 'Static border'}
          </small>
        </button>
      ))}
    </div>
  );
}

export function chatOverlayPreviewLabel(overlay: ResolvedChatOverlay | null): string {
  return overlay ? overlay.name + ' · ' + overlay.borderStyle : 'Default bubble';
}