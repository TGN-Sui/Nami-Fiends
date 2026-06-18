export type ChannelProfileSection = 'news' | 'events' | 'reviews' | 'about' | 'owner' | 'chat';

export type ChannelProfileNavItem = {
  id: ChannelProfileSection;
  label: string;
  badge?: number;
};

export function buildChannelProfileNavItems(options: {
  eventCount: number;
  reviewCount: number;
  isChannelOwner: boolean;
}): ChannelProfileNavItem[] {
  const items: ChannelProfileNavItem[] = [
    { id: 'news', label: 'News' },
    { id: 'events', label: 'Events', badge: options.eventCount },
    { id: 'reviews', label: 'Reviews', badge: options.reviewCount },
    { id: 'about', label: 'About' },
    { id: 'chat', label: 'Chat' },
  ];

  if (options.isChannelOwner) {
    items.push({ id: 'owner', label: 'Owner' });
  }

  return items;
}