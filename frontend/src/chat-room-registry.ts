import { memberPublicChatId, memberPublicChatRoom } from './member-public-chat.js';
import {
  genreOfficialChats,
  globalChatSurfaceLabel,
  type GlobalChatRoom,
} from './global-chats.js';
import { members, type NamiMember } from './uiMockData.js';

export function isMemberPublicChatRoomId(roomId: string): boolean {
  return roomId.startsWith('member-public-live-');
}

export function isGenreChatRoomId(roomId: string): boolean {
  return roomId.startsWith('genre-');
}

export function memberPublicChatHostMemberId(roomId: string): string | null {
  if (!isMemberPublicChatRoomId(roomId)) {
    return null;
  }

  return roomId.slice('member-public-live-'.length);
}

export function defaultFavoriteRoomIds(memberId: string): string[] {
  return ['genre-shooter', 'genre-moba', memberPublicChatId(memberId)];
}

export function favoriteRoomTabLabel(roomId: string, selfMember: NamiMember): string {
  if (roomId === memberPublicChatId(selfMember.id)) {
    return 'My Chat';
  }

  const genreRoom = genreOfficialChats.find((chat) => chat.id === roomId);

  if (genreRoom) {
    return genreRoom.title;
  }

  const hostMemberId = memberPublicChatHostMemberId(roomId);

  if (hostMemberId) {
    const host = members.find((member) => member.id === hostMemberId);

    return host ? host.name : 'Live Chat';
  }

  const resolved = resolveFavoriteChatRoom(roomId, selfMember);

  return resolved ? globalChatSurfaceLabel(resolved) : 'Chat';
}

export function resolveFavoriteChatRoom(roomId: string, selfMember: NamiMember): GlobalChatRoom | null {
  const genreRoom = genreOfficialChats.find((chat) => chat.id === roomId);

  if (genreRoom) {
    return genreRoom;
  }

  const hostMemberId = memberPublicChatHostMemberId(roomId);

  if (hostMemberId) {
    const host = members.find((member) => member.id === hostMemberId) ?? selfMember;

    return memberPublicChatRoom(host);
  }

  return null;
}

export function countGenreFavorites(roomIds: string[]): number {
  return roomIds.filter((roomId) => isGenreChatRoomId(roomId)).length;
}

export function validateFavoriteSelection(roomIds: string[], memberId: string): string | null {
  const ownRoomId = memberPublicChatId(memberId);

  if (!roomIds.includes(ownRoomId)) {
    return 'Your public live chat must stay pinned.';
  }

  if (countGenreFavorites(roomIds) > 2) {
    return 'You can pin up to two genre lounges.';
  }

  if (roomIds.length === 0) {
    return 'Pick at least one chat room.';
  }

  return null;
}