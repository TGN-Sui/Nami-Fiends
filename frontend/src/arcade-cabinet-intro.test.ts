import { describe, expect, it } from 'vitest';

import { resolveArcadeCabinetIntroMedia } from './arcade-cabinet-intro.js';
import { toChannelMediaRef } from './channel-owner-media-store.js';
import { arcadeCabinetMediaStorageKey } from './arcade-cabinet-media.js';

describe('arcade-cabinet-intro', () => {
  it('falls back to the public intro after owner media is still loading', () => {
    const ownerRef = toChannelMediaRef(arcadeCabinetMediaStorageKey('alley-push', 'intro'));

    expect(resolveArcadeCabinetIntroMedia('alley-push', ownerRef, true)).toEqual({
      kind: 'video',
      url: '/arcade/cabinets/alley-push/intro.mp4',
    });
  });

  it('resolves the public intro when no owner override exists', () => {
    expect(resolveArcadeCabinetIntroMedia('alley-push', null)).toEqual({
      kind: 'video',
      url: '/arcade/cabinets/alley-push/intro.mp4',
    });
  });
});