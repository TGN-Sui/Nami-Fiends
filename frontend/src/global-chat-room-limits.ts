import type { GlobalChatRoom } from './global-chats.js';

export const MAX_MEMBER_TEMPORARY_GLOBAL_CHATS = 3;

export function isUserOwnedTemporaryChat(chat: GlobalChatRoom, memberName: string): boolean {
  return (
    chat.kind === 'temporary' &&
    chat.closesOnExit &&
    chat.createdBy === memberName &&
    chat.id.startsWith('temp-')
  );
}

export function countUserOwnedTemporaryChats(
  chats: readonly GlobalChatRoom[],
  memberName: string
): number {
  return chats.filter((chat) => isUserOwnedTemporaryChat(chat, memberName)).length;
}

export function canMemberOpenAnotherTemporaryChat(
  chats: readonly GlobalChatRoom[],
  memberName: string,
  maxRooms = MAX_MEMBER_TEMPORARY_GLOBAL_CHATS
): boolean {
  return countUserOwnedTemporaryChats(chats, memberName) < maxRooms;
}

export function temporaryChatQuotaLabel(
  chats: readonly GlobalChatRoom[],
  memberName: string,
  maxRooms = MAX_MEMBER_TEMPORARY_GLOBAL_CHATS
): string {
  const used = countUserOwnedTemporaryChats(chats, memberName);

  return used + '/' + maxRooms + ' open lounges';
}

export type GlobalChatHubFilter = 'all' | 'official' | 'community' | 'mine';

export function globalChatHubSectionLabel(chat: GlobalChatRoom, selfMemberName: string): string {
  if (chat.kind === 'official') {
    return 'Official';
  }

  if (isUserOwnedTemporaryChat(chat, selfMemberName)) {
    return 'Yours';
  }

  if (chat.kind === 'temporary') {
    return 'Community';
  }

  return 'Global';
}

export function filterHubGlobalChats(
  chats: readonly GlobalChatRoom[],
  filter: GlobalChatHubFilter,
  selfMemberName: string,
  searchQuery = ''
): GlobalChatRoom[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return chats.filter((chat) => {
    if (filter === 'official' && chat.kind !== 'official') {
      return false;
    }

    if (filter === 'community' && !(chat.kind === 'temporary' && !isUserOwnedTemporaryChat(chat, selfMemberName))) {
      return false;
    }

    if (filter === 'mine' && !isUserOwnedTemporaryChat(chat, selfMemberName)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [chat.title, chat.createdBy, globalChatHubSectionLabel(chat, selfMemberName)]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}