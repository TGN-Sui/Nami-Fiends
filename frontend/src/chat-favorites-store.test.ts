import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

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

vi.mock('./chat-favorites-api.js', () => ({
  isChatFavoritesApiAvailable: () => false,
}));

vi.mock('./member-access.js', () => ({
  getSelfMember: () => ({ id: 'm1', name: 'Self' }),
  readSignedInOwner: () => null,
}));

describe('chat-favorites-store', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('swaps a genre favorite when a third genre is selected', async () => {
    const { toggleGenreFavorite } = await import('./chat-favorites-store.js');

    toggleGenreFavorite('genre-racing');

    const stored = JSON.parse(storage.get('nami.user.chat-favorites') ?? '{}') as {
      roomIds: string[];
    };

    expect(stored.roomIds).toContain('genre-racing');
    expect(stored.roomIds.filter((roomId) => roomId.startsWith('genre-'))).toHaveLength(2);
    expect(stored.roomIds).toContain('member-public-live-m1');
  });
});