import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('member-chat-time-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('accumulates weekly chat hours for a member', async () => {
    const { recordMemberChatTime, memberChatPresenceForMember } = await import(
      './member-chat-time-store.js'
    );

    recordMemberChatTime('m1', {
      chatId: 'genre-shooter',
      chatTitle: 'Shooter Lounge',
      surfaceLabel: 'Genre Lounge',
    }, 90 * 60 * 1000);

    recordMemberChatTime('m1', {
      chatId: 'genre-shooter',
      chatTitle: 'Shooter Lounge',
      surfaceLabel: 'Genre Lounge',
    }, 30 * 60 * 1000);

    const presence = memberChatPresenceForMember('m1');

    expect(presence).toHaveLength(1);
    expect(presence[0]?.chatTitle).toBe('Shooter Lounge');
    expect(presence[0]?.hoursThisWeek).toBeCloseTo(2, 1);
  });

  it('sorts top chats by accumulated weekly hours', async () => {
    const { recordMemberChatTime, memberChatPresenceForMember } = await import(
      './member-chat-time-store.js'
    );

    recordMemberChatTime(
      'm1',
      { chatId: 'genre-moba', chatTitle: 'MOBA Lounge', surfaceLabel: 'Genre Lounge' },
      45 * 60 * 1000
    );
    recordMemberChatTime(
      'm1',
      { chatId: 'genre-shooter', chatTitle: 'Shooter Lounge', surfaceLabel: 'Genre Lounge' },
      2 * 60 * 60 * 1000
    );

    const presence = memberChatPresenceForMember('m1');

    expect(presence[0]?.chatId).toBe('genre-shooter');
    expect(presence[1]?.chatId).toBe('genre-moba');
  });
});