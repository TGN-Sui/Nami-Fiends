import { getChannelChatMessages } from './channel-chats.js';
import { getGenreWeeklyActiveChatters } from './genre-chat-activity-store.js';
import type { GlobalChatRoom } from './global-chats.js';
import { getGlobalChatMessages } from './global-chats.js';
import {
  countMembersActiveInChat,
  countWeeklyParticipantsInChat,
  useMemberChatTimeVersion,
} from './member-chat-time-store.js';
import { useGenreChatActivityVersion } from './genre-chat-activity-store.js';

export type ChatLiveStats = {
  membersInside: number;
  activeNow: number;
  weeklyActive: number;
};

function uniqueMessageAuthors(messages: ReadonlyArray<{ author: string }>): number {
  return new Set(messages.map((message) => message.author.trim()).filter(Boolean)).size;
}

export function resolveGlobalChatLiveStats(
  chat: GlobalChatRoom,
  messages: ReadonlyArray<{ author: string }> = getGlobalChatMessages(chat.id),
): ChatLiveStats {
  const authorsInRoom = uniqueMessageAuthors(messages);
  const activeNow = countMembersActiveInChat(chat.id);
  const trackedWeekly = countWeeklyParticipantsInChat(chat.id);
  const genreWeekly = chat.kind === 'genre' ? getGenreWeeklyActiveChatters(chat.id) : 0;
  const weeklyActive = Math.max(trackedWeekly, genreWeekly, authorsInRoom);
  const membersInside = Math.max(authorsInRoom, activeNow, Math.round(weeklyActive * 0.35), 1);

  return {
    membersInside,
    activeNow: Math.max(activeNow, authorsInRoom > 0 ? 1 : 0),
    weeklyActive,
  };
}

export function resolveChannelChatLiveStats(
  channelId: string,
  messages: ReadonlyArray<{ author: string }> = getChannelChatMessages(channelId),
): ChatLiveStats {
  const authorsInRoom = uniqueMessageAuthors(messages);
  const chatPresenceId = channelChatPresenceId(channelId);
  const activeNow = countMembersActiveInChat(chatPresenceId);
  const weeklyActive = Math.max(countWeeklyParticipantsInChat(chatPresenceId), authorsInRoom);
  const membersInside = Math.max(authorsInRoom, activeNow, 1);

  return {
    membersInside,
    activeNow: Math.max(activeNow, authorsInRoom > 0 ? 1 : 0),
    weeklyActive,
  };
}

export function formatGlobalChatInsideLabel(chat: GlobalChatRoom): string {
  const stats = resolveGlobalChatLiveStats(chat);

  return stats.membersInside.toLocaleString() + ' inside';
}

export function formatGlobalChatPresenceMeta(chat: GlobalChatRoom): string {
  const stats = resolveGlobalChatLiveStats(chat);
  const parts: string[] = [];

  if (!chat.isOfficial && chat.createdBy !== 'Nami') {
    parts.push('by ' + chat.createdBy);

    if (chat.creatorVerified) {
      parts.push('Verified');
    }
  }

  parts.push(stats.activeNow.toLocaleString() + ' active now');
  parts.push(stats.membersInside.toLocaleString() + ' in chat');

  if (chat.kind === 'genre') {
    parts.push(stats.weeklyActive.toLocaleString() + ' active this week');
  }

  return parts.join(' · ');
}

export function useGlobalChatLiveStats(chat: GlobalChatRoom): ChatLiveStats {
  useMemberChatTimeVersion();
  useGenreChatActivityVersion();

  return resolveGlobalChatLiveStats(chat);
}

export function channelChatPresenceId(channelId: string): string {
  return channelId + '-game-chat';
}

export function channelChatPresenceTarget(channelId: string, channelName = 'Channel chat') {
  return {
    chatId: channelChatPresenceId(channelId),
    chatTitle: channelName + ' Game Chat',
    surfaceLabel: 'Game Channel',
    channelId,
  };
}