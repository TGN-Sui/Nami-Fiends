import type { CSSProperties } from 'react';

import {
  CHAT_BORDER_ART_CANVAS_SIZE,
  CHAT_BORDER_ART_SLICE_DEFAULTS,
  CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS,
  type ChatBorderSliceInsets,
  normalizeChatBorderSliceInsets,
} from './chat-border-art-specs.js';
import type { OfficialChatOverlayReward } from './official-chat-overlay-rewards-store.js';
import {
  buildBorderArtUrlFromRef,
  isWalrusAggregatorUrl,
  type WalrusQuiltPatchRef,
} from './walrus-quilt-patch-ref.js';

export { buildAggregatorPatchUrl, buildBorderArtUrlFromRef } from './walrus-quilt-patch-ref.js';

export type ChatBorderTileId = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export type ChatBorderRenderMode = 'border-image' | 'nine-slice-animated';

export type ChatBorderPresentation = {
  className: string;
  style: CSSProperties;
  hasCustomArt: boolean;
  artUrl: string | null;
  renderMode: ChatBorderRenderMode;
  sliceInsets: ChatBorderSliceInsets;
  displayWidths: ChatBorderSliceInsets;
  canvasSize: number;
  tileStyles: Partial<Record<ChatBorderTileId, CSSProperties>>;
};

export function resolveBorderArtUrl(
  reward: OfficialChatOverlayReward,
  kind: 'static' | 'animated'
): string | null {
  const ref: WalrusQuiltPatchRef | null | undefined =
    kind === 'static' ? reward.staticArtRef : reward.animatedArtRef;

  if (ref?.patchId) {
    return buildBorderArtUrlFromRef(ref);
  }

  const url = kind === 'static' ? reward.staticArtUrl : reward.animatedArtUrl;

  if (!url?.trim()) {
    return null;
  }

  const trimmed = url.trim();

  if (isWalrusAggregatorUrl(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

export function resolveChatBorderArtUrl(reward: OfficialChatOverlayReward): string | null {
  if (reward.motion === 'premium-loop') {
    return resolveBorderArtUrl(reward, 'animated') ?? resolveBorderArtUrl(reward, 'static');
  }

  return resolveBorderArtUrl(reward, 'static') ?? resolveBorderArtUrl(reward, 'animated');
}

export function usesAnimatedChatBorderRendering(reward: OfficialChatOverlayReward): boolean {
  return reward.motion === 'premium-loop' && Boolean(resolveBorderArtUrl(reward, 'animated'));
}

export function borderImageSliceValue(insets: ChatBorderSliceInsets): string {
  return insets.top + ' ' + insets.right + ' ' + insets.bottom + ' ' + insets.left + ' fill';
}

export function borderWidthValue(insets: ChatBorderSliceInsets): string {
  return insets.top + 'px ' + insets.right + 'px ' + insets.bottom + 'px ' + insets.left + 'px';
}

function tileBackground(artUrl: string, canvasSize: number): Pick<CSSProperties, 'backgroundImage' | 'backgroundSize'> {
  return {
    backgroundImage: 'url(' + artUrl + ')',
    backgroundSize: canvasSize + 'px ' + canvasSize + 'px',
  };
}

export function buildChatBorderTileStyles(input: {
  artUrl: string;
  sliceInsets: ChatBorderSliceInsets;
  displayWidths: ChatBorderSliceInsets;
  canvasSize?: number;
}): Record<ChatBorderTileId, CSSProperties> {
  const canvasSize = input.canvasSize ?? CHAT_BORDER_ART_CANVAS_SIZE;
  const slice = input.sliceInsets;
  const display = input.displayWidths;
  const background = tileBackground(input.artUrl, canvasSize);
  const rightOffset = -(canvasSize - slice.right);
  const bottomOffset = -(canvasSize - slice.bottom);

  return {
    nw: {
      ...background,
      width: display.left + 'px',
      height: display.top + 'px',
      backgroundPosition: '0 0',
      backgroundRepeat: 'no-repeat',
    },
    n: {
      ...background,
      height: display.top + 'px',
      backgroundPosition: '-' + slice.left + 'px 0',
      backgroundRepeat: 'repeat-x',
    },
    ne: {
      ...background,
      width: display.right + 'px',
      height: display.top + 'px',
      backgroundPosition: rightOffset + 'px 0',
      backgroundRepeat: 'no-repeat',
    },
    w: {
      ...background,
      width: display.left + 'px',
      backgroundPosition: '0 -' + slice.top + 'px',
      backgroundRepeat: 'repeat-y',
    },
    e: {
      ...background,
      width: display.right + 'px',
      backgroundPosition: rightOffset + 'px -' + slice.top + 'px',
      backgroundRepeat: 'repeat-y',
    },
    sw: {
      ...background,
      width: display.left + 'px',
      height: display.bottom + 'px',
      backgroundPosition: '0 ' + bottomOffset + 'px',
      backgroundRepeat: 'no-repeat',
    },
    s: {
      ...background,
      height: display.bottom + 'px',
      backgroundPosition: '-' + slice.left + 'px ' + bottomOffset + 'px',
      backgroundRepeat: 'repeat-x',
    },
    se: {
      ...background,
      width: display.right + 'px',
      height: display.bottom + 'px',
      backgroundPosition: rightOffset + 'px ' + bottomOffset + 'px',
      backgroundRepeat: 'no-repeat',
    },
  };
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
      renderMode: 'border-image',
      sliceInsets: { ...CHAT_BORDER_ART_SLICE_DEFAULTS },
      displayWidths: { ...CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS },
      canvasSize: CHAT_BORDER_ART_CANVAS_SIZE,
      tileStyles: {},
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
  const tileStyles = buildChatBorderTileStyles({
    artUrl,
    sliceInsets,
    displayWidths,
  });

  if (usesAnimatedChatBorderRendering(reward)) {
    return {
      className: 'has-chat-custom-border-art has-chat-animated-border-art',
      style: {
        gridTemplateColumns:
          displayWidths.left + 'px 1fr ' + displayWidths.right + 'px',
        gridTemplateRows:
          displayWidths.top + 'px 1fr ' + displayWidths.bottom + 'px',
      },
      hasCustomArt: true,
      artUrl,
      renderMode: 'nine-slice-animated',
      sliceInsets,
      displayWidths,
      canvasSize: CHAT_BORDER_ART_CANVAS_SIZE,
      tileStyles,
    };
  }

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
    renderMode: 'border-image',
    sliceInsets,
    displayWidths,
    canvasSize: CHAT_BORDER_ART_CANVAS_SIZE,
    tileStyles,
  };
}