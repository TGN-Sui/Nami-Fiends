import {
  normalizeEventRewardAttachment,
  type EventRewardAttachment,
} from './event-reward-attachments.js';
import { channels, type NamiChannel } from './uiMockData.js';

export type NamiEventSource = 'official' | 'channel' | 'guild';

export type NamiEvent = {
  id: string;
  title: string;
  description: string;
  body: string;
  dateLabel: string;
  status: string;
  seats: string;
  source: NamiEventSource;
  channelId?: string;
  channelName?: string;
  guildId?: string;
  guildName?: string;
  subscribed?: boolean;
  startsAtUtc?: string;
  durationMinutes?: number;
  createdByMemberId?: string;
  /** Optional rewards attached by Nami owner, game channel owner, or guild owner. */
  rewards?: EventRewardAttachment[];
};

export const officialNamiHubEvents: NamiEvent[] = [
  {
    id: 'nami-launch-festival',
    title: 'Nami Launch Festival',
    description: 'Official cross-community celebration with badge drops and global chat raids.',
    body:
      'Join the opening festival lounge for live badge drops, creator spotlights, and coordinated global chat raids across every genre room. Official hosts will rotate through Q&A segments, squad matchmaking, and collectible badge unlock windows throughout the night.',
    dateLabel: 'Tonight · 8:00 PM',
    status: 'Official',
    seats: 'Unlimited',
    source: 'official',
    subscribed: true,
    rewards: [
      normalizeEventRewardAttachment(
        { kind: 'badge', label: 'Festival Badge', catalogRef: 'badge-launch-festival' },
        'nami-launch-festival'
      ),
      normalizeEventRewardAttachment(
        {
          kind: 'link',
          label: 'Festival claim page',
          linkUrl: 'https://nami.social/festival-claim',
        },
        'nami-launch-festival'
      ),
    ],
  },
  {
    id: 'nami-creator-showcase',
    title: 'Creator Showcase Live',
    description: 'Studios and community channels preview upcoming seasons.',
    body:
      'Verified studios and community channel owners present upcoming seasons, roadmap beats, and live demo segments. Viewers can bookmark channels, subscribe to event reminders, and jump directly into featured game profiles from the showcase floor.',
    dateLabel: 'Friday · 6:30 PM',
    status: 'Live soon',
    seats: '2.4k interested',
    source: 'official',
    subscribed: false,
  },
];

export const subscribedUserEvents: NamiEvent[] = [
  ...officialNamiHubEvents.filter((event) => event.subscribed),
  {
    id: 'fiends-tournament',
    title: 'FIENDS Launch Tournament',
    description: 'Bracket night hosted by the FIENDS game channel.',
    body: 'Bracket registration opens one hour before first match. Verified members receive priority queue placement and event badge tracking.',
    dateLabel: 'Tonight · 8:00 PM',
    status: 'Registration open',
    seats: '42/64',
    source: 'channel',
    channelId: 'fiends',
    channelName: 'FIENDS',
    subscribed: true,
    rewards: [
      normalizeEventRewardAttachment(
        {
          kind: 'description',
          label: 'Winner perks',
          description: 'Top 8 receive priority queue placement and channel flair for the season.',
        },
        'fiends-tournament'
      ),
      normalizeEventRewardAttachment(
        { kind: 'move-object', label: 'Trophy object', objectId: '0xfiends-trophy-demo' },
        'fiends-tournament'
      ),
    ],
  },
  {
    id: 'walrus-guild-run',
    title: 'Walrus Guild Run',
    description: 'Guild event from Wave Raiders on a subscribed channel.',
    body: 'Wave Raiders leads a coordinated guild run with voice lounge support and squad assignment tables.',
    dateLabel: 'Tomorrow · 7:30 PM',
    status: 'Guild lobby',
    seats: '18/40',
    source: 'guild',
    guildId: 'wave-raiders',
    guildName: 'Wave Raiders',
    channelId: 'xociety',
    channelName: 'Walrus Raiders',
    subscribed: true,
  },
  {
    id: 'pebble-builder-night',
    title: 'Builder Night',
    description: 'Community builder showcase from Pebble channel modules.',
    body: 'Builders share progress rooms, patch-inspired challenges, and community vote boards for featured creations.',
    dateLabel: 'Saturday · 4:00 PM',
    status: 'Scheduled',
    seats: '26/100',
    source: 'channel',
    channelId: 'pebble',
    channelName: 'Pebble',
    subscribed: true,
  },
];

export function channelOwnerEvents(channel: NamiChannel): NamiEvent[] {
  return [
    {
      id: channel.id + '-launch',
      title: channel.name + ' Launch Tournament',
      status: 'Registration open',
      dateLabel: 'Tonight · 8:00 PM',
      description: 'Owner-created event from the Game Profile Events module.',
      body: 'Channel owners configure brackets, squad caps, and reward badges from the Events module on the Game Profile.',
      seats: '42/64',
      source: 'channel',
      channelId: channel.id,
      channelName: channel.name,
    },
    {
      id: channel.id + '-ama',
      title: 'Developer AMA',
      status: 'Official',
      dateLabel: 'Friday · 6:00 PM',
      description: 'Channel owner Q&A session.',
      body: 'Live Q&A with channel owners and moderators. Submitted questions are reviewed for conduct before appearing on stage.',
      seats: 'Unlimited',
      source: 'channel',
      channelId: channel.id,
      channelName: channel.name,
    },
  ];
}

export const guildOwnerEvents: NamiEvent[] = [
  {
    id: 'guild-raid-night',
    title: 'Guild Raid Night',
    description: 'Guild owner event hosted on the guild page.',
    body: 'Guild owners publish raid nights, cosmetic drops, and recruitment windows directly from the Guild Owner page.',
    dateLabel: 'Tomorrow · 7:30 PM',
    status: 'Open signup',
    seats: '18/40',
    source: 'guild',
    guildId: 'wave-raiders',
    guildName: 'Wave Raiders',
  },
  {
    id: 'guild-cosmetic-drop',
    title: 'Cosmetic Drop Party',
    description: 'Celebrate new guild cosmetics and squad recruitment.',
    body: 'Celebrate unlocked guild cosmetics, squad recruitment windows, and member spotlight rotations.',
    dateLabel: 'Sunday · 5:00 PM',
    status: 'Scheduled',
    seats: '30/60',
    source: 'guild',
    guildId: 'wave-raiders',
    guildName: 'Wave Raiders',
    rewards: [
      normalizeEventRewardAttachment(
        { kind: 'cosmetic', label: 'Raid Spark Frame', catalogRef: 'overlay-raid-spark' },
        'guild-cosmetic-drop'
      ),
    ],
  },
];