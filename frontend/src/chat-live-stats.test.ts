import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveChannelChatLiveStats, resolveGlobalChatLiveStats } from './chat-live-stats.js';
import type { GlobalChatRoom } from './global-chats.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('chat-live-stats', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createLocalStorageMock() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('counts members inside a global chat from message authors', () => {
    const chat: GlobalChatRoom = {
      id: 'genre-shooter',
      title: 'Shooter',
      kind: 'genre',
      genre: 'Shooter',
      createdBy: 'Nami',
      creatorVerified: true,
      activeMembers: 920,
      voiceEnabled: true,
      isOfficial: true,
      closesOnExit: false,
    };

    const stats = resolveGlobalChatLiveStats(chat, [
      { author: 'HarborMint' },
      { author: 'StormRelay' },
      { author: 'HarborMint' },
    ]);

    expect(stats.membersInside).toBeGreaterThanOrEqual(2);
    expect(stats.weeklyActive).toBeGreaterThanOrEqual(2);
  });

  it('counts members inside channel chat from unique authors', () => {
    const stats = resolveChannelChatLiveStats('vortex', [
      { author: 'NexusPilot' },
      { author: 'StormRelay' },
      { author: 'NexusPilot' },
    ]);

    expect(stats.membersInside).toBe(2);
    expect(stats.activeNow).toBeGreaterThanOrEqual(1);
  });
});