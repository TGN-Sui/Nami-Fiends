import type { ReactElement } from 'react';

import { ChatBorderArtFrame } from './ChatBorderArtFrame.js';
import { buildChatBorderPresentation } from './chat-border-rendering.js';
import {
  overlayRewardClassName,
  unlockedChatOverlayRewardsForMember,
  type ResolvedChatOverlay,
} from './chat-overlay-rewards.js';
import {
  useOfficialChatOverlayRewards,
  type OfficialChatOverlayReward,
} from './official-chat-overlay-rewards-store.js';
import type { NamiMember } from './uiMockData.js';

function ChatOverlayEquipPreview(props: {
  reward?: OfficialChatOverlayReward;
}): ReactElement {
  if (!props.reward) {
    return (
      <div className="chat-overlay-equip-preview-bubble message-bubble">
        <span className="chat-overlay-equip-preview-copy">Hi</span>
      </div>
    );
  }

  const presentation = buildChatBorderPresentation(
    props.reward,
    overlayRewardClassName(props.reward)
  );

  if (presentation.hasCustomArt && presentation.renderMode === 'nine-slice-animated') {
    return (
      <ChatBorderArtFrame
        className={'chat-overlay-equip-preview-bubble message-bubble ' + presentation.className}
        presentation={presentation}
      >
        <span className="chat-overlay-equip-preview-copy">Hi</span>
      </ChatBorderArtFrame>
    );
  }

  return (
    <div
      className={
        'chat-overlay-equip-preview-bubble message-bubble ' +
        (presentation.hasCustomArt ? presentation.className : overlayRewardClassName(props.reward))
      }
      style={presentation.hasCustomArt ? presentation.style : undefined}
    >
      <span className="chat-overlay-equip-preview-copy">Hi</span>
    </div>
  );
}

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
        <ChatOverlayEquipPreview />
        <span className="chat-overlay-equip-option-label">Default bubble</span>
        <small>Plain chat bubble</small>
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
          <ChatOverlayEquipPreview reward={reward} />
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