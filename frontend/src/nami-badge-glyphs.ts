import type { CollectedBadge } from './global-chats.js';
import { ownerAssetBadgeSlotId } from './nami-owner-assets-store.js';
import { resolveOwnerAssetUrl } from './nami-owner-edit-mode-store.js';

const BADGE_GLYPHS: Record<string, string> = {
  'First Quest': '◇',
  'Community Event': '✦',
  'Verified Completion': '✓',
  'Raid Captain': '⚔',
  'Patch Loyalist': '▣',
  'Guild Herald': '⬡',
  'Season Closer': '★',
  'Signal Guardian': '◎',
  'Creator Ally': 'N',
  'Arena Victor': '▲',
  'Night Owl': '☾',
  'Quest Runner': '→',
  'Badge Hunter': '◆',
};

export function badgeGlyphImageUrl(badge: CollectedBadge): string | null {
  return (
    resolveOwnerAssetUrl(ownerAssetBadgeSlotId(badge.name)) ??
    resolveOwnerAssetUrl('badge-default')
  );
}

export function badgeGlyph(badge: CollectedBadge): string {
  if (BADGE_GLYPHS[badge.name]) {
    return BADGE_GLYPHS[badge.name]!;
  }

  if (badge.rarity === 'legendary') return '◆';
  if (badge.rarity === 'epic') return '✦';
  if (badge.rarity === 'rare') return '◇';

  return 'N';
}