import { describe, expect, it } from 'vitest';

import {
  ARCADE_STAGE_BACKGROUND_SLOT_ID,
  ARCADE_STAGE_BACKGROUND_SPEC,
  DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
} from './arcade-stage-background.js';
import {
  ARCADE_STAGE_BACKGROUND_MEDIA_KEY,
  isArcadeStageBackgroundVideoRef,
  resolveArcadeStageBackgroundMedia,
  validateArcadeStageBackgroundFile,
} from './arcade-stage-background-store.js';
import { toChannelMediaRef } from './channel-owner-media-store.js';

describe('arcade-stage-background', () => {
  it('exposes the outer stage background slot', () => {
    expect(ARCADE_STAGE_BACKGROUND_SLOT_ID).toBe('arcade-stage-background');
    expect(ARCADE_STAGE_BACKGROUND_SPEC.slotId).toBe('arcade-stage-background');
    expect(ARCADE_STAGE_BACKGROUND_MEDIA_KEY).toBe('nami.owner.arcade-stage-background');
  });

  it('ships a bundled grid placeholder', () => {
    expect(DEFAULT_ARCADE_STAGE_BACKGROUND_URL).toContain('arcade-stage-grid-placeholder.svg');
  });

  it('falls back to the bundled grid placeholder', () => {
    expect(resolveArcadeStageBackgroundMedia(null)).toEqual({
      kind: 'default',
      url: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
    });
    expect(resolveArcadeStageBackgroundMedia('')).toEqual({
      kind: 'default',
      url: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
    });
  });

  it('recognizes image and video stored values', () => {
    expect(resolveArcadeStageBackgroundMedia('data:image/png;base64,abc')).toEqual({
      kind: 'image',
      url: 'data:image/png;base64,abc',
    });

    expect(isArcadeStageBackgroundVideoRef(toChannelMediaRef(ARCADE_STAGE_BACKGROUND_MEDIA_KEY))).toBe(
      true,
    );
    expect(isArcadeStageBackgroundVideoRef('data:video/mp4;base64,abc')).toBe(true);
  });

  it('accepts mp4 uploads within the size limit', () => {
    const file = new File([new Uint8Array(4)], 'stage.mp4', { type: 'video/mp4' });

    expect(validateArcadeStageBackgroundFile(file)).toBeNull();
  });

  it('rejects oversized mp4 uploads', () => {
    const file = new File([new Uint8Array(4)], 'stage.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 49 * 1024 * 1024 });

    expect(validateArcadeStageBackgroundFile(file)).toContain('48 MB');
  });
});