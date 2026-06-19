import { getMemberBoostedChannels } from './channel-boost-store.js';
import { readChannelGameReviews, type ChannelGameReview } from './channel-game-reviews-store.js';
import {
  collectedBadgesForMember,
  genreOfficialChats,
  hubGlobalChats,
  type CollectedBadge,
} from './global-chats.js';
import { isSelfMember } from './surface-preferences.js';
import { readSelfProfileEdits } from './member-profile-store.js';
import { getNamiProgression, type NamiProgressionSnapshot } from './member-progression.js';
import { channels, members, type NamiChannel, type NamiMember } from './uiMockData.js';

const RARITY_RANK: Record<CollectedBadge['rarity'], number> = {
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1,
};

const OFFSTREAM_GAMES = [
  { title: 'FIENDS', platform: 'PC', statusLabel: 'Grinding ranked with the squad' },
  { title: 'Walrus Raiders', platform: 'PC', statusLabel: 'Co-op raid night' },
  { title: 'Night Market PvP', platform: 'Console', statusLabel: 'Warming up for weekend ladder' },
  { title: 'Retro Arena', platform: 'PC', statusLabel: 'Speedrun practice' },
  { title: 'Ocean Mint Crew', platform: 'Mobile', statusLabel: 'Daily quest route' },
  { title: 'Signal Watch', platform: 'PC', statusLabel: 'Lore chapter catch-up' },
] as const;

const DAILY_STATUS_TEMPLATES = [
  'Looking for a raid crew tonight — ping me in LFG.',
  'Badge hunting this week. Happy to trade channel tips.',
  'Streaming later, but still replying between matches.',
  'Building a new squad comp — open to theorycraft.',
  'Quiet grind day. Catch me in genre lounges.',
  'Event prep mode — see you in the FIENDS channel.',
] as const;

export type MemberOffstreamGame = {
  title: string;
  platform: string;
  statusLabel: string;
};

export type MemberChatPresence = {
  chatId: string;
  chatTitle: string;
  surfaceLabel: string;
  channelId?: string;
  isActiveNow: boolean;
  hoursThisWeek: number;
};

export type MemberBoostedChannel = {
  channelId: string;
  channelName: string;
  genre: string;
  boostsApplied: number;
  lastBoostedLabel: string;
};

export type MemberProfileShowcaseSnapshot = {
  dailyStatus: string;
  offstreamGame: MemberOffstreamGame | null;
  topBadges: CollectedBadge[];
  reviews: ChannelGameReview[];
  chatPresence: MemberChatPresence[];
  boostedChannels: MemberBoostedChannel[];
  progression: NamiProgressionSnapshot;
};

function memberIndex(member: NamiMember): number {
  return Math.max(0, members.findIndex((entry) => entry.id === member.id));
}

function resolveDailyStatus(member: NamiMember): string {
  if (isSelfMember(member.id)) {
    const edits = readSelfProfileEdits();
    const dailyStatus = edits.dailyStatus.trim();

    if (dailyStatus) {
      return dailyStatus;
    }

    const bio = edits.bio.trim();

    if (bio) {
      return bio;
    }
  }

  const index = memberIndex(member);

  return DAILY_STATUS_TEMPLATES[index % DAILY_STATUS_TEMPLATES.length]!;
}

function resolveOffstreamGame(member: NamiMember): MemberOffstreamGame | null {
  if (member.tier === 'NPC') {
    return null;
  }

  const game = OFFSTREAM_GAMES[memberIndex(member) % OFFSTREAM_GAMES.length]!;

  return { ...game };
}

function topBadgesForMember(member: NamiMember): CollectedBadge[] {
  if (member.tier === 'NPC') {
    return [];
  }

  return [...collectedBadgesForMember(member)]
    .sort((left, right) => RARITY_RANK[right.rarity] - RARITY_RANK[left.rarity])
    .slice(0, 4);
}

function reviewsForMember(memberId: string): ChannelGameReview[] {
  return readChannelGameReviews()
    .filter((review) => review.memberId === memberId)
    .sort((left, right) => right.rating - left.rating || left.createdAtLabel.localeCompare(right.createdAtLabel));
}

function chatPoolForMember(member: NamiMember) {
  const index = memberIndex(member);
  const channelChats = channels.slice(0, 4).map((channel) => ({
    chatId: channel.id + '-game-chat',
    chatTitle: channel.name + ' Game Chat',
    surfaceLabel: 'Game Channel',
    channelId: channel.id,
    isActiveNow: index % 2 === 0,
    hoursThisWeek: 4 + (index % 5) * 2.5,
  }));

  const globalChats = hubGlobalChats.slice(0, 3).map((chat, chatIndex) => ({
    chatId: chat.id,
    chatTitle: chat.title,
    surfaceLabel: chat.kind === 'official' ? 'Nami Global' : 'Open Lounge',
    isActiveNow: chatIndex === 0,
    hoursThisWeek: 6 + chatIndex * 3 + (index % 4),
  }));

  const genreChats = genreOfficialChats.slice(index % 6, (index % 6) + 2).map((chat, chatIndex) => ({
    chatId: chat.id,
    chatTitle: chat.title + ' Lounge',
    surfaceLabel: 'Genre Lounge',
    isActiveNow: chatIndex === 0 && index % 3 === 0,
    hoursThisWeek: 3 + chatIndex * 4 + (index % 3),
  }));

  return [...channelChats, ...globalChats, ...genreChats]
    .sort((left, right) => right.hoursThisWeek - left.hoursThisWeek)
    .slice(0, 4);
}

function boostedChannelsForMember(member: NamiMember): MemberBoostedChannel[] {
  const liveBoosts = getMemberBoostedChannels(member.id);

  if (liveBoosts.length > 0) {
    return liveBoosts
      .map((boost) => {
        const channel = channels.find((entry) => entry.id === boost.channelId);

        return {
          channelId: boost.channelId,
          channelName: channel?.name ?? boost.channelId,
          genre: channel?.genre ?? 'Game',
          boostsApplied: boost.boostsApplied,
          lastBoostedLabel: boost.lastBoostedLabel,
        };
      })
      .slice(0, 4);
  }

  const index = memberIndex(member);
  const boostBudget = member.tier === 'Elite' ? 3 : member.tier === 'Pro' ? 2 : member.tier === 'Adventurer' ? 1 : 0;

  if (boostBudget === 0) {
    return [];
  }

  return channels
    .filter((_, channelIndex) => channelIndex % 3 === index % 3 || channelIndex === 0)
    .slice(0, boostBudget)
    .map((channel, channelIndex) => ({
      channelId: channel.id,
      channelName: channel.name,
      genre: channel.genre,
      boostsApplied: Math.max(1, boostBudget - channelIndex),
      lastBoostedLabel: channelIndex === 0 ? 'Boosted this week' : 'Boosted last month',
    }));
}

export function buildMemberProfileShowcase(member: NamiMember, tick = Date.now()): MemberProfileShowcaseSnapshot {
  return {
    dailyStatus: resolveDailyStatus(member),
    offstreamGame: resolveOffstreamGame(member),
    topBadges: topBadgesForMember(member),
    reviews: reviewsForMember(member.id),
    chatPresence: chatPoolForMember(member),
    boostedChannels: boostedChannelsForMember(member),
    progression: getNamiProgression(member, tick),
  };
}

export function channelForShowcase(channelId: string): NamiChannel | undefined {
  return channels.find((channel) => channel.id === channelId);
}