import { describe, expect, it } from 'vitest';

import {
  borderImageSliceValue,
  borderWidthValue,
  buildChatBorderPresentation,
  resolveChatBorderArtUrl,
} from './chat-border-rendering.js';
import {
  CHAT_BORDER_ART_SLICE_DEFAULTS,
  CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS,
} from './chat-border-art-specs.js';
import type { OfficialChatOverlayReward } from './official-chat-overlay-rewards-store.js';

function sampleReward(
  patch: Partial<OfficialChatOverlayReward> = {}
): OfficialChatOverlayReward {
  return {
    id: 'overlay-test',
    name: 'Test Frame',
    description: 'Test',
    borderStyle: 'wave-frame',
    motion: 'static',
    accent: 'cyan',
    staticArtUrl: 'https://cdn.example.com/frame.png',
    animatedArtUrl: null,
    artSliceInsets: { ...CHAT_BORDER_ART_SLICE_DEFAULTS },
    displayWidths: { ...CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS },
    condition: { type: 'verified' },
    enabled: true,
    updatedAtMs: 1,
    ...patch,
  };
}

describe('chat-border-rendering', () => {
  it('prefers animated art for premium-loop rewards', () => {
    const reward = sampleReward({
      motion: 'premium-loop',
      staticArtUrl: 'https://cdn.example.com/static.png',
      animatedArtUrl: 'https://cdn.example.com/animated.gif',
    });

    expect(resolveChatBorderArtUrl(reward)).toBe('https://cdn.example.com/animated.gif');
  });

  it('builds border-image presentation when art URLs exist', () => {
    const presentation = buildChatBorderPresentation(sampleReward(), 'message-bubble');

    expect(presentation.hasCustomArt).toBe(true);
    expect(presentation.className).toBe('has-chat-custom-border-art');
    expect(String(presentation.style.borderImageSource)).toContain('frame.png');
    expect(presentation.style.borderImageSlice).toBe(
      borderImageSliceValue(CHAT_BORDER_ART_SLICE_DEFAULTS)
    );
    expect(presentation.style.borderWidth).toBe(
      borderWidthValue(CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS)
    );
  });

  it('falls back to CSS classes when art is missing', () => {
    const presentation = buildChatBorderPresentation(
      sampleReward({ staticArtUrl: null, animatedArtUrl: null }),
      'message-bubble is-pro'
    );

    expect(presentation.hasCustomArt).toBe(false);
    expect(presentation.className).toBe('message-bubble is-pro');
    expect(presentation.style).toEqual({});
  });
});