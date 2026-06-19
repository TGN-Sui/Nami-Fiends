export type ChannelProfileSection = 'news' | 'events' | 'reviews' | 'about' | 'owner' | 'chat';

export type ChannelProfileNavItem = {
  id: ChannelProfileSection;
  label: string;
  badge?: number;
};

const PROFILE_TAB_LABELS: Record<ChannelProfileSection, string> = {
  news: 'News',
  events: 'Events',
  reviews: 'Reviews',
  about: 'About',
  chat: 'Chat',
  owner: 'Owner',
};

export function buildChannelProfileNavItems(options: {
  eventCount: number;
  reviewCount: number;
  isChannelOwner: boolean;
  tabOrder?: ChannelProfileSection[];
}): ChannelProfileNavItem[] {
  const baseOrder = options.tabOrder ?? [
    'news',
    'events',
    'reviews',
    'about',
    'chat',
    ...(options.isChannelOwner ? (['owner'] as ChannelProfileSection[]) : []),
  ];

  const items: ChannelProfileNavItem[] = [];

  for (const section of baseOrder) {
    if (section === 'owner' && !options.isChannelOwner) {
      continue;
    }

    const item: ChannelProfileNavItem = {
      id: section,
      label: PROFILE_TAB_LABELS[section],
    };

    if (section === 'events') {
      item.badge = options.eventCount;
    }

    if (section === 'reviews') {
      item.badge = options.reviewCount;
    }

    items.push(item);
  }

  return items;
}