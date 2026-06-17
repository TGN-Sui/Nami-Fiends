import { readGlobalChatOverlay } from './messages-store.js';
import { isSelfMember } from './surface-preferences.js';
import { channels, members, userProfile, type ConductSignal, type NamiChannel, type NamiMember } from './uiMockData.js';

export type GlobalChatKind = 'official' | 'genre' | 'temporary';

export type GlobalChatRoom = {
  id: string;
  title: string;
  kind: GlobalChatKind;
  genre?: string;
  createdBy: string;
  creatorVerified: boolean;
  activeMembers: number;
  voiceEnabled: boolean;
  isOfficial: boolean;
  closesOnExit: boolean;
};

export type GlobalChatMessage = {
  id: string;
  time: string;
  author: string;
  signal: ConductSignal;
  body: string;
};

export const OFFICIAL_NAMI_GLOBAL_CHAT_ID = 'official-nami-global';

export const officialNamiGlobalChat: GlobalChatRoom = {
  id: OFFICIAL_NAMI_GLOBAL_CHAT_ID,
  title: 'Official Nami Global Chat',
  kind: 'official',
  createdBy: 'Nami',
  creatorVerified: true,
  activeMembers: 2840,
  voiceEnabled: true,
  isOfficial: true,
  closesOnExit: false,
};

export const hubGlobalChats: GlobalChatRoom[] = [
  officialNamiGlobalChat,
  {
    id: 'global-welcome-lounge',
    title: 'Welcome Lounge',
    kind: 'official',
    createdBy: 'Nami',
    creatorVerified: true,
    activeMembers: 1264,
    voiceEnabled: false,
    isOfficial: true,
    closesOnExit: false,
  },
  {
    id: 'global-lfg-arena',
    title: 'Looking For Group',
    kind: 'temporary',
    createdBy: 'Nozomi',
    creatorVerified: true,
    activeMembers: 186,
    voiceEnabled: true,
    isOfficial: false,
    closesOnExit: true,
  },
  {
    id: 'global-creator-pitch',
    title: 'Creator Pitch Room',
    kind: 'temporary',
    createdBy: 'Rhokdelar',
    creatorVerified: true,
    activeMembers: 74,
    voiceEnabled: false,
    isOfficial: false,
    closesOnExit: true,
  },
  {
    id: 'global-cozy-corner',
    title: 'Cozy Corner',
    kind: 'temporary',
    createdBy: 'PebbleFan',
    creatorVerified: false,
    activeMembers: 41,
    voiceEnabled: true,
    isOfficial: false,
    closesOnExit: true,
  },
];

export const genreOfficialChats: GlobalChatRoom[] = [
  {
    id: 'genre-fps',
    title: 'FPS Arena',
    kind: 'genre',
    genre: 'FPS / Shooter',
    createdBy: 'Nami',
    creatorVerified: true,
    activeMembers: 920,
    voiceEnabled: true,
    isOfficial: true,
    closesOnExit: false,
  },
  {
    id: 'genre-rpg',
    title: 'RPG Quest Hall',
    kind: 'genre',
    genre: 'RPG / Adventure',
    createdBy: 'Nami',
    creatorVerified: true,
    activeMembers: 740,
    voiceEnabled: true,
    isOfficial: true,
    closesOnExit: false,
  },
  {
    id: 'genre-moba',
    title: 'MOBA Strategy',
    kind: 'genre',
    genre: 'MOBA / Strategy',
    createdBy: 'Nami',
    creatorVerified: true,
    activeMembers: 612,
    voiceEnabled: true,
    isOfficial: true,
    closesOnExit: false,
  },
  {
    id: 'genre-sports',
    title: 'Sports & Racing',
    kind: 'genre',
    genre: 'Sports / Racing',
    createdBy: 'Nami',
    creatorVerified: true,
    activeMembers: 388,
    voiceEnabled: false,
    isOfficial: true,
    closesOnExit: false,
  },
  {
    id: 'genre-sandbox',
    title: 'Sandbox Builders',
    kind: 'genre',
    genre: 'Sandbox / Builder',
    createdBy: 'Nami',
    creatorVerified: true,
    activeMembers: 455,
    voiceEnabled: true,
    isOfficial: true,
    closesOnExit: false,
  },
  {
    id: 'genre-social',
    title: 'Social & Party',
    kind: 'genre',
    genre: 'Gaming / Social',
    createdBy: 'Nami',
    creatorVerified: true,
    activeMembers: 1032,
    voiceEnabled: false,
    isOfficial: true,
    closesOnExit: false,
  },
  {
    id: 'genre-horror',
    title: 'Horror Nights',
    kind: 'genre',
    genre: 'Horror / Survival',
    createdBy: 'Nami',
    creatorVerified: true,
    activeMembers: 266,
    voiceEnabled: true,
    isOfficial: true,
    closesOnExit: false,
  },
  {
    id: 'genre-indie',
    title: 'Indie Spotlight',
    kind: 'genre',
    genre: 'Indie / Experimental',
    createdBy: 'Nami',
    creatorVerified: true,
    activeMembers: 198,
    voiceEnabled: false,
    isOfficial: true,
    closesOnExit: false,
  },
];

const mockMessagesByChat: Record<string, GlobalChatMessage[]> = {
  [OFFICIAL_NAMI_GLOBAL_CHAT_ID]: [
    {
      id: 'og1',
      time: '14:02',
      author: 'Nozomi',
      signal: 'Green',
      body: 'Welcome to the official global lounge — say hi!',
    },
    {
      id: 'og2',
      time: '14:03',
      author: 'DeadlySin',
      signal: 'Orange',
      body: 'LFG for ranked runs tonight @Nozomi — voice room is open.',
    },
    {
      id: 'og3',
      time: '14:04',
      author: 'PebbleFan',
      signal: 'Green',
      body: 'Cozy event board is live in Game Hub.',
    },
  ],
};

