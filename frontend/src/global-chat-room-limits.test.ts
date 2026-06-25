import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GlobalChatRoom } from './global-chats.js';
import {
  canMemberOpenAnotherTemporaryChat,
  countUserOwnedTemporaryChats,
  filterHubGlobalChats,
  isUserOwnedTemporaryChat,
  MAX_MEMBER_TEMPORARY_GLOBAL_CHATS,
} from './global-chat-room-limits.js';

const selfName = 'HarborMint';

function ownedRoom(id: string, title: string): GlobalChatRoom {
  return {
    id,
    title,
    kind: 'temporary',
    createdBy: selfName,
    creatorVerified: true,
    activeMembers: 1,
    voiceEnabled: false,
    isOfficial: false,
    closesOnExit: true,
  };
}

describe('global-chat-room-limits', () => {
  it('counts only user-owned temporary chats toward the cap', () => {
    const chats = [
      ownedRoom('temp-1', 'Squad Room'),
      ownedRoom('temp-2', 'Raid Room'),
      {
        id: 'global-lfg-arena',
        title: 'Looking For Group',
        kind: 'temporary',
        createdBy: 'Other',
        creatorVerified: true,
        activeMembers: 12,
        voiceEnabled: true,
        isOfficial: false,
        closesOnExit: true,
      },
    ] as GlobalChatRoom[];

    expect(countUserOwnedTemporaryChats(chats, selfName)).toBe(2);
    expect(isUserOwnedTemporaryChat(chats[0]!, selfName)).toBe(true);
    expect(isUserOwnedTemporaryChat(chats[2]!, selfName)).toBe(false);
  });

  it('blocks another lounge once the cap is reached', () => {
    const chats = [
      ownedRoom('temp-1', 'One'),
      ownedRoom('temp-2', 'Two'),
      ownedRoom('temp-3', 'Three'),
    ];

    expect(canMemberOpenAnotherTemporaryChat(chats, selfName, MAX_MEMBER_TEMPORARY_GLOBAL_CHATS)).toBe(
      false
    );
  });

  it('filters hub rooms by section and search query', () => {
    const chats = [
      {
        id: 'official-nami-global',
        title: 'Official Nami Global Chat',
        kind: 'official',
        createdBy: 'Nami',
        creatorVerified: true,
        activeMembers: 100,
        voiceEnabled: true,
        isOfficial: true,
        closesOnExit: false,
      },
      ownedRoom('temp-9', 'Friday Squad'),
      {
        id: 'global-cozy-corner',
        title: 'Cozy Corner',
        kind: 'temporary',
        createdBy: 'PebbleFan',
        creatorVerified: false,
        activeMembers: 12,
        voiceEnabled: true,
        isOfficial: false,
        closesOnExit: true,
      },
    ] as GlobalChatRoom[];

    expect(filterHubGlobalChats(chats, 'mine', selfName).map((chat) => chat.id)).toEqual(['temp-9']);
    expect(filterHubGlobalChats(chats, 'official', selfName).map((chat) => chat.id)).toEqual([
      'official-nami-global',
    ]);
    expect(filterHubGlobalChats(chats, 'all', selfName, 'cozy').map((chat) => chat.id)).toEqual([
      'global-cozy-corner',
    ]);
  });
});

describe('global-chat-rooms-store', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();

    vi.stubGlobal('window', {
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        clear: () => {
          storage.clear();
        },
      },
    });
  });

  it('persists created lounges and enforces the cap', async () => {
    const {
      createMemberTemporaryGlobalChat,
      readMemberTemporaryGlobalChats,
      resetMemberTemporaryGlobalChatsForTests,
    } = await import('./global-chat-rooms-store.js');

    resetMemberTemporaryGlobalChatsForTests();

    expect(
      createMemberTemporaryGlobalChat({
        title: 'Room One',
        voiceEnabled: false,
        creatorName: selfName,
      }).ok
    ).toBe(true);
    expect(
      createMemberTemporaryGlobalChat({
        title: 'Room Two',
        voiceEnabled: true,
        creatorName: selfName,
      }).ok
    ).toBe(true);
    expect(
      createMemberTemporaryGlobalChat({
        title: 'Room Three',
        voiceEnabled: false,
        creatorName: selfName,
      }).ok
    ).toBe(true);

    const capped = createMemberTemporaryGlobalChat({
      title: 'Room Four',
      voiceEnabled: false,
      creatorName: selfName,
    });

    expect(capped.ok).toBe(false);
    if (!capped.ok) {
      expect(capped.reason).toBe('cap_reached');
    }

    expect(readMemberTemporaryGlobalChats()).toHaveLength(3);
  });
});