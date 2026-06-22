import { describe, expect, it } from 'vitest';

import { ARCADE_BACKGROUND_SLOT_ID, DEFAULT_ARCADE_BACKGROUND_URL } from './arcade-background.js';
import {
  ARCADE_BACKGROUND_MEDIA_KEY,
  isArcadeBackgroundVideoRef,
  resolveArcadeBackgroundMedia,
  validateArcadeBackgroundFile,
} from './arcade-background-store.js';
import { toChannelMediaRef } from './channel-owner-media-store.js';

describe('arcade-background', () => {
  it('exposes the owner asset slot for arcade backgrounds', () => {
    expect(ARCADE_BACKGROUND_SLOT_ID).toBe('arcade-background');
    expect(ARCADE_BACKGROUND_MEDIA_KEY).toBe('nami.owner.arcade-background');
  });

  it('falls back to the bundled alley placeholder', () => {
    expect(resolveArcadeBackgroundMedia(null)).toEqual({
      kind: 'default',
      url: DEFAULT_ARCADE_BACKGROUND_URL,
    });
    expect(resolveArcadeBackgroundMedia('')).toEqual({
      kind: 'default',
      url: DEFAULT_ARCADE_BACKGROUND_URL,
    });
  });

  it('recognizes image and video stored values', () => {
    expect(resolveArcadeBackgroundMedia('data:image/png;base64,abc')).toEqual({
      kind: 'image',
      url: 'data:image/png;base64,abc',
    });

    expect(isArcadeBackgroundVideoRef(toChannelMediaRef(ARCADE_BACKGROUND_MEDIA_KEY))).toBe(true);
    expect(isArcadeBackgroundVideoRef('data:video/mp4;base64,abc')).toBe(true);
  });

  it('accepts mp4 uploads within the size limit', () => {
    const file = new File([new Uint8Array(4)], 'alley.mp4', { type: 'video/mp4' });

    expect(validateArcadeBackgroundFile(file)).toBeNull();
  });

  it('rejects oversized mp4 uploads', () => {
    const file = new File([new Uint8Array(4)], 'alley.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 49 * 1024 * 1024 });

    expect(validateArcadeBackgroundFile(file)).toContain('48 MB');
  });
});