export type ChatBorderSliceInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const CHAT_BORDER_ART_CANVAS_PX = '384 × 384 px';

export const CHAT_BORDER_ART_SLICE_DEFAULTS: ChatBorderSliceInsets = {
  top: 56,
  right: 32,
  bottom: 24,
  left: 32,
};

export const CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS: ChatBorderSliceInsets = {
  top: 28,
  right: 16,
  bottom: 12,
  left: 16,
};

export const CHAT_BORDER_ART_STATIC_MAX_BYTES = 2 * 1024 * 1024;
export const CHAT_BORDER_ART_ANIMATED_MAX_BYTES = 4 * 1024 * 1024;

export const CHAT_BORDER_STATIC_ACCEPT_LABEL = 'PNG, JPG, WebP';
export const CHAT_BORDER_ANIMATED_ACCEPT_LABEL = 'GIF, animated WebP';

export function chatBorderArtDimensionNote(): string {
  return (
    'Upload a 9-patch frame on a ' +
    CHAT_BORDER_ART_CANVAS_PX +
    ' canvas with a transparent center. Ornate crowns belong in the top slice — ' +
    'set a taller top inset so the art scales without overlapping neighbors.'
  );
}

export function normalizeChatBorderSliceInsets(
  value: Partial<ChatBorderSliceInsets> | undefined,
  fallback: ChatBorderSliceInsets
): ChatBorderSliceInsets {
  return {
    top: clampInset(value?.top, fallback.top),
    right: clampInset(value?.right, fallback.right),
    bottom: clampInset(value?.bottom, fallback.bottom),
    left: clampInset(value?.left, fallback.left),
  };
}

function clampInset(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(8, Math.min(160, Math.round(value!)));
}