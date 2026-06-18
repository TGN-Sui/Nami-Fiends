import { defaultSocialEmbeds, type GlobalChatRoom, type SocialEmbed } from './global-chats.js';
import { members, type NamiMember } from './uiMockData.js';

export type GenreChatBroadcast = {
  id: string;
  memberId: string;
  memberName: string;
  streamTag: string;
  title: string;
  handle: string;
  embed: SocialEmbed;
};

const TWITCH_EMBED =
  defaultSocialEmbeds.find((embed) => embed.platform === 'twitch' && embed.live) ??
  defaultSocialEmbeds.find((embed) => embed.platform === 'twitch')!;

/** Reserved for preview tooling — not used until tagged stream discovery ships. */
const PREVIEW_GENRE_BROADCAST_MEMBER_IDS: Record<string, string[]> = {
  'genre-shooter': ['m8', 'm10', 'm16', 'm18'],
  'genre-moba': ['m3', 'm18', 'm12', 'm8'],
  'genre-rpg': ['m14', 'm7', 'm13', 'm1'],
  'genre-sport': ['m17', 'm9', 'm6'],
  'genre-racing': ['m17', 'm10', 'm6'],
  'genre-fighting': ['m3', 'm16', 'm12'],
  'genre-adventure': ['m6', 'm13', 'm1'],
  'genre-strategy': ['m18', 'm1', 'm12'],
  'genre-rts': ['m18', 'm1', 'm7'],
  'genre-indie': ['m13', 'm4', 'm15'],
  'genre-platform': ['m13', 'm6', 'm4'],
  'genre-simulator': ['m19', 'm9', 'm15'],
  'genre-puzzle': ['m15', 'm4', 'm9'],
  'genre-tactical': ['m18', 'm12', 'm8'],
  'genre-tbs': ['m14', 'm18', 'm7'],
  'genre-hack-slash': ['m16', 'm3', 'm8'],
  'genre-music': ['m9', 'm15', 'm4'],
  'genre-arcade': ['m10', 'm17', 'm6'],
  'genre-visual-novel': ['m15', 'm13', 'm7'],
  'genre-card-board': ['m14', 'm7', 'm18'],
  'genre-point-click': ['m13', 'm6', 'm15'],
  'genre-quiz-trivia': ['m4', 'm9', 'm1'],
  'genre-pinball': ['m10', 'm17', 'm4'],
};

function memberById(memberId: string): NamiMember | undefined {
  return members.find((member) => member.id === memberId);
}

function buildPreviewBroadcast(chat: GlobalChatRoom, member: NamiMember): GenreChatBroadcast {
  const streamTag = chat.title;

  return {
    id: chat.id + '-broadcast-' + member.id,
    memberId: member.id,
    memberName: member.name,
    streamTag,
    title: member.name + ' · ' + streamTag + ' live',
    handle: '@' + member.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    embed: {
      ...TWITCH_EMBED,
      title: member.name + ' streaming ' + streamTag,
      handle: member.name.toLowerCase(),
    },
  };
}

/**
 * Tagged stream discovery for genre lounges. Returns broadcasts whose stream tags
 * match the lounge title (e.g. #Shooter). Not implemented yet.
 */
export function resolveTaggedGenreBroadcasts(_chat: GlobalChatRoom): GenreChatBroadcast[] {
  return [];
}

export function genreBroadcastsForChat(chat: GlobalChatRoom): GenreChatBroadcast[] {
  return resolveTaggedGenreBroadcasts(chat);
}

export function hasTaggedGenreBroadcasts(chat: GlobalChatRoom): boolean {
  return genreBroadcastsForChat(chat).length > 0;
}

/** Dev-only preview helper for future broadcast UI work. */
export function previewGenreBroadcastsForChat(chat: GlobalChatRoom): GenreChatBroadcast[] {
  const memberIds = PREVIEW_GENRE_BROADCAST_MEMBER_IDS[chat.id] ?? ['m1', 'm8', 'm13', 'm18'];

  return memberIds
    .map((memberId) => memberById(memberId))
    .filter((member): member is NamiMember => member !== undefined)
    .map((member) => buildPreviewBroadcast(chat, member));
}

export function expandedGenreAudienceSize(activeMembers: number): number {
  return Math.max(3, Math.min(48, Math.round(activeMembers * 0.06)));
}

export function genreVoteMajorityNeeded(audienceSize: number): number {
  return Math.floor(audienceSize / 2) + 1;
}