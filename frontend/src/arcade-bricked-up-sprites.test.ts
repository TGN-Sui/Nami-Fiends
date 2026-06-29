import { describe, expect, it } from 'vitest';

import {
  ARCADE_BRICKED_UP_SPRITE_SLOTS,
  arcadeBrickedUpBrickSpriteSlot,
  arcadeBrickedUpSpriteSlotId,
  readArcadeBrickedUpSpriteSlot,
} from './arcade-bricked-up-sprites.js';
import { readArcadeOwnerAssetSlots } from './nami-owner-assets-store.js';

describe('arcade-bricked-up-sprites', () => {
  it('registers every gameplay sprite slot for owner uploads', () => {
    const arcadeSlots = readArcadeOwnerAssetSlots();

    for (const slot of ARCADE_BRICKED_UP_SPRITE_SLOTS) {
      expect(arcadeSlots.some((candidate) => candidate.id === slot.id)).toBe(true);
      expect(readArcadeBrickedUpSpriteSlot(slot.spriteId).id).toBe(slot.id);
    }
  });

  it('maps brick durability tiers to distinct sprite slots', () => {
    expect(arcadeBrickedUpBrickSpriteSlot(1)).toBe('brick');
    expect(arcadeBrickedUpBrickSpriteSlot(2)).toBe('brick-reinforced');
    expect(arcadeBrickedUpBrickSpriteSlot(3)).toBe('brick-armored');
    expect(arcadeBrickedUpSpriteSlotId('paddle')).toBe('arcade-bricked-up-sprite-paddle');
  });
});