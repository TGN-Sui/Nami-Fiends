import { describe, expect, it } from 'vitest';

import { genreOfficialChats } from './global-chats.js';
import {
  genreBroadcastsForChat,
  hasTaggedGenreBroadcasts,
  previewGenreBroadcastsForChat,
} from './genre-chat-broadcasts.js';

describe('genre-chat-broadcasts', () => {
  it('returns no tagged broadcasts until stream tag discovery ships', () => {
    const chat = genreOfficialChats[0]!;

    expect(genreBroadcastsForChat(chat)).toEqual([]);
    expect(hasTaggedGenreBroadcasts(chat)).toBe(false);
  });

  it('keeps preview broadcasts available for dev tooling only', () => {
    const chat = genreOfficialChats[0]!;

    expect(previewGenreBroadcastsForChat(chat).length).toBeGreaterThan(0);
  });
});