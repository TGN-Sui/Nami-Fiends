import type { ArcadeBrickedUpHazardKind } from './arcade-bricked-up-game.js';
import type { OwnerAssetSlot } from './nami-owner-assets-store.js';

export const ARCADE_BRICKED_UP_SPRITE_SLOT_PREFIX = 'arcade-bricked-up-sprite';

export type ArcadeBrickedUpSpriteSlotId =
  | 'brick'
  | 'brick-reinforced'
  | 'brick-armored'
  | 'paddle'
  | 'ball'
  | 'hazard-shard'
  | 'hazard-explosive'
  | 'mystery-drop'
  | 'projectile'
  | 'explosion';

export type ArcadeBrickedUpSpriteSlot = OwnerAssetSlot & {
  spriteId: ArcadeBrickedUpSpriteSlotId;
};

export function arcadeBrickedUpSpriteSlotId(spriteId: ArcadeBrickedUpSpriteSlotId): string {
  return ARCADE_BRICKED_UP_SPRITE_SLOT_PREFIX + '-' + spriteId;
}

export const ARCADE_BRICKED_UP_SPRITE_SLOTS: ArcadeBrickedUpSpriteSlot[] = [
  {
    spriteId: 'brick',
    id: arcadeBrickedUpSpriteSlotId('brick'),
    label: 'Bricked Up · standard brick',
    category: 'button',
    hint: '1-hit brick face. Recommended square PNG/WebP with transparent edges.',
  },
  {
    spriteId: 'brick-reinforced',
    id: arcadeBrickedUpSpriteSlotId('brick-reinforced'),
    label: 'Bricked Up · reinforced brick',
    category: 'button',
    hint: '2-hit brick face for Heat Layer and Skill diff walls.',
  },
  {
    spriteId: 'brick-armored',
    id: arcadeBrickedUpSpriteSlotId('brick-armored'),
    label: 'Bricked Up · armored brick',
    category: 'button',
    hint: '3-hit armored brick face for late Skill diff layers.',
  },
  {
    spriteId: 'paddle',
    id: arcadeBrickedUpSpriteSlotId('paddle'),
    label: 'Bricked Up · paddle',
    category: 'button',
    hint: 'Player paddle sprite. Wide horizontal PNG/WebP works best.',
  },
  {
    spriteId: 'ball',
    id: arcadeBrickedUpSpriteSlotId('ball'),
    label: 'Bricked Up · ball',
    category: 'button',
    hint: 'Main ball sprite. Square PNG/WebP; scales with enlarge power-up.',
  },
  {
    spriteId: 'hazard-shard',
    id: arcadeBrickedUpSpriteSlotId('hazard-shard'),
    label: 'Bricked Up · hazard shard',
    category: 'button',
    hint: 'Falling hazard shard. Square PNG/WebP with glow-friendly edges.',
  },
  {
    spriteId: 'hazard-explosive',
    id: arcadeBrickedUpSpriteSlotId('hazard-explosive'),
    label: 'Bricked Up · explosive hazard',
    category: 'button',
    hint: 'Spiky explosive hazard during Explosive Rain power-down only.',
  },
  {
    spriteId: 'mystery-drop',
    id: arcadeBrickedUpSpriteSlotId('mystery-drop'),
    label: 'Bricked Up · mystery drop',
    category: 'button',
    hint: 'Mystery crate that falls with hazards and from broken bricks.',
  },
  {
    spriteId: 'projectile',
    id: arcadeBrickedUpSpriteSlotId('projectile'),
    label: 'Bricked Up · shooter bolt',
    category: 'button',
    hint: 'Upward paddle shot while Shooter power-up is active.',
  },
  {
    spriteId: 'explosion',
    id: arcadeBrickedUpSpriteSlotId('explosion'),
    label: 'Bricked Up · bottom blast',
    category: 'button',
    hint: 'Explosion burst from Bottom Blast power-down.',
  },
];

export function readArcadeBrickedUpSpriteSlot(
  spriteId: ArcadeBrickedUpSpriteSlotId,
): ArcadeBrickedUpSpriteSlot {
  const slot = ARCADE_BRICKED_UP_SPRITE_SLOTS.find((candidate) => candidate.spriteId === spriteId);

  if (!slot) {
    throw new Error('Unknown Bricked Up sprite slot: ' + spriteId);
  }

  return slot;
}

export function arcadeBrickedUpHazardSpriteSlot(
  kind: ArcadeBrickedUpHazardKind,
): ArcadeBrickedUpSpriteSlotId {
  return kind === 'explosive' ? 'hazard-explosive' : 'hazard-shard';
}

export function arcadeBrickedUpHazardDisplayScale(kind: ArcadeBrickedUpHazardKind): number {
  return kind === 'explosive' ? 2.65 : 2;
}

export function arcadeBrickedUpBrickSpriteSlot(maxHp: number): ArcadeBrickedUpSpriteSlotId {
  if (maxHp >= 3) {
    return 'brick-armored';
  }

  if (maxHp >= 2) {
    return 'brick-reinforced';
  }

  return 'brick';
}