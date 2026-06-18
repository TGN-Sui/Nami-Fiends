import { afterEach, describe, expect, it } from 'vitest';

import { genreOfficialChats } from './global-chats.js';
import {
  notifyGenreBroadcastVoteListenersForTests,
  readGenreBroadcastVoteSnapshot,
  resetGenreBroadcastVoteStoreForTests,
} from './genre-chat-broadcast-vote-store.js';

afterEach(() => {
  resetGenreBroadcastVoteStoreForTests();
});

describe('genre-chat-broadcast-vote-store snapshots', () => {
  it('reuses the same snapshot object between reads until the store emits', () => {
    const chat = genreOfficialChats[0]!;

    const firstSnapshot = readGenreBroadcastVoteSnapshot(chat, 'm1');
    const secondSnapshot = readGenreBroadcastVoteSnapshot(chat, 'm1');

    expect(secondSnapshot).toBe(firstSnapshot);

    notifyGenreBroadcastVoteListenersForTests();

    const thirdSnapshot = readGenreBroadcastVoteSnapshot(chat, 'm1');

    expect(thirdSnapshot).not.toBe(firstSnapshot);
  });
});