const GLOBAL_CHAT_TEMPLATES = [
  'Welcome in — drop a hello.',
  'LFG for ranked runs tonight.',
  'Voice lounge is open if you want comms.',
  'Anyone hitting the event board later?',
  'Cozy corner crew checking in.',
  'Guild recruitment thread is live.',
  'Patch notes watch party at 8.',
  'Looking for squad members for PvP.',
  'Official banner just dropped in Hub.',
  'Builder showcase starts soon.',
];

export function getGlobalChatMessages(chatId: string): GlobalChatMessage[] {
  const seeded = mockMessagesByChat[chatId];
  const authors = members.filter((member) => member.signal !== 'Black');

  const baseMessages = Array.from({ length: 20 }, (_, index) => {
    const author = authors[index % authors.length] ?? members[0]!;
    const seededMessage = seeded?.[index];

    if (seededMessage) {
      return seededMessage;
    }

    return {
      id: chatId + '-m' + index,
      time: String(12 + Math.floor(index / 4)).padStart(2, '0') + ':' + String((index * 3) % 60).padStart(2, '0'),
      author: author.name,
      signal: author.signal,
      body: GLOBAL_CHAT_TEMPLATES[index % GLOBAL_CHAT_TEMPLATES.length]!,
    };
  });

  const overlay = readGlobalChatOverlay(chatId).map((message) => ({
    id: message.id,
    author: message.author,
    body: message.body,
    time: message.time,
    signal: message.signal,
  }));

  return [...baseMessages, ...overlay];
}

export function canCreateTemporaryChat(): boolean {
  return userProfile.tier === 'Elite' && userProfile.conductSignal === 'Green';
}

export type CollectedBadge = {
  id: string;
  name: string;
  claimedAt: string;
  collectorsCount: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export const BADGE_BOOK_SLOT_COUNT = 24;

const EXTRA_BADGE_NAMES = [
  'Raid Captain',
  'Patch Loyalist',
  'Guild Herald',
  'Season Closer',
  'Signal Guardian',
  'Creator Ally',
  'Arena Victor',
  'Night Owl',
  'Quest Runner',
  'Badge Hunter',
  'Wave Rider',
  'Signal Watch',
  'Guild Ally',
  'Event Regular',
  'Top Helper',
];

function mapBadgeNames(names: string[], idPrefix: string): CollectedBadge[] {
  return names.map((name, index) => ({
    id: idPrefix + '-badge-' + index,
    name,
    claimedAt: '2026-' + String(Math.min(12, index + 1)).padStart(2, '0') + '-12T18:00:00Z',
    collectorsCount: Math.max(88, 1400 - index * 97),
    rarity:
      index === 0
        ? 'legendary'
        : index < 4
          ? 'epic'
          : index < 10
            ? 'rare'
            : 'common',
  }));
}

export const userCollectedBadges: CollectedBadge[] = mapBadgeNames(
  [...userProfile.ownedBadges, ...EXTRA_BADGE_NAMES],
  'self'
);

export function collectedBadgesForMember(member: NamiMember): CollectedBadge[] {
  if (isSelfMember(member.id)) {
    return userCollectedBadges;
  }

  const memberIndex = Math.max(0, members.findIndex((entry) => entry.id === member.id));
  const tierBadge =
    member.tier === 'Elite'
      ? 'Elite Crest'
      : member.tier === 'Pro'
        ? 'Pro Circuit'
        : member.tier === 'Adventurer'
          ? 'Adventurer Mark'
          : 'Community Mark';
  const memberNames = [
    member.badge,
    tierBadge,
    member.name + ' Regular',
    ...EXTRA_BADGE_NAMES.slice(memberIndex * 3, memberIndex * 3 + 14),
  ].filter((name, index, list) => name.length > 0 && list.indexOf(name) === index);

  return mapBadgeNames(memberNames.slice(0, 18), member.id);
}

export type SocialEmbed = {
  platform: 'x' | 'twitch' | 'youtube';
  title: string;
  handle: string;
  previewUrl?: string;
  /** Optional direct iframe src override (Settings → Embedded Feeds). */
  embedUrl?: string;
  live?: boolean;
};

export function genreChatToBubbleChannel(chat: GlobalChatRoom, template: NamiChannel): NamiChannel {
  return {
    ...template,
    id: chat.id,
    name: chat.title,
    genre: chat.genre ?? chat.title,
    subscribers: chat.activeMembers,
    handle: '@' + chat.id.replace('genre-', ''),
    tagline: 'Official Nami genre lounge · ' + chat.activeMembers.toLocaleString() + ' active',
    officialNami: chat.isOfficial,
    partner: chat.isOfficial ? true : template.partner,
  };
}

export function buildGenreBubbleEntries(): Array<{ channel: NamiChannel; slotId: string }> {
  return genreOfficialChats.map((chat, index) => ({
    channel: genreChatToBubbleChannel(chat, channels[index % channels.length]!),
    slotId: chat.id + '-genre-bubble',
  }));
}

export const defaultSocialEmbeds: SocialEmbed[] = [
  {
    platform: 'twitch',
    title: 'Live broadcast',
    handle: 'twitch',
    previewUrl: 'https://www.twitch.tv/twitch',
    live: true,
  },
  {
    platform: 'youtube',
    title: 'Featured stream',
    handle: '@namigamer',
    previewUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    live: false,
  },
  {
    platform: 'x',
    title: 'Latest post',
    handle: '@namigamer',
    previewUrl: 'https://x.com/namigamer',
  },
];