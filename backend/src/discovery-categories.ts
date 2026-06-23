export const DISCOVERY_CHANNEL_CATEGORY_IDS = [
  'featured',
  'top_boosted',
  'rising',
  'verified',
  'new_player_friendly',
  'guild_spotlight',
  'badge_campaigns',
  'cozy',
  'competitive',
] as const;

export type DiscoveryChannelCategoryId = (typeof DISCOVERY_CHANNEL_CATEGORY_IDS)[number];

export interface DiscoveryCategoryDefinition {
  id: DiscoveryChannelCategoryId;
  label: string;
  description: string;
}

export const DISCOVERY_CHANNEL_CATEGORIES: DiscoveryCategoryDefinition[] = [
  {
    id: 'featured',
    label: 'Featured',
    description: 'Balanced multi-signal score for the weekly discovery cycle.',
  },
  {
    id: 'top_boosted',
    label: 'Top Boosted',
    description: 'Channels with the strongest boost power this cycle.',
  },
  {
    id: 'rising',
    label: 'Rising',
    description: 'Channels gaining the most boost momentum week over week.',
  },
  {
    id: 'verified',
    label: 'Verified Games',
    description: 'Verified developer channels ranked by trust and activity.',
  },
  {
    id: 'new_player_friendly',
    label: 'New Player Friendly',
    description: 'Channels with NPC-friendly or low-tier access policies.',
  },
  {
    id: 'guild_spotlight',
    label: 'Guild Spotlight',
    description: 'Channels whose owners run active public guilds.',
  },
  {
    id: 'badge_campaigns',
    label: 'Badge Campaigns',
    description: 'Channels with meaningful issuer badge activity.',
  },
  {
    id: 'cozy',
    label: 'Cozy Communities',
    description: 'Green-conduct owners with welcoming access policies.',
  },
  {
    id: 'competitive',
    label: 'Competitive',
    description: 'Orange or Red conduct owners hosting competitive spaces.',
  },
];

export function normalizeDiscoveryChannelCategory(
  value: string | null | undefined,
): DiscoveryChannelCategoryId {
  if (
    value &&
    DISCOVERY_CHANNEL_CATEGORY_IDS.includes(value as DiscoveryChannelCategoryId)
  ) {
    return value as DiscoveryChannelCategoryId;
  }

  return 'featured';
}