import type { CSSProperties } from 'react';

import {
  CHAT_BORDER_ART_SLICE_DEFAULTS,
  CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS,
  type ChatBorderSliceInsets,
  normalizeChatBorderSliceInsets,
} from './chat-border-art-specs.js';
import type { OfficialChatOverlayReward } from './official-chat-overlay-rewards-store.js';

export type ChatBorderPresentation = {
  className: string;
  style: CSSProperties;
  hasCustomArt: boolean;
  artUrl: string | null;
};

export function resolveChatBorderArtUrl(reward: OfficialChatOverlayReward): string | null {
  if (reward.motion === 'premium-loop' && reward.animatedArtUrl) {
    return reward.animatedArtUrl;
  }

  return reward.staticArtUrl ?? reward.animatedArtUrl ?? null;
}

export function borderImageSliceValue(insets: ChatBorderSliceInsets): string {
  return insets.top + ' ' + insets.right + ' ' + insets.bottom + ' ' + insets.left + ' fill';
}

export function borderWidthValue(insets: ChatBorderSliceInsets): string {
  return insets.top + 'px ' + insets.right + 'px ' + insets.bottom + 'px ' + insets.left + 'px';
}

export function buildChatBorderPresentation(
  reward: OfficialChatOverlayReward,
  fallbackClassName: string
): ChatBorderPresentation {
  const artUrl = resolveChatBorderArtUrl(reward);

  if (!artUrl) {
    return {
      className: fallbackClassName,
      style: {},
      hasCustomArt: false,
      artUrl: null,
    };
  }

  const sliceInsets = normalizeChatBorderSliceInsets(
    reward.artSliceInsets,
    CHAT_BORDER_ART_SLICE_DEFAULTS
  );
  const displayWidths = normalizeChatBorderSliceInsets(
    reward.displayWidths,
    CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS
  );

  return {
    className: 'has-chat-custom-border-art',
    style: {
      borderStyle: 'solid',
      borderColor: 'transparent',
      borderWidth: borderWidthValue(displayWidths),
      borderImageSource: 'url(' + artUrl + ')',
      borderImageSlice: borderImageSliceValue(sliceInsets),
      borderImageWidth: borderWidthValue(displayWidths),
      borderImageRepeat: 'stretch',
      borderImageOutset: 0,
    },
    hasCustomArt: true,
    artUrl,
  };
}