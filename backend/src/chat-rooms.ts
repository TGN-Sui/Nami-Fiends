const MEMBER_PUBLIC_CHAT_PATTERN = /^member-public-live-[a-zA-Z0-9_-]+$/;
const GENRE_CHAT_PATTERN = /^genre-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GLOBAL_CHAT_PATTERN = /^global-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ALLOWED_STATIC_ROOM_IDS = new Set(['official-nami-global', 'global-welcome-lounge']);

export const CHAT_FAVORITE_LIMITS = {
  maxRooms: 8,
  maxGenreRooms: 2,
} as const;

export function isMemberPublicChatRoomId(roomId: string): boolean {
  return MEMBER_PUBLIC_CHAT_PATTERN.test(roomId);
}

export function memberPublicChatHostMemberId(roomId: string): string | null {
  if (!isMemberPublicChatRoomId(roomId)) {
    return null;
  }

  return roomId.slice('member-public-live-'.length);
}

export function isGenreChatRoomId(roomId: string): boolean {
  return GENRE_CHAT_PATTERN.test(roomId);
}

export function isAllowedChatRoomId(roomId: string): boolean {
  if (ALLOWED_STATIC_ROOM_IDS.has(roomId)) {
    return true;
  }

  if (isGenreChatRoomId(roomId)) {
    return true;
  }

  if (GLOBAL_CHAT_PATTERN.test(roomId)) {
    return true;
  }

  return isMemberPublicChatRoomId(roomId);
}

export function validateFavoriteRoomIds(roomIds: string[], memberId: string): string[] {
  if (!Array.isArray(roomIds) || roomIds.length === 0) {
    throw new Error('chat_favorites_empty');
  }

  if (roomIds.length > CHAT_FAVORITE_LIMITS.maxRooms) {
    throw new Error('chat_favorites_too_many');
  }

  const unique = [...new Set(roomIds.map((roomId) => roomId.trim()).filter(Boolean))];

  if (unique.length !== roomIds.length) {
    throw new Error('chat_favorites_duplicate');
  }

  let genreCount = 0;

  for (const roomId of unique) {
    if (!isAllowedChatRoomId(roomId)) {
      throw new Error('chat_favorites_room_not_allowed');
    }

    if (isGenreChatRoomId(roomId)) {
      genreCount += 1;
    }
  }

  if (genreCount > CHAT_FAVORITE_LIMITS.maxGenreRooms) {
    throw new Error('chat_favorites_too_many_genre');
  }

  const ownRoomId = 'member-public-live-' + memberId;

  if (!unique.includes(ownRoomId)) {
    throw new Error('chat_favorites_missing_own_room');
  }

  return unique;
}