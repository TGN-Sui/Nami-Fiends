import { describe, expect, it } from 'vitest';

import {
  borderImageSliceValue,
  borderWidthValue,
  buildChatBorderPresentation,
  buildChatBorderTileStyles,
  resolveBorderArtUrl,
  resolveChatBorderArtUrl,
  usesAnimatedChatBorderRendering,
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

  it('prefers Walrus quilt refs over legacy render URLs', () => {
    const reward = sampleReward({
      staticArtUrl: 'https://nami-backend.example/api/media/files/0xabc/border-art.png',
      staticArtRef: {
        kind: 'walrus-quilt-patch',
        quiltBlobId: 'quilt-blob-123',
        patchId: 'quilt-blob-123PATCH001',
        aggregatorBase: 'https://aggregator.walrus-testnet.walrus.space',
        contentHash: 'abc123',
        contentType: 'image/png',
        rewardId: 'overlay-test',
        artKind: 'static',
        catalogVersionMs: 1,
      },
    });

    expect(resolveBorderArtUrl(reward, 'static')).toBe(
      'https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id/quilt-blob-123PATCH001'
    );
    expect(buildChatBorderPresentation(reward, 'message-bubble').artUrl).toContain('by-quilt-patch-id');
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
    expect(presentation.renderMode).toBe('border-image');
  });

  it('uses nine-slice animated rendering for premium-loop animated art', () => {
    const reward = sampleReward({
      motion: 'premium-loop',
      animatedArtUrl: 'https://cdn.example.com/animated.gif',
    });

    expect(usesAnimatedChatBorderRendering(reward)).toBe(true);

    const presentation = buildChatBorderPresentation(reward, 'message-bubble');

    expect(presentation.renderMode).toBe('nine-slice-animated');
    expect(presentation.className).toContain('has-chat-animated-border-art');
    expect(String(presentation.tileStyles.n?.backgroundImage)).toContain('animated.gif');
    expect(presentation.style.gridTemplateColumns).toContain('16px');
  });

  it('builds repeatable edge tiles for animated border frames', () => {
    const tiles = buildChatBorderTileStyles({
      artUrl: 'https://cdn.example.com/frame.gif',
      sliceInsets: { ...CHAT_BORDER_ART_SLICE_DEFAULTS },
      displayWidths: { ...CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS },
    });

    expect(tiles.n.backgroundRepeat).toBe('repeat-x');
    expect(tiles.w.backgroundRepeat).toBe('repeat-y');
    expect(String(tiles.ne.backgroundPosition)).toContain('-352px');
  });
});