import { shouldAutoSeedLocalData } from './app-config.js';
import { LANDING_GENRE_LOUNGES } from './landing-content.js';
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
    createdBy: 'Robbos',
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

const GENRE_LOUNGE_ACTIVE_MEMBERS: readonly number[] = [
  920, 812, 748, 688, 612, 568, 528, 492, 458, 428, 398, 372, 348, 322, 298, 276, 254, 234, 216, 198, 182, 168, 154,
];

const GENRE_LOUNGE_VOICE_ENABLED = new Set<(typeof LANDING_GENRE_LOUNGES)[number]>([
  'Shooter',
  'MOBA',
  'Sport',
  'Racing',
  'Fighting',
  'RTS',
  'Tactical',
  'Hack & Slash',
  'Arcade',
]);

function genreLoungeId(title: (typeof LANDING_GENRE_LOUNGES)[number]): string {
  return (
    'genre-' +
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

export const genreOfficialChats: GlobalChatRoom[] = LANDING_GENRE_LOUNGES.map((title, index) => ({
  id: genreLoungeId(title),
  title,
  kind: 'genre',
  genre: title,
  createdBy: 'Nami',
  creatorVerified: true,
  activeMembers: GENRE_LOUNGE_ACTIVE_MEMBERS[index] ?? 150,
  voiceEnabled: GENRE_LOUNGE_VOICE_ENABLED.has(title),
  isOfficial: true,
  closesOnExit: false,
}));

const mockMessagesByChat: Record<string, GlobalChatMessage[]> = {
  [OFFICIAL_NAMI_GLOBAL_CHAT_ID]: [
    {
      id: 'og1',
      time: '14:02',
      author: 'Robbos',
      signal: 'Green',
      body: 'Welcome to the official global lounge — say hi!',
    },
    {
      id: 'og2',
      time: '14:03',
      author: 'DeadlySin',
      signal: 'Orange',
      body: 'LFG for ranked runs tonight @Robbos — voice room is open.',
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

const HUB_CHAT_TEMPLATES: Record<string, string[]> = {
  [OFFICIAL_NAMI_GLOBAL_CHAT_ID]: [
    'Welcome to the official global lounge — say hi!',
    'LFG for ranked runs tonight.',
    'Voice lounge is open if you want comms.',
    'Anyone hitting the event board later?',
  ],
  'global-welcome-lounge': [
    'Welcome Lounge check-in — new members start here.',
    'Drop your passport tier if you want squad invites.',
    'Official onboarding thread is pinned above.',
    'Ask moderation anything before you jump into genre rooms.',
  ],
  'global-lfg-arena': [
    'LFG Arena is open — post your role and rank.',
    'Need one more for ranked queue.',
    'Voice channel link is in the pinned post.',
    'Squad fill in progress for tonight\'s run.',
  ],
  'global-creator-pitch': [
    'Creator Pitch Room — share your project hook in one line.',
    'Looking for playtesters for an indie demo.',
    'Feedback thread opens after each pitch.',
    'Collab requests go in replies, not main chat.',
  ],
  'global-cozy-corner': [
    'Cozy corner crew checking in.',
    'Low-pressure chat only — no rank sweat.',
    'Share what you are playing tonight.',
    'Chill playlist recommendations welcome.',
  ],
};

const DEFAULT_HUB_CHAT_TEMPLATES = [
  'Welcome in — drop a hello.',
  'LFG for ranked runs tonight.',
  'Voice lounge is open if you want comms.',
  'Anyone hitting the event board later?',
  'Guild recruitment thread is live.',
  'Patch notes watch party at 8.',
  'Looking for squad members for PvP.',
  'Official banner just dropped in Hub.',
];

function genreFixtureTemplates(genre: string): string[] {
  return [
    'Welcome to the official ' + genre + ' lounge — intro thread is pinned.',
    'LFG: looking for ' + genre + ' regulars for tonight\'s session.',
    genre + ' voice channel is open if you want comms.',
    'Anyone tracking the latest ' + genre + ' meta shift?',
    'Event board for ' + genre + ' rooms just updated in Hub.',
    'Squad recruiting in ' + genre + ' — verified members preferred.',
    'Patch watch party for ' + genre + ' fans starts at 8.',
    'Share your ' + genre + ' highlights in the clips thread.',
    'Room topic tonight: best entry points for new ' + genre + ' players.',
    'Moderator note: keep spoilers in the tagged thread.',
  ];
}

function resolveFixtureChat(chatId: string): GlobalChatRoom | undefined {
  return (
    genreOfficialChats.find((chat) => chat.id === chatId) ??
    hubGlobalChats.find((chat) => chat.id === chatId)
  );
}

function fixtureMessageBody(chatId: string, chat: GlobalChatRoom | undefined, index: number): string {
  if (chat?.kind === 'genre' && chat.genre) {
    return genreFixtureTemplates(chat.genre)[index % genreFixtureTemplates(chat.genre).length]!;
  }

  const hubTemplates = HUB_CHAT_TEMPLATES[chatId] ?? DEFAULT_HUB_CHAT_TEMPLATES;

  return hubTemplates[index % hubTemplates.length]!;
}

function buildFixtureGlobalChatMessages(chatId: string): GlobalChatMessage[] {
  const seeded = mockMessagesByChat[chatId];
  const chat = resolveFixtureChat(chatId);
  const authors = members.filter((member) => member.signal !== 'Black');

  return Array.from({ length: 20 }, (_, index) => {
    const author = authors[(index + chatId.length) % authors.length] ?? members[0]!;
    const seededMessage = seeded?.[index];

    if (seededMessage) {
      return seededMessage;
    }

    return {
      id: chatId + '-m' + index,
      time: String(12 + Math.floor(index / 4)).padStart(2, '0') + ':' + String((index * 3) % 60).padStart(2, '0'),
      author: author.name,
      signal: author.signal,
      body: fixtureMessageBody(chatId, chat, index),
    };
  });
}

export function getGlobalChatMessages(chatId: string): GlobalChatMessage[] {
  const overlay = readGlobalChatOverlay(chatId).map((message) => ({
    id: message.id,
    author: message.author,
    body: message.body,
    time: message.time,
    signal: message.signal,
  }));

  if (!shouldAutoSeedLocalData()) {
    return overlay;
  }

  return [...buildFixtureGlobalChatMessages(chatId), ...overlay];
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

export type CollectedTitle = {
  id: string;
  name: string;
};

export type CosmeticKind = 'frame' | 'theme' | 'ring';

export type CollectedCosmetic = {
  id: string;
  name: string;
  kind: CosmeticKind;
};

function cosmeticKindFromName(name: string): CosmeticKind {
  const normalized = name.toLowerCase();

  if (normalized.includes('theme')) {
    return 'theme';
  }

  if (normalized.includes('ring')) {
    return 'ring';
  }

  return 'frame';
}

function mapCollectedTitles(names: string[], idPrefix: string): CollectedTitle[] {
  return names.map((name, index) => ({
    id: idPrefix + '-title-' + index,
    name,
  }));
}

function mapCollectedCosmetics(names: string[], idPrefix: string): CollectedCosmetic[] {
  return names.map((name, index) => ({
    id: idPrefix + '-cosmetic-' + index,
    name,
    kind: cosmeticKindFromName(name),
  }));
}

export const userCollectedTitles: CollectedTitle[] = mapCollectedTitles(userProfile.titles, 'self');

export const userCollectedCosmetics: CollectedCosmetic[] = mapCollectedCosmetics(
  userProfile.cosmetics,
  'self'
);

export function collectedTitlesForMember(member: NamiMember): CollectedTitle[] {
  if (isSelfMember(member.id)) {
    return userCollectedTitles;
  }

  const memberIndex = Math.max(0, members.findIndex((entry) => entry.id === member.id));

  return mapCollectedTitles(
    userProfile.titles.slice(memberIndex % userProfile.titles.length),
    member.id
  );
}

export function collectedCosmeticsForMember(member: NamiMember): CollectedCosmetic[] {
  if (isSelfMember(member.id)) {
    return userCollectedCosmetics;
  }

  const memberIndex = Math.max(0, members.findIndex((entry) => entry.id === member.id));

  return mapCollectedCosmetics(
    userProfile.cosmetics.slice(memberIndex % userProfile.cosmetics.length),
    member.id
  );
}

export function cosmeticsForKind(
  cosmetics: CollectedCosmetic[],
  kind: CosmeticKind
): CollectedCosmetic[] {
  return cosmetics.filter((entry) => entry.kind === kind);
}

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