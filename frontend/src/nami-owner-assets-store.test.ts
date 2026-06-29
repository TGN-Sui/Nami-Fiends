import { describe, expect, it } from 'vitest';

import { OFFICIAL_ARCADE_CABINETS } from './arcade-cabinets.js';
import {
  readArcadeOwnerAssetSlotSections,
  readArcadeOwnerAssetSlots,
  readPlatformOwnerAssetSlots,
} from './nami-owner-assets-store.js';

describe('nami-owner-assets-store', () => {
  it('keeps platform and arcade owner asset catalogs separate', () => {
    const platformSlots = readPlatformOwnerAssetSlots();
    const arcadeSlots = readArcadeOwnerAssetSlots();

    expect(platformSlots.some((slot) => slot.id === 'arcade-background')).toBe(false);
    expect(platformSlots.some((slot) => slot.id === 'arcade-lobby-music')).toBe(false);
    expect(arcadeSlots.some((slot) => slot.id === 'badge-default')).toBe(false);
    expect(arcadeSlots.some((slot) => slot.id === 'arcade-stage-background')).toBe(true);
    expect(arcadeSlots.some((slot) => slot.id === 'arcade-game-music-nami-stash-defense')).toBe(
      true,
    );
  });

  it('groups arcade media into shell, music, and cabinet sections', () => {
    const sections = readArcadeOwnerAssetSlotSections();
    const liveGameCount = OFFICIAL_ARCADE_CABINETS.filter((cabinet) => cabinet.gameId).length;

    expect(sections).toHaveLength(4);
    expect(sections[3]?.id).toBe('bricked-up-sprites');
    expect(sections[3]?.slots.length).toBeGreaterThanOrEqual(10);
    expect(sections[1]?.slots).toHaveLength(1 + liveGameCount);
    expect(sections[2]?.slots).toHaveLength(OFFICIAL_ARCADE_CABINETS.length * 3);
  });
});