export type GiftTier = 'common' | 'rare' | 'legendary';

export type GiftCatalogEntry = {
  id: string;
  label: string;
  tier: GiftTier;
  emoji: string;
  iconUrl?: string | null;
  priceUsd: number;
  goonAmount: number;
  animationClass: string;
  enabled?: boolean;
};

export const OFFICIAL_GIFT_CATALOG: GiftCatalogEntry[] = [
  {
    id: 'goon-pop',
    label: 'Goon Pop',
    tier: 'common',
    emoji: '🎈',
    priceUsd: 1,
    goonAmount: 10,
    animationClass: 'gift-burst-common',
  },
  {
    id: 'goon-clap',
    label: 'Goon Clap',
    tier: 'common',
    emoji: '👏',
    priceUsd: 2,
    goonAmount: 20,
    animationClass: 'gift-float-common',
  },
  {
    id: 'goon-heart',
    label: 'Goon Heart',
    tier: 'common',
    emoji: '💚',
    priceUsd: 3,
    goonAmount: 30,
    animationClass: 'gift-sparkle-common',
  },
  {
    id: 'goon-fire',
    label: 'Goon Fire',
    tier: 'rare',
    emoji: '🔥',
    priceUsd: 5,
    goonAmount: 50,
    animationClass: 'gift-burst-rare',
  },
  {
    id: 'goon-star',
    label: 'Goon Star',
    tier: 'rare',
    emoji: '⭐',
    priceUsd: 8,
    goonAmount: 80,
    animationClass: 'gift-float-rare',
  },
  {
    id: 'goon-crown',
    label: 'Goon Crown',
    tier: 'rare',
    emoji: '👑',
    priceUsd: 12,
    goonAmount: 120,
    animationClass: 'gift-sparkle-rare',
  },
  {
    id: 'goon-legend',
    label: 'Goon Legend',
    tier: 'legendary',
    emoji: '🏆',
    priceUsd: 25,
    goonAmount: 250,
    animationClass: 'gift-burst-legendary',
  },
  {
    id: 'goon-mega',
    label: 'Goon Mega',
    tier: 'legendary',
    emoji: '💎',
    priceUsd: 50,
    goonAmount: 500,
    animationClass: 'gift-sparkle-legendary',
  },
];

export function giftCatalogEntry(giftId: string): GiftCatalogEntry | undefined {
  return OFFICIAL_GIFT_CATALOG.find((entry) => entry.id === giftId);
}

export function giftsForTier(tier: GiftTier): GiftCatalogEntry[] {
  return OFFICIAL_GIFT_CATALOG.filter((entry) => entry.tier === tier);
}

export function giftTierLabel(tier: GiftTier): string {
  if (tier === 'common') {
    return 'Common';
  }

  if (tier === 'rare') {
    return 'Rare';
  }

  return 'Legendary';
}