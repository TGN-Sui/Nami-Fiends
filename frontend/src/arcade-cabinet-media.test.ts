import { describe, expect, it } from 'vitest';

import {
  arcadeCabinetMediaSlotId,
  arcadeCabinetMediaStorageKey,
  isArcadeCabinetMediaSlotId,
  parseArcadeCabinetMediaSlotId,
  readArcadeCabinetPublicMediaUrl,
} from './arcade-cabinet-media.js';
import { readArcadeCabinetOwnerAssetSlots } from './arcade-cabinets.js';
import { toChannelMediaRef } from './channel-owner-media-store.js';
import {
  resolveArcadeCabinetIntroUrl,
  resolveArcadeCabinetMedia,
  resolveArcadeCabinetStageMedia,
} from './arcade-cabinet-media-store.js';
import { OFFICIAL_ARCADE_CABINETS } from './arcade-cabinets.js';

describe('arcade-cabinet-media', () => {
  it('builds owner slots for every cabinet media bundle', () => {
    expect(readArcadeCabinetOwnerAssetSlots()).toHaveLength(OFFICIAL_ARCADE_CABINETS.length * 3);
  });

  it('parses cabinet media slot ids', () => {
    expect(parseArcadeCabinetMediaSlotId('arcade-cabinet-goon-pop-intro')).toEqual({
      cabinetId: 'goon-pop',
      kind: 'intro',
    });
    expect(isArcadeCabinetMediaSlotId(arcadeCabinetMediaSlotId('alley-push', 'stage'))).toBe(true);
  });

  it('derives public intro and stage paths from cabinet id only', () => {
    expect(readArcadeCabinetPublicMediaUrl('alley-push', 'intro')).toBe(
      '/arcade/cabinets/alley-push/intro.mp4',
    );
    expect(readArcadeCabinetPublicMediaUrl('alley-push', 'stage')).toBe(
      '/arcade/cabinets/alley-push/stage.mp4',
    );
  });

  it('falls back to public cabinet media paths', () => {
    expect(resolveArcadeCabinetIntroUrl('goon-pop', null)).toBe('/arcade/cabinets/goon-pop/intro.mp4');
    expect(resolveArcadeCabinetStageMedia('goon-pop', null).url).toBe(
      '/arcade/cabinets/goon-pop/stage.mp4',
    );
    expect(resolveArcadeCabinetIntroUrl('alley-push', null)).toBe(
      '/arcade/cabinets/alley-push/intro.mp4',
    );
  });

  it('waits for owner intro uploads instead of falling back to missing public files', () => {
    const ownerRef = toChannelMediaRef(arcadeCabinetMediaStorageKey('alley-push', 'intro'));

    expect(resolveArcadeCabinetMedia('alley-push', 'intro', ownerRef)).toEqual({
      kind: 'loading',
      url: '',
    });
  });
});